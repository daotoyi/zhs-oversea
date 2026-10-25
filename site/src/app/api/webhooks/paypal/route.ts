import { NextResponse } from 'next/server';
import { finalizePayPalOrder } from '@/lib/paypal';

export const runtime = 'nodejs';

/**
 * PayPal Webhook —— 服务端兜底落库（最可靠的路径）
 *
 * 回跳页 /checkout/paypal/return 依赖买家浏览器跳回，断网/关窗会丢单。
 * 这里由 PayPal 服务器主动 POST 通知，不依赖买家浏览器，因此只要支付真的完成，
 * 订单就一定会被创建。return 页与 webhook 都走 finalizePayPalOrder，幂等不重复建单。
 *
 * 安全边界（不盲信 webhook 内容）：
 *  - finalizePayPalOrder 只用我们的服务端凭据向 PayPal 重新拉取订单、核实 COMPLETED，
 *    并对「我们自己创建、仍在 pending_orders 里」的订单才落库；伪造的 order id 在 pending 查不到即丢弃。
 *  - 金额以 PayPal 回拉为准，不采用 webhook 体里的金额。
 *
 * 始终返回 200，避免 PayPal 对不可挽回的事件死循环重试；真正的落库失败只记日志，
 * 待 PayPal 在支付真正完成时再次推送 COMPLETED 事件时重试成功。
 */
const ACTIONABLE = new Set([
  'PAYMENT.CAPTURE.COMPLETED',
  'CHECKOUT.ORDER.COMPLETED',
  'PAYMENT.CAPTURE.PENDING',
]);

export async function POST(request: Request) {
  const eventType = request.headers.get('paypal-event-type') ?? '';
  const raw = await request.text();

  let event: any = null;
  try {
    event = JSON.parse(raw);
  } catch {
    console.log('[paypal-webhook] malformed body, ignored');
    return NextResponse.json({ received: true });
  }

  if (!ACTIONABLE.has(eventType)) {
    console.log(`[paypal-webhook] ${eventType} ignored`);
    return NextResponse.json({ received: true });
  }

  // 取 order id：capture 事件在 resource.supplementary_data.related_ids.order_id；
  // order 事件（CHECKOUT.ORDER.*）在 resource.id。
  const resource = event?.resource ?? {};
  const orderId: string | null =
    resource?.supplementary_data?.related_ids?.order_id ??
    (eventType.startsWith('CHECKOUT.ORDER') ? (resource?.id ?? null) : null);

  if (!orderId) {
    console.log(`[paypal-webhook] ${eventType} missing order id`);
    return NextResponse.json({ received: true });
  }

  try {
    const { orderId: created, alreadyDone } = await finalizePayPalOrder(orderId);
    console.log(`[paypal-webhook] finalized ${orderId} -> ${created} (alreadyDone=${alreadyDone})`);
  } catch (err) {
    const m = err instanceof Error ? err.message : 'unknown';
    console.error(`[paypal-webhook] finalize failed for ${orderId}: ${m}`);
  }

  return NextResponse.json({ received: true });
}
