/**
 * 前台会员数据访问层
 *
 * 只碰会员相关表（users / user_identities / favorites / points_ledger / user_tokens）
 * 以及 orders 的归属列。后台 dao 仍负责商品、优惠券、员工等。
 */

import crypto from 'node:crypto';
import { all, get, run, tx, now, uid } from '@/lib/db/loader';
import { hashPassword } from './auth';

export type UserRow = {
  id: string;
  email: string;
  name: string | null;
  password_hash: string | null;
  avatar_url: string | null;
  birthday: string | null;
  points: number;
  tier: string;
  status: string;
  marketing_opt_in: number;
  email_verified: number;
  birthday_gift_year: number | null;
  created_at: number;
  last_login_at: number | null;
};

export function findUserByEmail(email: string): UserRow | null {
  return get<UserRow>('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
}

export function findUserById(id: string): UserRow | null {
  return get<UserRow>('SELECT * FROM users WHERE id = ?', [id]);
}

export function createUser(input: {
  email: string;
  name?: string | null;
  password?: string | null;
  avatarUrl?: string | null;
  birthday?: string | null;
  marketingOptIn?: boolean;
  emailVerified?: boolean;
  provider: 'password' | 'google' | 'apple';
  providerUid: string;
}): UserRow {
  const email = input.email.trim().toLowerCase();
  const id = uid('usr');
  // 密码账户的 provider_uid 就用自身 userId（email 可改，id 不会）
  const providerUid = input.providerUid || id;
  tx(() => {
    run(
      `INSERT INTO users (id, email, name, password_hash, avatar_url, birthday, points, tier, status,
        marketing_opt_in, email_verified, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, 'initiate', 'active', ?, ?, ?)`,
      [
        id,
        email,
        input.name ?? null,
        input.password ? hashPassword(input.password) : null,
        input.avatarUrl ?? null,
        input.birthday ?? null,
        input.marketingOptIn === false ? 0 : 1,
        input.emailVerified ? 1 : 0,
        now(),
      ]
    );
    run(
      `INSERT INTO user_identities (user_id, provider, provider_uid, email, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [id, input.provider, providerUid, email, now()]
    );
    // 历史游客订单按邮箱认领：注册后立刻能看到自己以前买过什么
    run('UPDATE orders SET user_id = ? WHERE lower(email) = ? AND user_id IS NULL', [id, email]);
    // 客户表同步（后台用户管理可见）
    const existing = get<{ id: string }>('SELECT id FROM customers WHERE email = ?', [email]);
    if (!existing) {
      run(
        `INSERT INTO customers (id, email, name, tags, order_count, total_spent, created_at)
         VALUES (?, ?, ?, '[]', 0, 0, ?)`,
        [uid('cus'), email, input.name ?? null, now()]
      );
    }
  });
  return findUserById(id)!;
}

/* ── 第三方身份 ── */

export function findIdentity(provider: string, providerUid: string) {
  return get<{ user_id: string }>(
    'SELECT user_id FROM user_identities WHERE provider = ? AND provider_uid = ?',
    [provider, providerUid]
  );
}

export function linkIdentity(userId: string, provider: string, providerUid: string, email?: string | null): void {
  const exists = findIdentity(provider, providerUid);
  if (exists) return;
  run(
    `INSERT INTO user_identities (user_id, provider, provider_uid, email, created_at) VALUES (?, ?, ?, ?, ?)`,
    [userId, provider, providerUid, email ?? null, now()]
  );
}

export function listIdentities(userId: string) {
  return all<{ provider: string; email: string | null; created_at: number }>(
    'SELECT provider, email, created_at FROM user_identities WHERE user_id = ? ORDER BY created_at ASC',
    [userId]
  );
}

export function unlinkIdentity(userId: string, provider: string): boolean {
  const user = findUserById(userId);
  if (!user?.password_hash) return false; // 没有密码就不允许解绑最后一个登录方式
  const n = get<{ n: number }>('SELECT COUNT(*) AS n FROM user_identities WHERE user_id = ?', [userId]);
  if ((n?.n ?? 0) <= 1) return false;
  run('DELETE FROM user_identities WHERE user_id = ? AND provider = ?', [userId, provider]);
  return true;
}

/* ── 资料 ── */

export function updateUser(
  userId: string,
  patch: {
    name?: string | null;
    birthday?: string | null;
    marketingOptIn?: boolean;
    password?: string;
    avatarUrl?: string | null;
    emailVerified?: boolean;
  }
): void {
  const fields: string[] = [];
  const vals: unknown[] = [];
  if (patch.name !== undefined) { fields.push('name = ?'); vals.push(patch.name); }
  if (patch.birthday !== undefined) { fields.push('birthday = ?'); vals.push(patch.birthday); }
  if (patch.marketingOptIn !== undefined) { fields.push('marketing_opt_in = ?'); vals.push(patch.marketingOptIn ? 1 : 0); }
  if (patch.password !== undefined) {
    fields.push('password_hash = ?');
    vals.push(hashPassword(patch.password));
    // 改密后记录 password 身份（若原本是纯 OAuth 账户）
    linkIdentity(userId, 'password', userId, null);
  }
  if (patch.avatarUrl !== undefined) { fields.push('avatar_url = ?'); vals.push(patch.avatarUrl); }
  if (patch.emailVerified !== undefined) { fields.push('email_verified = ?'); vals.push(patch.emailVerified ? 1 : 0); }
  if (!fields.length) return;
  vals.push(userId);
  run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, vals);
}

export function touchLogin(userId: string): void {
  run('UPDATE users SET last_login_at = ? WHERE id = ?', [now(), userId]);
}

/* ── 收藏 ── */

export function listFavorites(userId: string): { slug: string; created_at: number }[] {
  return all<{ slug: string; created_at: number }>(
    'SELECT slug, created_at FROM favorites WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
}

export function isFavorite(userId: string, slug: string): boolean {
  return Boolean(get('SELECT 1 AS x FROM favorites WHERE user_id = ? AND slug = ?', [userId, slug]));
}

/** 返回收藏后的状态 */
export function toggleFavorite(userId: string, slug: string): boolean {
  if (isFavorite(userId, slug)) {
    run('DELETE FROM favorites WHERE user_id = ? AND slug = ?', [userId, slug]);
    return false;
  }
  run('INSERT INTO favorites (user_id, slug, created_at) VALUES (?, ?, ?)', [userId, slug, now()]);
  return true;
}

export function favoriteCount(userId: string): number {
  return get<{ n: number }>('SELECT COUNT(*) AS n FROM favorites WHERE user_id = ?', [userId])?.n ?? 0;
}

/**
 * 批量删除收藏行 —— 用于清理「孤儿收藏」：
 * 商品已下架或整批更换目录后，favorites 里会留下指向不存在商品的行，
 * 导致账户页收藏计数与列表对不上（与购物车幽灵行同一类问题）。
 */
export function deleteFavorites(userId: string, slugs: string[]): void {
  if (slugs.length === 0) return;
  tx(() => {
    for (const slug of slugs) {
      run('DELETE FROM favorites WHERE user_id = ? AND slug = ?', [userId, slug]);
    }
  });
}

/* ── 订单 ── */

export type AccountOrder = {
  id: string;
  stripe_session_id: string | null;
  email: string;
  customer_name: string | null;
  items: string;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
  status: string;
  coupon_code: string | null;
  tracking_no: string | null;
  carrier: string | null;
  address: string | null;
  created_at: number;
  user_id: string | null;
};

const ORDER_COLS =
  'id, stripe_session_id, email, customer_name, items, subtotal, discount, shipping, tax, total, currency, status, coupon_code, tracking_no, carrier, address, created_at, user_id';

/**
 * 会员订单：user_id 归属优先，未归属的历史订单按邮箱匹配。
 * （注册/登录时会把匹配邮箱的旧订单认领过来，这里再兜一层，
 *   应对「下单邮箱大小写不一致」「事后换邮箱」这类边角。）
 */
export function listUserOrders(userId: string, email: string, limit = 100): AccountOrder[] {
  return all<AccountOrder>(
    `SELECT ${ORDER_COLS} FROM orders
     WHERE user_id = ? OR (user_id IS NULL AND lower(email) = ?)
     ORDER BY created_at DESC LIMIT ?`,
    [userId, email.trim().toLowerCase(), limit]
  );
}

export function findUserOrder(userId: string, email: string, orderId: string): AccountOrder | null {
  return get<AccountOrder>(
    `SELECT ${ORDER_COLS} FROM orders
     WHERE id = ? AND (user_id = ? OR (user_id IS NULL AND lower(email) = ?))`,
    [orderId, userId, email.trim().toLowerCase()]
  );
}

export function orderStats(userId: string, email: string): { count: number; spent: number } {
  const row = get<{ n: number; s: number }>(
    `SELECT COUNT(*) AS n, COALESCE(SUM(total), 0) AS s FROM orders
     WHERE user_id = ? OR (user_id IS NULL AND lower(email) = ?)`,
    [userId, email.trim().toLowerCase()]
  );
  return { count: row?.n ?? 0, spent: row?.s ?? 0 };
}

/* ── 退款申请 ── */

export type RefundRequest = {
  id: string;
  order_id: string;
  user_id: string | null;
  email: string;
  reason: string;
  amount: number;
  /** pending 待处理 | approved 已批准 | rejected 已拒绝 */
  status: string;
  admin_note: string | null;
  created_at: number;
  handled_at: number | null;
};

export function createRefundRequest(input: {
  orderId: string;
  userId: string;
  email: string;
  reason: string;
  amount: number;
}): RefundRequest {
  const row: RefundRequest = {
    id: uid('rf'),
    order_id: input.orderId,
    user_id: input.userId,
    email: input.email,
    reason: input.reason,
    amount: input.amount,
    status: 'pending',
    admin_note: null,
    created_at: now(),
    handled_at: null,
  };
  run(
    `INSERT INTO refund_requests
       (id, order_id, user_id, email, reason, amount, status, admin_note, created_at, handled_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.id,
      row.order_id,
      row.user_id,
      row.email,
      row.reason,
      row.amount,
      row.status,
      row.admin_note,
      row.created_at,
      row.handled_at,
    ]
  );
  return row;
}

/** 该订单最近一条退款申请 */
export function getRefundRequestByOrder(orderId: string): RefundRequest | null {
  return get<RefundRequest>(
    'SELECT * FROM refund_requests WHERE order_id = ? ORDER BY created_at DESC LIMIT 1',
    [orderId]
  );
}

export function listRefundRequests(userId: string): RefundRequest[] {
  return all<RefundRequest>(
    'SELECT * FROM refund_requests WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
}

/* ── 一次性令牌（找回密码 / 邮箱验证）── */

function sha256(v: string): string {
  return crypto.createHash('sha256').update(v).digest('hex');
}

export function createToken(userId: string, kind: 'reset' | 'verify', ttlMs: number): string {
  const raw = crypto.randomBytes(32).toString('base64url');
  run(
    'INSERT INTO user_tokens (id, user_id, kind, expires_at, created_at) VALUES (?, ?, ?, ?, ?)',
    [sha256(raw), userId, kind, now() + ttlMs, now()]
  );
  return raw;
}

export function consumeToken(raw: string, kind: 'reset' | 'verify'): string | null {
  const id = sha256(raw);
  const row = get<{ user_id: string; expires_at: number; used_at: number | null }>(
    'SELECT user_id, expires_at, used_at FROM user_tokens WHERE id = ? AND kind = ?',
    [id, kind]
  );
  if (!row || row.used_at || row.expires_at < now()) return null;
  run('UPDATE user_tokens SET used_at = ? WHERE id = ?', [now(), id]);
  return row.user_id;
}
