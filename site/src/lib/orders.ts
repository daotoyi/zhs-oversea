/**
 * 订单落库 —— v1 用 JSON 文件存本地（冗余），并镜像进后台 sql.js（单一真相来源）
 *
 * 多渠道统一入口：persistOrder()。所有支付渠道（Stripe / PayPal / WorldFirst）
 * 都先 resolveCart 拿到归一化金额，再调 persistOrder 落库，保证折扣/券/会员归属一致。
 * Stripe 的 recordOrder 退化为「取 Stripe 明细 → 调 persistOrder」的适配器。
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import type Stripe from 'stripe';

const DATA_DIR = path.join(process.cwd(), '.data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const EVENTS_FILE = path.join(DATA_DIR, 'processed-events.json');

export type Order = {
  orderId: string;
  stripeSessionId: string | null;
  stripePaymentIntentId: string | null;
  customerEmail: string | null;
  customerName: string | null;
  shippingAddress: {
    line1: string | null;
    line2: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
  } | null;
  items: {
    sku: string;
    slug: string;
    name: string;
    quantity: number;
    unitAmountUsd: number;
  }[];
  subtotalUsd: number;
  shippingUsd: number;
  taxUsd: number;
  totalUsd: number;
  currency: string;
  status: 'paid' | 'refunded' | 'disputed';
  createdAt: string;
};

export type PersistOrderInput = {
  provider: 'stripe' | 'paypal' | 'worldfirst';
  providerRef: string;
  email: string;
  customerName: string | null;
  items: { sku: string; slug: string; name: string; quantity: number; unitAmountUsd: number }[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
  status: 'paid' | 'refunded' | 'disputed';
  couponCode: string | null;
  address: {
    line1: string | null;
    line2: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
  } | null;
  memberId?: string | null;
};

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, data: unknown) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * 统一落库：JSON 冗余 + sql.js 镜像 + 优惠券计数 + 会员积分。
 * 幂等：同一 (provider, providerRef) 不重复落库。
 */
export async function persistOrder(input: PersistOrderInput): Promise<string> {
  const { initDb } = await import('@/lib/db/loader');
  const {
    createOrder,
    upsertCustomerFromOrder,
    findOrderByProviderRef,
    recordCouponUse,
  } = await import('@/lib/admin/dao');
  await initDb();

  // 幂等：已存在直接返回
  const existing = findOrderByProviderRef(input.provider, input.providerRef);
  if (existing) return existing.id;

  const orderId = `ZHS-${Date.now().toString(36).toUpperCase()}`;

  const order: Order = {
    orderId,
    stripeSessionId: input.provider === 'stripe' ? input.providerRef : null,
    stripePaymentIntentId: null,
    customerEmail: input.email,
    customerName: input.customerName,
    shippingAddress: input.address,
    items: input.items,
    subtotalUsd: input.subtotal,
    shippingUsd: input.shipping,
    taxUsd: input.tax,
    totalUsd: input.total,
    currency: input.currency,
    status: input.status,
    createdAt: new Date().toISOString(),
  };

  // 写本地 JSON 冗余
  const orders = await readJson<Order[]>(ORDERS_FILE, []);
  orders.push(order);
  await writeJson(ORDERS_FILE, orders);
  const processed = await readJson<string[]>(EVENTS_FILE, []);
  const idemKey = `${input.provider}:${input.providerRef}`;
  if (!processed.includes(idemKey)) {
    await writeJson(EVENTS_FILE, [...processed, idemKey]);
  }

  // 镜像进后台 sql.js
  try {
    createOrder({
      id: orderId,
      stripe_session_id: input.provider === 'stripe' ? input.providerRef : null,
      email: input.email,
      customer_name: input.customerName,
      items: JSON.stringify(order.items),
      subtotal: input.subtotal,
      discount: input.discount,
      shipping: input.shipping,
      tax: input.tax,
      total: input.total,
      currency: input.currency,
      status: input.status,
      coupon_code: input.couponCode,
      tracking_no: null,
      address: input.address ? JSON.stringify(input.address) : null,
      payment_provider: input.provider,
      provider_ref: input.providerRef,
    });
    if (input.email) {
      upsertCustomerFromOrder({ email: input.email, name: input.customerName, total: input.total });
    }
    // 优惠券使用次数仅在真实付款后累加（避免占用未支付购物车）
    if (input.couponCode && input.discount > 0 && input.email) {
      recordCouponUse(input.couponCode, input.email, orderId, input.discount);
    }

    // 会员归属 + 积分（幂等：同一订单只发一次）
    const { findUserById, findUserByEmail } = await import('@/lib/account/dao');
    const { awardOrderPoints } = await import('@/lib/account/points');
    const { run: dbRun } = await import('@/lib/db/loader');
    const member =
      (input.memberId ? findUserById(input.memberId) : null) ??
      (input.email ? findUserByEmail(input.email) : null);
    if (member) {
      dbRun('UPDATE orders SET user_id = ? WHERE id = ?', [member.id, orderId]);
      awardOrderPoints({ userId: member.id, orderId, totalCents: input.total });
    }
  } catch (err) {
    console.error('[orders] failed to mirror into admin DB:', err instanceof Error ? err.message : err);
  }

  console.log(`[orders] persisted ${orderId} via ${input.provider} — ${input.total / 100} ${input.currency}`);
  return orderId;
}

