/**
 * 后台数据访问层 —— 所有管理操作走这里
 */

import { all, get, run, tx, now, uid } from '../db/loader';
import { hashPassword, verifyPassword } from './auth';
import { ROLE_DEFAULTS } from '../db/schema';
import type { ModuleKey } from '../db/schema';
import type { StaffSession } from './auth';

/* ── 员工 ── */

export type Staff = {
  id: string;
  username: string;
  password_hash: string;
  name: string;
  role: string;
  permissions: string;
  status: string;
  created_at: number;
  last_login_at: number | null;
};

export function findStaffByUsername(username: string): Staff | null {
  return get<Staff>('SELECT * FROM staff WHERE username = ?', [username]);
}

export function findStaffById(id: string): Staff | null {
  return get<Staff>('SELECT * FROM staff WHERE id = ?', [id]);
}

export function listStaff(): Staff[] {
  return all<Staff>('SELECT * FROM staff ORDER BY created_at ASC');
}

export function createStaff(input: {
  username: string;
  password: string;
  name: string;
  role: string;
  permissions?: ModuleKey[];
}): Staff {
  const id = uid('stf');
  const perms = input.permissions ?? ROLE_DEFAULTS[input.role] ?? [];
  run(
    `INSERT INTO staff (id, username, password_hash, name, role, permissions, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
    [id, input.username, hashPassword(input.password), input.name, input.role, JSON.stringify(perms), now()]
  );
  return findStaffById(id)!;
}

export function updateStaff(
  id: string,
  patch: Partial<{ name: string; role: string; permissions: ModuleKey[]; status: string; password: string }>
): void {
  const fields: string[] = [];
  const vals: unknown[] = [];
  if (patch.name !== undefined) { fields.push('name = ?'); vals.push(patch.name); }
  if (patch.role !== undefined) { fields.push('role = ?'); vals.push(patch.role); }
  if (patch.permissions !== undefined) { fields.push('permissions = ?'); vals.push(JSON.stringify(patch.permissions)); }
  if (patch.status !== undefined) { fields.push('status = ?'); vals.push(patch.status); }
  if (patch.password !== undefined) { fields.push('password_hash = ?'); vals.push(hashPassword(patch.password)); }
  if (!fields.length) return;
  vals.push(id);
  run(`UPDATE staff SET ${fields.join(', ')} WHERE id = ?`, vals);
}

export function deleteStaff(id: string): void {
  run('DELETE FROM staff WHERE id = ?', [id]);
}

export function touchStaffLogin(id: string): void {
  run('UPDATE staff SET last_login_at = ? WHERE id = ?', [now(), id]);
}

export function authenticate(username: string, password: string): StaffSession | null {
  const staff = findStaffByUsername(username);
  if (!staff || staff.status !== 'active') return null;
  if (!verifyPassword(password, staff.password_hash)) return null;
  touchStaffLogin(staff.id);
  return {
    id: staff.id,
    username: staff.username,
    name: staff.name,
    role: staff.role,
    permissions: JSON.parse(staff.permissions || '[]'),
  };
}

/** 首次启动时播种超级管理员 ZHSM001 */
export function ensureSuperAdmin(): void {
  const existing = findStaffByUsername('ZHSM001');
  if (existing) {
    // 保证超管存在且角色正确（不覆盖密码）
    if (existing.role !== 'super') updateStaff(existing.id, { role: 'super' });
    return;
  }
  const count = get<{ n: number }>('SELECT COUNT(*) AS n FROM staff');
  if (count && count.n > 0) return; // 已有其他员工则不再播种
  createStaff({
    username: 'ZHSM001',
    password: process.env.ADMIN_INIT_PASSWORD || 'zhs@1505',
    name: '超级管理员',
    role: 'super',
  });
}

/* ── 审计日志 ── */

export function audit(staff: StaffSession | null, action: string, target?: string, detail?: string): void {
  run(
    'INSERT INTO audit_logs (staff_id, staff_name, action, target, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [staff?.id ?? null, staff?.name ?? null, action, target ?? null, detail ? JSON.stringify(detail) : null, now()]
  );
}

export function listAudit(limit = 100) {
  return all('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?', [limit]);
}

/* ── 客户 ── */

export type Customer = {
  id: string;
  email: string;
  name: string | null;
  tags: string;
  notes: string | null;
  order_count: number;
  total_spent: number;
  first_order_at: number | null;
  last_order_at: number | null;
  created_at: number;
};

export function listCustomers(opts: { tag?: string; q?: string } = {}): Customer[] {
  let sql = 'SELECT * FROM customers';
  const conds: string[] = [];
  const vals: unknown[] = [];
  if (opts.tag) { conds.push("tags LIKE ?"); vals.push(`%"${opts.tag}"%`); }
  if (opts.q) { conds.push('(email LIKE ? OR name LIKE ?)'); vals.push(`%${opts.q}%`, `%${opts.q}%`); }
  if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
  sql += ' ORDER BY created_at DESC';
  return all<Customer>(sql, vals);
}

export function findCustomerByEmail(email: string): Customer | null {
  return get<Customer>('SELECT * FROM customers WHERE email = ?', [email.toLowerCase()]);
}

export function upsertCustomerFromOrder(input: {
  email: string;
  name?: string | null;
  total: number;
}): Customer {
  const email = input.email.toLowerCase();
  const existing = findCustomerByEmail(email);
  if (existing) {
    run(
      `UPDATE customers SET
        order_count = order_count + 1,
        total_spent = total_spent + ?,
        last_order_at = ?,
        name = COALESCE(?, name)
       WHERE id = ?`,
      [input.total, now(), input.name ?? null, existing.id]
    );
    return findCustomerByEmail(email)!;
  }
  const id = uid('cus');
  run(
    `INSERT INTO customers (id, email, name, tags, order_count, total_spent, first_order_at, last_order_at, created_at)
     VALUES (?, ?, ?, '[]', 1, ?, ?, ?, ?)`,
    [id, email, input.name ?? null, input.total, now(), now(), now()]
  );
  return findCustomerByEmail(email)!;
}

export function updateCustomer(id: string, patch: { name?: string; tags?: string[]; notes?: string }): void {
  const fields: string[] = [];
  const vals: unknown[] = [];
  if (patch.name !== undefined) { fields.push('name = ?'); vals.push(patch.name); }
  if (patch.tags !== undefined) { fields.push('tags = ?'); vals.push(JSON.stringify(patch.tags)); }
  if (patch.notes !== undefined) { fields.push('notes = ?'); vals.push(patch.notes); }
  if (!fields.length) return;
  vals.push(id);
  run(`UPDATE customers SET ${fields.join(', ')} WHERE id = ?`, vals);
}

export function allTags(): string[] {
  const rows = all<{ tags: string }>('SELECT tags FROM customers');
  const set = new Set<string>();
  for (const r of rows) {
    try {
      for (const t of JSON.parse(r.tags || '[]')) if (t) set.add(String(t));
    } catch { /* ignore */ }
  }
  return [...set].sort();
}

/* ── 商品 ── */

export type Product = {
  slug: string;
  title: string;
  title_zh: string | null;
  tagline: string | null;
  description: string | null;
  category: string;
  collection: string | null;
  price_usd: number;
  compare_at_usd: number | null;
  images: string;
  status: string;
  stock: number;
  sort_order: number;
  meta: string;
  created_at: number;
  updated_at: number;
};

export function listProducts(includeDraft = true): Product[] {
  const sql = includeDraft
    ? 'SELECT * FROM products ORDER BY sort_order ASC, created_at DESC'
    : "SELECT * FROM products WHERE status = 'active' ORDER BY sort_order ASC, created_at DESC";
  return all<Product>(sql);
}

export function findProduct(slug: string): Product | null {
  return get<Product>('SELECT * FROM products WHERE slug = ?', [slug]);
}

export function saveProduct(input: {
  slug?: string;
  title: string;
  title_zh?: string;
  tagline?: string;
  description?: string;
  category: string;
  collection?: string | null;
  price_usd: number;
  compare_at_usd?: number | null;
  images: string[];
  status: string;
  stock: number;
  sort_order?: number;
  meta?: Record<string, unknown>;
}): Product {
  const slug = input.slug || uid('prd');
  const existing = findProduct(slug);
  if (existing) {
    run(
      `UPDATE products SET title=?, title_zh=?, tagline=?, description=?, category=?, collection=?, price_usd=?,
        compare_at_usd=?, images=?, status=?, stock=?, sort_order=?, meta=?, updated_at=? WHERE slug=?`,
      [
        input.title, input.title_zh ?? null, input.tagline ?? null, input.description ?? null, input.category,
        input.collection ?? null,
        input.price_usd, input.compare_at_usd ?? null, JSON.stringify(input.images), input.status, input.stock,
        input.sort_order ?? 0, JSON.stringify(input.meta ?? {}), now(), slug,
      ]
    );
  } else {
    run(
      `INSERT INTO products (slug, title, title_zh, tagline, description, category, collection, price_usd, compare_at_usd,
        images, status, stock, sort_order, meta, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        slug, input.title, input.title_zh ?? null, input.tagline ?? null, input.description ?? null, input.category,
        input.collection ?? null,
        input.price_usd, input.compare_at_usd ?? null, JSON.stringify(input.images), input.status, input.stock,
        input.sort_order ?? 0, JSON.stringify(input.meta ?? {}), now(), now(),
      ]
    );
  }
  return findProduct(slug)!;
}

