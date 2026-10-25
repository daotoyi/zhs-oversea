/**
 * PayPal 服务端封装 —— 个人号即可（sandbox 先测，再翻 live）
 *
 * 凭据优先从后台 settings 表读取（paypal_client_id / paypal_client_secret / paypal_env），
 * 回退到环境变量 PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET / PAYPAL_ENV，
 * 与 Google / Resend 的「数据库 > 环境变量」约定一致，后台填写即生效、无需重启。
 *
 * 直接走 REST（不引 SDK），可控且易验证：
 *   1. 取 access token（Basic auth，缓存 ~9h）
 *   2. 建 order（intent=CAPTURE，金额来自 resolveCart，服务端权威）
 *   3. 买家付完后 capture 真正收款
 *   4. 查 order 取真实状态 + 收货地址（落库用）
 *
 * 注意：PayPal breakdown 校验严格——
 *   amount = item_total + tax_total + shipping - discount
 * 我们 discount=0、tax=0，item_total 用「折后小计」，金额与 value 一致。
 */

import { resolve } from '@/lib/settings';
import type { ResolvedCart } from '@/lib/checkout/core';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zhenhesheng.com';

/** sandbox（测试）或 live（真实收款），运行期从 settings 表 / env 读取 */
export function paypalMode(): string {
  return (resolve('paypal_env', 'PAYPAL_ENV') ?? 'sandbox').toLowerCase();
}

function paypalBase(): string {
  // PayPal 官方现行生产端点为 api-m.paypal.com（老 api.paypal.com 仍兼容但非推荐值）。
  // 贝宝支付(北京)统一账户走中国开发者门户 paypal.cn/portal/developer 取得的 Live 凭据同样用此端点。
  return paypalMode() === 'live' ? 'https://api-m.paypal.com' : 'https://api.sandbox.paypal.com';
}

let tokenCache: { token: string; expiresAt: number; base: string } | null = null;

async function getAccessToken(): Promise<string> {
  const clientId = resolve('paypal_client_id', 'PAYPAL_CLIENT_ID');
  const secret = resolve('paypal_client_secret', 'PAYPAL_CLIENT_SECRET');
  if (!clientId || !secret) {
    throw new Error(
      'PayPal is not configured — 后台「登录与邮件 / 支付」填 PAYPAL_CLIENT_ID / SECRET，或设置环境变量'
    );
  }
  const base = paypalBase();
  if (tokenCache && tokenCache.base === base && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.token;
  }
  const basic = Buffer.from(`${clientId}:${secret}`).toString('base64');
  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`PayPal auth failed: ${res.status} ${t}`);
  }
  const json = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = { token: json.access_token, expiresAt: Date.now() + json.expires_in * 1000, base };
  return json.access_token;
}

export type PayPalAddress = {
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
};

export async function createPayPalOrder(cart: ResolvedCart): Promise<{ id: string; approveUrl: string }> {
  const token = await getAccessToken();
  const base = paypalBase();
  const res = await fetch(`${base}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': `zhs-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          description: 'Zhen He Sheng — Dao Culture & Living',
          items: cart.lines.map((l) => ({
            name: l.title,
            description: l.titleZh,
            sku: l.sku,
            unit_amount: { currency_code: 'USD', value: (l.unitAmountUsd / 100).toFixed(2) },
            quantity: String(l.quantity),
          })),
          amount: {
            currency_code: 'USD',
            value: (cart.totalUsd / 100).toFixed(2),
            breakdown: {
              item_total: { currency_code: 'USD', value: (cart.subtotalUsd / 100).toFixed(2) },
              shipping: { currency_code: 'USD', value: (cart.shippingUsd / 100).toFixed(2) },
              discount: { currency_code: 'USD', value: (cart.discountUsd / 100).toFixed(2) },
              tax_total: { currency_code: 'USD', value: '0.00' },
            },
          },
        },
      ],
      application_context: {
        return_url: `${SITE_URL}/checkout/paypal/return`,
        cancel_url: `${SITE_URL}/cart?cancelled=1`,
        brand_name: 'Zhen He Sheng',
        landing_page: 'LOGIN',
        user_action: 'PAY_NOW',
        shipping_preference: 'GET_FROM_FILE',
      },
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`PayPal create order failed: ${res.status} ${t}`);
  }
  const json = (await res.json()) as {
    id: string;
    links: { rel: string; href: string }[];
    status: string;
  };
  const approveUrl = json.links.find((l) => l.rel === 'approve')?.href ?? '';
  if (!approveUrl) {
    throw new Error('PayPal did not return an approve URL');
  }
  return { id: json.id, approveUrl };
}

