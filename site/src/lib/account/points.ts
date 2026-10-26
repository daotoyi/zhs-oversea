/**
 * 会员积分体系
 *
 * 规则集中在此文件（改规则只改这里）：
 * - 注册礼：+100 分
 * - 消费：每 $1 = 1 分（以实付金额为准，退款不追扣，靠人工调整）
 * - 生日礼：生日当月发放一次，+200 分 + 15% 生日券（30 天有效）
 * - 兑换：积分换优惠券（券写入 coupons 表，结账走既有折扣引擎，无需改动结账逻辑）
 */

import crypto from 'node:crypto';
import { all, get, run, tx, now } from '@/lib/db/loader';
import { saveCoupon, recordCouponClaim } from '@/lib/admin/dao';
import { findUserById } from './dao';
import type { UserRow } from './dao';

export const SIGNUP_BONUS = 100;
export const BIRTHDAY_BONUS = 200;
export const BIRTHDAY_COUPON_PERCENT = 15;

export type Tier = { key: string; labelEn: string; labelZh: string; min: number; rate: number };

/** 会员等级：等级只影响展示与未来的专属权益，积分兑换比率不区分等级 */
export const TIERS: Tier[] = [
  { key: 'initiate', labelEn: 'Initiate', labelZh: '入门', min: 0, rate: 1 },
  { key: 'adept', labelEn: 'Adept', labelZh: '精进', min: 800, rate: 1 },
  { key: 'elder', labelEn: 'Elder', labelZh: '守静', min: 3000, rate: 1 },
  { key: 'master', labelEn: 'Master', labelZh: '真人', min: 8000, rate: 1 },
];

export function tierFor(points: number): Tier {
  let current = TIERS[0];
  for (const t of TIERS) if (points >= t.min) current = t;
  return current;
}

export function nextTier(points: number): Tier | null {
  return TIERS.find((t) => t.min > points) ?? null;
}

/* ── 兑换档位（points → 券面额，单位：美分）── */

export type RedeemOption = { points: number; valueCents: number; labelEn: string; labelZh: string };

export const REDEEM_OPTIONS: RedeemOption[] = [
  { points: 500, valueCents: 500, labelEn: '$5 off', labelZh: '立减 $5' },
  { points: 1000, valueCents: 1200, labelEn: '$12 off', labelZh: '立减 $12' },
  { points: 2000, valueCents: 3000, labelEn: '$30 off', labelZh: '立减 $30' },
];

/* ── 记账 ── */

