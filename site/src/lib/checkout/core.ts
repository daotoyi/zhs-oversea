/**
 * 结账核心 —— 所有支付渠道（Stripe / PayPal / WorldFirst）共用
 *
 * 铁律：价格权威永远在服务端。本函数从数据库取价、算折扣、算运费、
 * 绑定会员，产出一份归一化购物车。任何渠道都不得从客户端或渠道 SDK 取金额。
 */

import { getStoreProduct } from '@/lib/storefront';
import { computeDiscount } from '@/lib/discount';
import { calculateShipping } from '@/lib/shipping';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zhenhesheng.com';

export type CartItemInput = { slug: string; variantId: string; quantity: number };

export type ResolvedCartLine = {
  slug: string;
  variantId: string;
  quantity: number;
  title: string;
  titleZh: string;
  sku: string;
  image: string;
  category: string;
  unitAmountUsd: number; // 折后单价（分）
  weightGrams: number;
  hsCode: string;
  citesStatus: string;
  citesPermitNo: string;
  assayNo: string;
};

export type ResolvedCart = {
  lines: ResolvedCartLine[];
  subtotalUsd: number; // 折后小计（分）
  discountUsd: number;
  saleDiscountUsd: number;
  couponDiscountUsd: number;
  couponCode: string | null;
  shippingUsd: number;
  shippingFree: boolean;
  shippingRateId: string;
  shippingLabel: string;
  shippingMinDays: number;
  shippingMaxDays: number;
  totalUsd: number; // 折后小计 + 运费（分，不含税）
  currency: 'usd';
  member: { id: string; email: string } | null;
};

export async function resolveCart(
  items: CartItemInput[],
  couponCode?: string
): Promise<ResolvedCart> {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Empty cart');
  }
  if (items.length > 50) {
    throw new Error('Too many line items');
  }

  const resolved = [];
  const discountLines = [];
  for (const item of items) {
    const product = await getStoreProduct(item.slug);
    if (!product) throw new Error(`Unknown product: ${item.slug}`);
    const variant = product.variants.find((v) => v.id === item.variantId);
    if (!variant) throw new Error(`Unknown variant: ${item.slug}/${item.variantId}`);
    const quantity = Math.max(1, item.quantity | 0);
    if (variant.stock < quantity) throw new Error(`Insufficient stock: ${item.slug}`);
    resolved.push({ product, variant, quantity });
    discountLines.push({
      slug: product.slug,
      category: product.category,
      variantPriceUsd: variant.priceUsd,
      quantity,
    });
  }

  const disc = await computeDiscount(discountLines, couponCode);
  if (disc.error) {
    throw new Error(disc.error);
  }

  // 会员归属（未登录则游客结算，照旧）
  let member: { id: string; email: string } | null = null;
  try {
    const { currentUser } = await import('@/lib/account/auth');
    const u = await currentUser();
    if (u) member = { id: u.id, email: u.email };
  } catch {
    member = null;
  }

  const shipping = calculateShipping(
    resolved.map((r) => ({
      product: r.product,
      variantId: r.variant.id,
      quantity: r.quantity,
    }))
  );

  // 免运费券把运费归零（商品金额不变），免运门槛仍按原价判定
  const freeByCoupon = disc.freeship;
  const shippingUsd = freeByCoupon ? 0 : shipping.priceUsd;
  const shippingFree = shipping.free || freeByCoupon;

  const lines: ResolvedCartLine[] = resolved.map(({ product, variant, quantity }, i) => ({
    slug: product.slug,
    variantId: variant.id,
    quantity,
    title: product.title,
    titleZh: product.titleZh,
    sku: variant.sku,
    image: `${SITE_URL}${product.images[0]}`,
    category: product.category,
    unitAmountUsd: disc.lineUnitAmounts[i],
    weightGrams: variant.weightGrams,
    hsCode: product.hsCode,
    citesStatus: product.cites.status,
    citesPermitNo: product.cites.permitNo ?? '',
    assayNo: product.assay?.reportNo ?? '',
  }));

  const subtotalUsd = lines.reduce((s, l) => s + l.unitAmountUsd * l.quantity, 0);
  const totalUsd = subtotalUsd + shippingUsd;

  return {
    lines,
    subtotalUsd,
    discountUsd: disc.totalDiscount,
    saleDiscountUsd: disc.saleDiscount,
    couponDiscountUsd: disc.couponDiscount,
    couponCode: disc.couponCode ?? null,
    shippingUsd,
    shippingFree,
    shippingRateId: shipping.rateId,
    shippingLabel: shipping.label,
    shippingMinDays: shipping.minDays,
    shippingMaxDays: shipping.maxDays,
    totalUsd,
    currency: 'usd',
    member,
  };
}