export function setProductStatus(slug: string, status: 'active' | 'draft' | 'archived'): void {
  run('UPDATE products SET status = ?, updated_at = ? WHERE slug = ?', [status, now(), slug]);
}

export function deleteProduct(slug: string): void {
  run('DELETE FROM products WHERE slug = ?', [slug]);
}

/* ── 订单 ── */

export type Order = {
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
  address: string | null;
  payment_provider: string;
  provider_ref: string | null;
  created_at: number;
};

export function createOrder(input: Omit<Order, 'created_at'>): Order {
  run(
    `INSERT INTO orders (id, stripe_session_id, email, customer_name, items, subtotal, discount, shipping,
      tax, total, currency, status, coupon_code, tracking_no, address, payment_provider, provider_ref, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.id, input.stripe_session_id, input.email, input.customer_name, input.items, input.subtotal,
      input.discount, input.shipping, input.tax, input.total, input.currency, input.status, input.coupon_code,
      input.tracking_no, input.address, input.payment_provider ?? 'stripe', input.provider_ref ?? null, now(),
    ]
  );
  return get<Order>('SELECT * FROM orders WHERE id = ?', [input.id])!;
}

export function findOrderBySession(sessionId: string): Order | null {
  return get<Order>('SELECT * FROM orders WHERE stripe_session_id = ?', [sessionId]);
}

export function findOrderByProviderRef(provider: string, ref: string): Order | null {
  return get<Order>('SELECT * FROM orders WHERE payment_provider = ? AND provider_ref = ?', [provider, ref]);
}

/* ── 待支付订单快照（多渠道统一落库） ── */
export type PendingOrder = {
  provider_ref: string;
  provider: string;
  payload: string;
  status: string;
  created_at: number;
  completed_at: number | null;
  order_id: string | null;
};

export function addPendingOrder(p: { providerRef: string; provider: string; payload: string }): void {
  run(
    `INSERT OR REPLACE INTO pending_orders (provider_ref, provider, payload, status, created_at)
     VALUES (?, ?, ?, 'pending', ?)`,
    [p.providerRef, p.provider, p.payload, Date.now()]
  );
}

export function getPendingOrder(providerRef: string): PendingOrder | null {
  return get<PendingOrder>('SELECT * FROM pending_orders WHERE provider_ref = ?', [providerRef]);
}

export function completePendingOrder(providerRef: string, orderId: string): void {
  run(
    `UPDATE pending_orders SET status = 'completed', completed_at = ?, order_id = ? WHERE provider_ref = ?`,
    [Date.now(), orderId, providerRef]
  );
}

export function listOrders(opts: { status?: string; q?: string; limit?: number } = {}): Order[] {
  let sql = 'SELECT * FROM orders';
  const conds: string[] = [];
  const vals: unknown[] = [];
  if (opts.status && opts.status !== 'all') { conds.push('status = ?'); vals.push(opts.status); }
  if (opts.q) { conds.push('(email LIKE ? OR customer_name LIKE ? OR id LIKE ?)'); vals.push(`%${opts.q}%`, `%${opts.q}%`, `%${opts.q}%`); }
  if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
  sql += ' ORDER BY created_at DESC LIMIT ?';
  vals.push(opts.limit ?? 500);
  return all<Order>(sql, vals);
}

export function updateOrderStatus(id: string, status: string, trackingNo?: string, carrier?: string): void {
  const sets: string[] = ['status = ?'];
  const vals: unknown[] = [status];
  if (trackingNo !== undefined) {
    sets.push('tracking_no = ?');
    vals.push(trackingNo);
  }
  if (carrier !== undefined) {
    sets.push('carrier = ?');
    vals.push(carrier);
  }
  vals.push(id);
  run(`UPDATE orders SET ${sets.join(', ')} WHERE id = ?`, vals);
}

/* ── 退款申请（后台处理） ── */

export type AdminRefundRequest = {
  id: string;
  order_id: string;
  user_id: string | null;
  email: string;
  reason: string;
  amount: number;
  status: string;
  admin_note: string | null;
  created_at: number;
  handled_at: number | null;
  order_status: string | null;
  order_total: number | null;
  customer_name: string | null;
};

export function listRefundRequests(limit = 500): AdminRefundRequest[] {
  return all<AdminRefundRequest>(
    `SELECT r.*, o.status AS order_status, o.total AS order_total, o.customer_name AS customer_name
     FROM refund_requests r
     LEFT JOIN orders o ON o.id = r.order_id
     ORDER BY CASE r.status WHEN 'pending' THEN 0 ELSE 1 END, r.created_at DESC
     LIMIT ?`,
    [limit]
  );
}

export function getRefundRequest(id: string): AdminRefundRequest | null {
  return get<AdminRefundRequest>(
    `SELECT r.*, o.status AS order_status, o.total AS order_total, o.customer_name AS customer_name
     FROM refund_requests r
     LEFT JOIN orders o ON o.id = r.order_id
     WHERE r.id = ?`,
    [id]
  );
}

export function setRefundRequestStatus(id: string, status: string, adminNote?: string): void {
  if (adminNote !== undefined) {
    run('UPDATE refund_requests SET status = ?, admin_note = ?, handled_at = ? WHERE id = ?', [
      status,
      adminNote,
      now(),
      id,
    ]);
  } else {
    run('UPDATE refund_requests SET status = ?, handled_at = ? WHERE id = ?', [status, now(), id]);
  }
}

/* ── 优惠券 ── */

export type Coupon = {
  code: string;
  type: string;
  value: number;
  min_subtotal: number;
  max_uses: number;
  used_count: number;
  per_customer_limit: number;
  starts_at: number | null;
  ends_at: number | null;
  status: string;
  acquisition_mode: string;
  claim_count?: number;
  created_by: string | null;
  created_at: number;
};

export function listCoupons(): Coupon[] {
  return all<Coupon>(
    `SELECT c.*, (SELECT COUNT(*) FROM coupon_claims cc WHERE cc.code = c.code) AS claim_count
       FROM coupons c ORDER BY c.created_at DESC`
  );
}

export function findCoupon(code: string): Coupon | null {
  return get<Coupon>('SELECT * FROM coupons WHERE code = ?', [code.toUpperCase()]);
}

export function saveCoupon(input: Partial<Coupon> & { code: string }): Coupon {
  const existing = findCoupon(input.code);
  if (existing) {
    const fields: string[] = [];
    const vals: unknown[] = [];
    for (const k of ['type', 'value', 'min_subtotal', 'max_uses', 'per_customer_limit', 'starts_at', 'ends_at', 'status', 'acquisition_mode'] as const) {
      if (input[k] !== undefined) { fields.push(`${k} = ?`); vals.push(input[k]); }
    }
    if (fields.length) {
      vals.push(input.code);
      run(`UPDATE coupons SET ${fields.join(', ')} WHERE code = ?`, vals);
    }
    return findCoupon(input.code)!;
  }
  run(
    `INSERT INTO coupons (code, type, value, min_subtotal, max_uses, used_count, per_customer_limit,
      starts_at, ends_at, status, acquisition_mode, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.code.toUpperCase(), input.type ?? 'percent', input.value ?? 0, input.min_subtotal ?? 0,
      input.max_uses ?? 0, input.per_customer_limit ?? 0, input.starts_at ?? null, input.ends_at ?? null,
      input.status ?? 'active', input.acquisition_mode ?? 'manual', input.created_by ?? null, now(),
    ]
  );
  return findCoupon(input.code)!;
}