/**
 * Stripe 适配器：从 Stripe webhook 的 session 取明细 → 调 persistOrder。
 * 价格权威仍是 Stripe 回传的金额（已含我们建 session 时设的折后单价）。
 */
export async function recordOrder(session: Stripe.Checkout.Session, eventId: string): Promise<Order> {
  const { initDb } = await import('@/lib/db/loader');
  await initDb();

  const lineItems = await requireStripeItems(session);
  const a = session.shipping_details?.address ?? session.customer_details?.address ?? null;
  const meta = (session.metadata ?? {}) as Record<string, string>;
  const address = a
    ? {
        line1: a.line1 ?? null,
        line2: a.line2 ?? null,
        city: a.city ?? null,
        state: a.state ?? null,
        postalCode: a.postal_code ?? null,
        country: a.country ?? null,
      }
    : null;

  const orderId = await persistOrder({
    provider: 'stripe',
    providerRef: session.id,
    email: session.customer_details?.email ?? session.customer_email ?? '',
    customerName: session.customer_details?.name ?? null,
    items: lineItems.map((li) => ({
      sku: li.sku,
      slug: li.slug,
      name: li.name,
      quantity: li.quantity,
      unitAmountUsd: li.unitAmountUsd,
    })),
    subtotal: session.amount_subtotal ?? 0,
    discount: Number(meta.discountUsd ?? 0) || 0,
    shipping: session.total_details?.amount_shipping ?? 0,
    tax: session.total_details?.amount_tax ?? 0,
    total: session.amount_total ?? 0,
    currency: session.currency ?? 'usd',
    status: 'paid',
    couponCode: meta.couponCode || null,
    address,
    memberId: meta.userId || null,
  });

  const orders = await readJson<Order[]>(ORDERS_FILE, []);
  return orders.find((o) => o.orderId === orderId) ?? (await readJson<Order[]>(ORDERS_FILE, []))[0];
}

async function requireStripeItems(session: Stripe.Checkout.Session) {
  const stripe = (await import('@/lib/stripe')).requireStripe();
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
  return lineItems.data.map((li) => {
    // acacia API: LineItem.price 是展开的 Price 对象，metadata 挂在 product 上
    const product = li.price?.product;
    const metadata = typeof product === 'object' && product !== null && 'metadata' in product
      ? (product.metadata as Record<string, string>)
      : {};
    return {
      sku: metadata.sku ?? '',
      slug: metadata.slug ?? '',
      name: li.description ?? '',
      quantity: li.quantity ?? 1,
      unitAmountUsd: li.amount_total ?? 0,
    };
  });
}

export async function markDispute(kind: 'refund' | 'dispute' | 'dispute_closed', id: string, status: string) {
  console.log(`[orders] ${kind} received — ${id} (${status})`);
  // TODO(Phase 1): 拒付需在 7 天内提交证据（receipt / shipping proof / customer correspondence）
}