export function award(userId: string, delta: number, reason: string, ref?: string, note?: string): number {  return tx(() => {
    const user = findUserById(userId);
    if (!user) throw new Error('user not found');
    const balance = Math.max(0, user.points + delta);
    run('UPDATE users SET points = ? WHERE id = ?', [balance, userId]);
    run('UPDATE users SET tier = ? WHERE id = ?', [tierFor(balance).key, userId]);
    run(
      `INSERT INTO points_ledger (user_id, delta, balance_after, reason, ref, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, delta, balance, reason, ref ?? null, note ?? null, now()]
    );
    return balance;
  });
}

/** 幂等：同一 ref 只发一次 */
function awardedAlready(userId: string, reason: string, ref: string): boolean {
  return Boolean(
    get('SELECT 1 AS x FROM points_ledger WHERE user_id = ? AND reason = ? AND ref = ?', [userId, reason, ref])
  );
}

export function awardSignup(userId: string): void {
  if (awardedAlready(userId, 'signup', userId)) return;
  award(userId, SIGNUP_BONUS, 'signup', userId, '注册礼');
}

/**
 * 新人礼：每个新注册用户发一张「免运费」券。
 * - 独立一次性码（max_uses=1）：computeDiscount 不校验 per_customer_limit，
 *   用独立码 + max_uses 才能确保「一人一张、只能用一次」，不会被反复刷。
 * - 幂等：靠 coupon_claims 里是否已有 WELCOME- 码判定，注册流程重复调用也只发一次。
 * - 同时写 coupon_claims 归属记录，「我的优惠券」列表直接 JOIN 出来即可。
 */
export function grantWelcomeCoupon(userId: string, email: string): string | null {
  const normalized = email.trim().toLowerCase();
  const already = get<{ x: number }>(
    `SELECT 1 AS x FROM coupon_claims cc
     JOIN coupons c ON c.code = cc.code
     WHERE cc.email = ? AND c.code LIKE 'WELCOME-%'`,
    [normalized]
  );
  if (already) return null;

  const code = `WELCOME-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const t = now();
  saveCoupon({
    code,
    type: 'freeship',
    value: 0,
    min_subtotal: 0,
    max_uses: 1,
    per_customer_limit: 1,
    starts_at: t,
    ends_at: t + 180 * 24 * 60 * 60 * 1000,
    status: 'active',
    acquisition_mode: 'manual',
    created_by: `welcome:${userId}`,
  });
  recordCouponClaim(code, normalized);
  return code;
}

export function awardOrderPoints(input: { userId: string; orderId: string; totalCents: number }): number | null {
  if (awardedAlready(input.userId, 'order_earn', input.orderId)) return null;
  const points = Math.floor(input.totalCents / 100);
  if (points <= 0) return null;
  return award(input.userId, points, 'order_earn', input.orderId);
}

/**
 * 退款回滚积分：把该单发放的积分原路扣回（ledger reason=refund）。
 * 余额不会变成负数 —— award() 内部做了下限保护。
 */
export function reverseOrderPoints(userId: string, orderId: string): number | null {
  // 幂等：同一订单只回滚一次，避免重复写入负数流水
  if (awardedAlready(userId, 'refund', orderId)) return null;
  const earned = get<{ delta: number }>(
    `SELECT delta FROM points_ledger
     WHERE user_id = ? AND ref = ? AND reason = 'order_earn'
     ORDER BY created_at DESC LIMIT 1`,
    [userId, orderId]
  );
  if (!earned || earned.delta <= 0) return null;
  return award(userId, -earned.delta, 'refund', orderId, '退款回滚');
}

export function listLedger(userId: string, limit = 40) {
  return all<{
    delta: number;
    balance_after: number;
    reason: string;
    ref: string | null;
    note: string | null;
    created_at: number;
  }>(
    `SELECT delta, balance_after, reason, ref, note, created_at FROM points_ledger
     WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
    [userId, limit]
  );
}

/* ── 生日礼 ── */

export type BirthdayResult = {
  eligible: boolean;
  issued: boolean;
  couponCode: string | null;
  points: number;
  month: number | null;
};

function monthOf(birthday: string | null): number | null {
  if (!birthday) return null;
  const m = /^(\d{1,2})-(\d{1,2})$/.exec(birthday.trim());
  if (!m) return null;
  const mm = Number(m[1]);
  return mm >= 1 && mm <= 12 ? mm : null;
}

/**
 * 生日当月自动发礼（页面加载时调用，天然幂等）。
 * 只存 MM-DD，不存年份 —— 够用且少存一条个人信息。
 */
export function claimBirthdayGift(user: UserRow): BirthdayResult {
  const month = monthOf(user.birthday);
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  if (!month) return { eligible: false, issued: false, couponCode: null, points: 0, month: null };
  if (month !== currentMonth) return { eligible: false, issued: false, couponCode: null, points: 0, month };
  if (user.birthday_gift_year === currentYear) {
    return { eligible: true, issued: false, couponCode: null, points: 0, month };
  }

  const code = `BDAY-${currentYear}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const t = now();
  saveCoupon({
    code,
    type: 'percent',
    value: BIRTHDAY_COUPON_PERCENT,
    min_subtotal: 0,
    max_uses: 1,
    per_customer_limit: 1,
    starts_at: t,
    ends_at: t + 30 * 24 * 60 * 60 * 1000,
    status: 'active',
    created_by: `user:${user.id}`,
  });
  recordCouponClaim(code, user.email);
  award(user.id, BIRTHDAY_BONUS, 'birthday', `${user.id}:${currentYear}`, '生日礼积分');
  run('UPDATE users SET birthday_gift_year = ? WHERE id = ?', [currentYear, user.id]);

  return { eligible: true, issued: true, couponCode: code, points: BIRTHDAY_BONUS, month };
}

/* ── 兑换 ── */

export type RedeemResult = { ok: boolean; error?: string; couponCode?: string; valueCents?: number; points?: number };

export function redeemPoints(userId: string, optionPoints: number): RedeemResult {
  const option = REDEEM_OPTIONS.find((o) => o.points === optionPoints);
  if (!option) return { ok: false, error: '无效的兑换档位' };
  const user = findUserById(userId);
  if (!user) return { ok: false, error: '账户不存在' };
  if (user.points < option.points) return { ok: false, error: '积分不足' };

  const code = `ZHS-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const t = now();
  const balance = award(userId, -option.points, 'redeem', code, `兑换 ${option.labelZh}`);
  if (balance < 0) return { ok: false, error: '积分不足' };

  saveCoupon({
    code,
    type: 'amount',
    value: option.valueCents,
    min_subtotal: option.valueCents, // 券面额即为最低消费，避免 0 元单
    max_uses: 1,
    per_customer_limit: 1,
    starts_at: t,
    ends_at: t + 90 * 24 * 60 * 60 * 1000,
    status: 'active',
    created_by: `user:${userId}`,
  });
  recordCouponClaim(code, user.email);

  return { ok: true, couponCode: code, valueCents: option.valueCents, points: balance };
}
