/**
 * 运费计算 —— 结账前展示，结账时服务端复算
 *
 * 规则：
 * - 美国境内单一口岸（北京直发），DDP（关税已含在结账价内）
 * - 满 $60 免运，不足按重量档计费（$12 / $18 / $28）
 * - 重量分档：≤500g / ≤2kg / ≤8kg，超 8kg 需人工报价
 *
 * 单位：全程「分」。priceUsd 字段名沿用历史命名，实际是分。
 * 显示一律走 formatUsd()。
 */

import { FREE_SHIPPING_THRESHOLD_USD, US_SHIPPING_RATES, type Product } from './types';

export type ShippingQuote = {
  rateId: string;
  label: string;
  priceUsd: number;
  minDays: number;
  maxDays: number;
  free: boolean;
  /** 免运门槛差额，用于进度条 */
  remainingForFree: number;
};

export function getShippingRate(weightGrams: number) {
  const hit = US_SHIPPING_RATES.find((r) => weightGrams <= r.maxWeightGrams);
  if (!hit) {
    throw new Error(`Weight ${weightGrams}g exceeds automated shipping range — quote manually`);
  }
  return hit;
}

/**
 * 只按「小计 + 总重」算运费（分）。
 * 购物车页与服务端共用同一算法，避免两边显示不一致。
 */
export function shippingPriceCents(subtotalCents: number, totalWeightGrams: number): number {
  if (subtotalCents >= FREE_SHIPPING_THRESHOLD_USD) return 0;
  return getShippingRate(totalWeightGrams).priceUsd;
}

export function calculateShipping(items: { product: Product; variantId: string; quantity: number }[]): ShippingQuote {
  const subtotal = items.reduce((sum, item) => {
    const variant = item.product.variants.find((v) => v.id === item.variantId);
    return sum + (variant?.priceUsd ?? item.product.priceUsd) * item.quantity;
  }, 0);

  const totalWeight = items.reduce((sum, item) => {
    const variant = item.product.variants.find((v) => v.id === item.variantId);
    return sum + (variant?.weightGrams ?? item.product.weightGrams) * item.quantity;
  }, 0);

  const rate = getShippingRate(totalWeight);
  const free = subtotal >= FREE_SHIPPING_THRESHOLD_USD;

  return {
    rateId: rate.id,
    label: rate.label,
    priceUsd: shippingPriceCents(subtotal, totalWeight),
    minDays: rate.minDays,
    maxDays: rate.maxDays,
    free,
    remainingForFree: free ? 0 : Math.max(0, FREE_SHIPPING_THRESHOLD_USD - subtotal),
  };
}

export function formatUsd(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