/** 识别免运费券：type='freeship'，不动商品金额，只把运费归零 */
export function isFreeshipCoupon(coupon: Pick<Coupon, 'type'>): boolean {
  return coupon.type === 'freeship';
}

/** 记一笔领券（已登录访客，同一人同券只记一次）。返回是否新增。 */
export function recordCouponClaim(code: string, email: string): boolean {
  const before = get<{ n: number }>('SELECT COUNT(*) AS n FROM coupon_claims WHERE code = ?', [code.toUpperCase()]);
  run('INSERT OR IGNORE INTO coupon_claims (code, email, created_at) VALUES (?, ?, ?)', [
    code.toUpperCase(), email.toLowerCase(), now(),
  ]);
  const after = get<{ n: number }>('SELECT COUNT(*) AS n FROM coupon_claims WHERE code = ?', [code.toUpperCase()]);
  return (after?.n ?? 0) > (before?.n ?? 0);
}

export function deleteCoupon(code: string): void {
  run('DELETE FROM coupons WHERE code = ?', [code]);
}

export function countCouponUses(code: string, email: string): number {
  const r = get<{ n: number }>('SELECT COUNT(*) AS n FROM coupon_uses WHERE code = ? AND email = ?', [code, email.toLowerCase()]);
  return r?.n ?? 0;
}

