/**
 * 折扣计算 —— 优惠券 + 节日折扣（前台结账统一入口）
 *
 * 规则：
 * 1. 节日折扣（sale_events）按商品/品类逐行生效，直接降低该行单价。
 * 2. 优惠券（coupons）在「节日折后小计」基础上，再行整单减免（百分比 / 固定额）。
 * 3. 优惠券校验：active、在有效期内、未超 max_uses、达到最低消费。
 * 4. 任何 DB 异常都回落为「无折扣」，绝不阻断结账。
 */

import { initDb } from '@/lib/db/loader';
import { findCoupon, activeSalePercent } from '@/lib/admin/dao';
import type { ProductCategory } from '@/lib/types';

export type DiscountLine = {
  slug: string;
  category: ProductCategory;
  variantPriceUsd: number;
  quantity: number;
};

export type DiscountResult = {
  subtotal: number;
  saleDiscount: number;
  couponDiscount: number;
  totalDiscount: number;
  couponCode: string | null;
  /** 每行最终单价（已含全部折扣，>=0） */
  lineUnitAmounts: number[];
  error?: string;
};

export async function computeDiscount(
  lines: DiscountLine[],
  couponCode?: string
): Promise<DiscountResult> {
  const now = Date.now();

  try {
    await initDb();
  } catch {
    /* 回落无折扣 */
  }

  let subtotal = 0;
  const expanded = lines.map((l) => {
    const lineCatalog = l.variantPriceUsd * l.quantity;
    subtotal += lineCatalog;
    const salePct = safeSalePercent(l.slug, l.category);
    const saleLine = Math.round((lineCatalog * salePct) / 100);
    return { ...l, lineCatalog, saleLine, postSaleLine: lineCatalog - saleLine };
  });
  const saleTotal = expanded.reduce((s, l) => s + l.saleLine, 0);
  const postSale = subtotal - saleTotal;

  let couponDiscount = 0;
  let appliedCoupon: string | null = null;

  const code = couponCode?.trim();
  if (code) {
    const c = safeFindCoupon(code);
    if (!c) return fail('优惠券无效');
    if (c.status !== 'active') return fail('优惠券已失效');
    if (c.starts_at && now < c.starts_at) return fail('优惠券尚未开始');
    if (c.ends_at && now > c.ends_at) return fail('优惠券已过期');
    if (c.max_uses > 0 && c.used_count >= c.max_uses) return fail('优惠券已用完');
    if (postSale < (c.min_subtotal ?? 0)) {
      return fail(`需满 $${((c.min_subtotal ?? 0) / 100).toFixed(0)} 可用`);
    }
    couponDiscount =
      c.type === 'percent'
        ? Math.round((postSale * c.value) / 100)
        : Math.min(c.value, postSale);
    appliedCoupon = c.code;
  }

  const totalDiscount = saleTotal + couponDiscount;

  // 把优惠券减免按「折后行价」比例分摊到各行，余数归最后一行
  let remainingCoupon = couponDiscount;
  const lineUnitAmounts: number[] = expanded.map((l, i) => {
    let couponShare = 0;
    if (couponDiscount > 0 && postSale > 0) {
      couponShare =
        i === expanded.length - 1
          ? remainingCoupon
          : Math.round((couponDiscount * l.postSaleLine) / postSale);
      remainingCoupon -= couponShare;
    }
    const finalLine = Math.max(0, l.postSaleLine - couponShare);
    return Math.round(finalLine / l.quantity);
  });

  return {
    subtotal,
    saleDiscount: saleTotal,
    couponDiscount,
    totalDiscount,
    couponCode: appliedCoupon,
    lineUnitAmounts,
  };

  function fail(msg: string): DiscountResult {
    return {
      subtotal,
      saleDiscount: 0,
      couponDiscount: 0,
      totalDiscount: 0,
      couponCode: null,
      lineUnitAmounts: lines.map((l) => l.variantPriceUsd),
      error: msg,
    };
  }
}

// DB 兜底：任何异常回落为「无折扣 / 找不到」
function safeFindCoupon(code: string) {
  try {
    return findCoupon(code);
  } catch {
    return null;
  }
}
function safeSalePercent(slug: string, category: ProductCategory): number {
  try {
    return activeSalePercent(slug, category);
  } catch {
    return 0;
  }
}

/** 确保折扣计算所需的 DB 已初始化（供调用方在 computeDiscount 前调用） */
export async function ensureDiscountDb(): Promise<void> {
  try {
    await initDb();
  } catch {
    /* 回落无折扣 */
  }
}
