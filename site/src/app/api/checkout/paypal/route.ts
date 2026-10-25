import { NextResponse } from 'next/server';
import { resolveCart } from '@/lib/checkout/core';
import { createPayPalOrder } from '@/lib/paypal';
import { initDb } from '@/lib/db/loader';
import { addPendingOrder } from '@/lib/admin/dao';

export const runtime = 'nodejs';

/**
 * 创建 PayPal 订单（实物文创，个人号可收）
 *
 * 1. resolveCart 服务端取价/折扣/运费（价格权威，与 Stripe 同份逻辑）
 * 2. createPayPalOrder 建 PayPal order（金额来自上面结果）
 * 3. 写 pending_orders 快照，payment 成功后按 providerRef 取回落库，
 *    避免跨渠道时折扣/会员归属丢失
 */

type LineItem = { slug: string; variantId: string; quantity: number };

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { items?: LineItem[]; couponCode?: string };
    const cart = await resolveCart(body.items ?? [], body.couponCode);

    await initDb();
    const { id, approveUrl } = await createPayPalOrder(cart);
    addPendingOrder({
      providerRef: id,
      provider: 'paypal',
      payload: JSON.stringify({ cart, createdAt: Date.now() }),
    });

    return NextResponse.json({ id, approveUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PayPal checkout failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