export function recordCouponUse(code: string, email: string, orderId: string, amount: number): void {
  tx(() => {
    run('INSERT INTO coupon_uses (code, email, order_id, amount, created_at) VALUES (?, ?, ?, ?, ?)', [
      code, email.toLowerCase(), orderId, amount, now(),
    ]);
    run('UPDATE coupons SET used_count = used_count + 1 WHERE code = ?', [code]);
  });
}

/* ── 节日折扣 ── */

export type SaleEvent = {
  id: string;
  name: string;
  discount_percent: number;
  applies_to: string;
  target: string;
  starts_at: number;
  ends_at: number;
  status: string;
  created_at: number;
};

export function listSaleEvents(): SaleEvent[] {
  return all<SaleEvent>('SELECT * FROM sale_events ORDER BY starts_at DESC');
}

export function saveSaleEvent(input: Partial<SaleEvent> & { name: string; discount_percent: number; starts_at: number; ends_at: number }): SaleEvent {
  const id = input.id || uid('sale');
  const existing = input.id ? get<SaleEvent>('SELECT * FROM sale_events WHERE id = ?', [input.id]) : null;
  if (existing) {
    const fields: string[] = [];
    const vals: unknown[] = [];
    for (const k of ['name', 'discount_percent', 'applies_to', 'target', 'starts_at', 'ends_at', 'status'] as const) {
      if (input[k] !== undefined) { fields.push(`${k} = ?`); vals.push(input[k]); }
    }
    if (fields.length) {
      vals.push(id);
      run(`UPDATE sale_events SET ${fields.join(', ')} WHERE id = ?`, vals);
    }
  } else {
    run(
      `INSERT INTO sale_events (id, name, discount_percent, applies_to, target, starts_at, ends_at, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, input.name, input.discount_percent, input.applies_to ?? 'all',
        typeof input.target === 'string' ? input.target : JSON.stringify(input.target ?? []),
        input.starts_at, input.ends_at, input.status ?? 'active', now(),
      ]
    );
  }
  return get<SaleEvent>('SELECT * FROM sale_events WHERE id = ?', [id])!;
}

export function deleteSaleEvent(id: string): void {
  run('DELETE FROM sale_events WHERE id = ?', [id]);
}

/** 当前生效的节日折扣（返回折扣百分比，无则 0） */
export function activeSalePercent(productSlug: string, category: string): number {
  const t = now();
  const rows = all<SaleEvent>(
    `SELECT * FROM sale_events WHERE status = 'active' AND starts_at <= ? AND ends_at >= ?`,
    [t, t]
  );
  let best = 0;
  for (const s of rows) {
    let applies = false;
    if (s.applies_to === 'all') applies = true;
    else {
      try {
        const targets = JSON.parse(s.target || '[]');
        applies = targets.includes(productSlug) || targets.includes(category);
      } catch { applies = false; }
    }
    if (applies && s.discount_percent > best) best = s.discount_percent;
  }
  return best;
}

/* ── 邮件活动 ── */

export type Campaign = {
  id: string;
  name: string;
  subject: string;
  body: string;
  target_tags: string;
  status: string;
  sent_count: number;
  created_by: string | null;
  created_at: number;
  sent_at: number | null;
};

export function listCampaigns(): Campaign[] {
  return all<Campaign>('SELECT * FROM campaigns ORDER BY created_at DESC');
}

export function findCampaign(id: string): Campaign | null {
  return get<Campaign>('SELECT * FROM campaigns WHERE id = ?', [id]);
}

export function saveCampaign(input: {
  id?: string;
  name: string;
  subject: string;
  body: string;
  target_tags: string[];
  created_by?: string;
}): Campaign {
  const id = input.id || uid('cmp');
  if (input.id) {
    run(
      `UPDATE campaigns SET name=?, subject=?, body=?, target_tags=? WHERE id=?`,
      [input.name, input.subject, input.body, JSON.stringify(input.target_tags), input.id]
    );
  } else {
    run(
      `INSERT INTO campaigns (id, name, subject, body, target_tags, status, sent_count, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, 'draft', 0, ?, ?)`,
      [id, input.name, input.subject, input.body, JSON.stringify(input.target_tags), input.created_by ?? null, now()]
    );
  }
  return findCampaign(id)!;
}

export function deleteCampaign(id: string): void {
  run('DELETE FROM campaigns WHERE id = ?', [id]);
}

export function updateCampaignStatus(id: string, status: string, sentCount?: number, sentAt?: number): void {
  if (sentCount !== undefined && sentAt !== undefined) {
    run('UPDATE campaigns SET status = ?, sent_count = ?, sent_at = ? WHERE id = ?', [status, sentCount, sentAt, id]);
  } else {
    run('UPDATE campaigns SET status = ? WHERE id = ?', [status, id]);
  }
}

export function logEmail(campaignId: string | null, email: string, status: string, error?: string): void {
  run('INSERT INTO email_logs (campaign_id, email, status, error, created_at) VALUES (?, ?, ?, ?, ?)', [
    campaignId, email, status, error ?? null, now(),
  ]);
}

export function listEmailLogs(campaignId?: string, limit = 200) {
  if (campaignId) {
    return all('SELECT * FROM email_logs WHERE campaign_id = ? ORDER BY created_at DESC LIMIT ?', [campaignId, limit]);
  }
  return all('SELECT * FROM email_logs ORDER BY created_at DESC LIMIT ?', [limit]);
}