export async function getPayPalOrder(orderId: string): Promise<any> {
  const token = await getAccessToken();
  const base = paypalBase();
  const res = await fetch(`${base}/v2/checkout/orders/${orderId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`PayPal get order failed: ${res.status} ${t}`);
  }
  return res.json();
}

/** 捕获资金（真正收款）。409 表示已捕获，按幂等视为成功并回查。 */
export async function capturePayPalOrder(orderId: string): Promise<any> {
  const token = await getAccessToken();
  const base = paypalBase();
  const res = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': `cap-${orderId}`,
    },
    body: JSON.stringify({}),
  });
  if (res.status === 409) {
    return getPayPalOrder(orderId);
  }
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`PayPal capture failed: ${res.status} ${t}`);
  }
  return res.json();
}

/** 从 PayPal order 提取收货地址（买家在 PayPal 填写的 shipping） */
export function extractShippingAddress(order: any): PayPalAddress {
  const shipping = order?.purchase_units?.[0]?.shipping?.address;
  if (!shipping) return { line1: null, line2: null, city: null, state: null, postalCode: null, country: null };
  return {
    line1: shipping.address_line_1 ?? null,
    line2: shipping.address_line_2 ?? null,
    city: shipping.admin_area_2 ?? null,
    state: shipping.admin_area_1 ?? null,
    postalCode: shipping.postal_code ?? null,
    country: shipping.country_code ?? null,
  };
}

/** 从 PayPal order 提取买家邮箱/姓名（payer） */
export function extractPayer(order: any): { email: string | null; name: string | null } {
  const payer = order?.payer;
  if (!payer) return { email: null, name: null };
  const name = payer.name ? `${payer.name.given_name ?? ''} ${payer.name.surname ?? ''}`.trim() : null;
  return { email: payer.email_address ?? null, name: name || null };
}

/**
 * 统一落库入口（return 页 + webhook 共用）
 *
 * 流程：幂等查已落库 → 取 pending 快照 → 捕获（已捕获则 409 回查）→ 核实 COMPLETED →
 *       从快照取归一化 cart → persistOrder（JSON 冗余 + sql.js 镜像 + 券/会员）→ 标记 pending 完成。
 *
 * 安全边界：
 *  - 只对「我们自己创建、且仍躺在 pending_orders 里」的订单落库；外部伪造的 order id 在 pending 里查不到，直接抛错。
 *  - 金额/状态以「向 PayPal 重新拉取的订单」为准，绝不盲信 webhook/cookie 传来的金额。
 *
 * 幂等：同一 token 已落库直接返回，重复触发（return 页 + webhook 都到）不会重复建单。
 */
export async function finalizePayPalOrder(token: string): Promise<{ orderId: string; alreadyDone: boolean }> {
  const { findOrderByProviderRef, getPendingOrder, completePendingOrder } = await import('@/lib/admin/dao');
  const { persistOrder } = await import('@/lib/orders');

  // 幂等：已经落过库，直接返回
  const existing = findOrderByProviderRef('paypal', token);
  if (existing) return { orderId: existing.id, alreadyDone: true };

  const pending = getPendingOrder(token);
  if (!pending) throw new Error('This PayPal order is unknown or expired.');

  // 捕获资金（已捕获则 409 回查），并核实 COMPLETED
  const captured = await capturePayPalOrder(token);
  const paid =
    captured?.status === 'COMPLETED' ||
    captured?.purchase_units?.[0]?.payments?.captures?.[0]?.status === 'COMPLETED';
  if (!paid) throw new Error('Payment was not completed.');

  const address = extractShippingAddress(captured);
  const payer = extractPayer(captured);
  const { cart } = JSON.parse(pending.payload) as { cart: ResolvedCart };

  const orderId = await persistOrder({
    provider: 'paypal',
    providerRef: token,
    email: payer.email ?? '',
    customerName: payer.name,
    items: cart.lines.map((l) => ({
      sku: l.sku,
      slug: l.slug,
      name: l.title,
      quantity: l.quantity,
      unitAmountUsd: l.unitAmountUsd,
    })),
    subtotal: cart.subtotalUsd,
    discount: cart.discountUsd,
    shipping: cart.shippingUsd,
    tax: 0,
    total: cart.totalUsd,
    currency: cart.currency,
    status: 'paid',
    couponCode: cart.couponCode,
    address,
    memberId: cart.member?.id ?? null,
  });
  completePendingOrder(token, orderId);
  return { orderId, alreadyDone: false };
}
