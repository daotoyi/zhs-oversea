import { NextResponse } from 'next/server';
import { requireStripe, getWebhookSecret } from '@/lib/stripe';
import { recordOrder, markDispute } from '@/lib/orders';

export const runtime = 'nodejs';

/**
 * Stripe Webhook —— 订单状态的唯一真相来源
 *
 * 必须幂等：用 event.id 去重，重放同一事件不产生重复订单。
 * 事件清单：
 *   checkout.session.completed        —— 下单成功，落库 + 发确认邮件
 *   payment_intent.payment_failed     —— 支付失败，标记
 *   charge.refunded                   —— 退款
 *   charge.dispute.created            —— 拒付，需人工响应
 *   charge.dispute.closed             —— 拒付结案
 */

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }
  let webhookSecret: string;
  try {
    webhookSecret = getWebhookSecret();
  } catch {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const stripe = requireStripe();
  const payload = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as import('stripe').Stripe.Checkout.Session;
        await recordOrder(session, event.id);
        break;
      }
      case 'charge.refunded': {
        const charge = event.data.object as import('stripe').Stripe.Charge;
        await markDispute('refund', charge.id, 'refunded');
        break;
      }
      case 'charge.dispute.created': {
        const dispute = event.data.object as import('stripe').Stripe.Dispute;
        await markDispute('dispute', dispute.id, dispute.status);
        break;
      }
      case 'charge.dispute.closed': {
        const dispute = event.data.object as import('stripe').Stripe.Dispute;
        await markDispute('dispute_closed', dispute.id, dispute.status);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    // 落库失败必须让 Stripe 重投，不能吞掉
    const message = err instanceof Error ? err.message : 'Handler failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
