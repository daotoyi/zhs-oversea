/**
 * 订单落库 —— v1 用 JSON 文件存本地，Phase 2 换 CloudBase / Postgres
 *
 * 生产环境必须换成数据库 + 唯一索引（stripe_event_id）来保证幂等。
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import type Stripe from 'stripe';

const DATA_DIR = path.join(process.cwd(), '.data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const EVENTS_FILE = path.join(DATA_DIR, 'processed-events.json');

export type Order = {
  orderId: string;
  stripeSessionId: string;
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

export async function recordOrder(session: Stripe.Checkout.Session, eventId: string): Promise<Order> {
  const processed = await readJson<string[]>(EVENTS_FILE, []);
  if (processed.includes(eventId)) {
    const existing = await readJson<Order[]>(ORDERS_FILE, []);
    const found = existing.find((o) => o.stripeSessionId === session.id);
    if (found) return found;
  }

  const lineItems = await requireStripeItems(session);
  const address = session.shipping_details?.address ?? session.customer_details?.address ?? null;

  const order: Order = {
    orderId: `ZHS-${Date.now().toString(36).toUpperCase()}`,
    stripeSessionId: session.id,
    stripePaymentIntentId:
      typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null,
    customerEmail: session.customer_details?.email ?? session.customer_email ?? null,
    customerName: session.customer_details?.name ?? null,
    shippingAddress: address
      ? {
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          state: address.state,
          postalCode: address.postal_code,
          country: address.country,
        }
      : null,
    items: lineItems,
    subtotalUsd: session.amount_subtotal ?? 0,
    shippingUsd: session.total_details?.amount_shipping ?? 0,
    taxUsd: session.total_details?.amount_tax ?? 0,
    totalUsd: session.amount_total ?? 0,
    currency: session.currency ?? 'usd',
    status: 'paid',
    createdAt: new Date().toISOString(),
  };

  const orders = await readJson<Order[]>(ORDERS_FILE, []);
  orders.push(order);
  await writeJson(ORDERS_FILE, orders);
  await writeJson(EVENTS_FILE, [...processed, eventId]);

  // TODO(Phase 1): 发订单确认邮件 + 同步库存 + 生成拣货单
  console.log(`[orders] recorded ${order.orderId} — ${order.totalUsd / 100} ${order.currency}`);

  return order;
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
