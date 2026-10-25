import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * PayPal Webhook —— 兜底落库入口（主落库仍走 /checkout/paypal/return）
 *
 * 现状：先接收并登记事件，返回 200 让 PayPal 不再重试。
 * 真正的订单落库由 return 页（capture + 服务端核实订单状态）完成，
 * 该路径已对支付成功做了服务端确认，比单纯信任 webhook 更稳。
 *
 * TODO(上线前): 用 PayPal 官方证书下载 + HMAC-SHA256 校验 transmission_sig，
 * 验签通过后再对 PAYMENT.CAPTURE.COMPLETED 做兜底落库（覆盖「用户付完未跳回 return」的情况）。
 * 未验签前不要在此信任并落库，否则任意人可伪造支付成功事件。
 */
export async function POST(request: Request) {
  const eventType = request.headers.get('paypal-event-type') ?? '';
  const body = await request.text();
  console.log(`[paypal-webhook] ${eventType} received — signature verification TODO`);
  // TODO: 验签 + PAYMENT.CAPTURE.COMPLETED 兜底落库
  return NextResponse.json({ received: true });
}
