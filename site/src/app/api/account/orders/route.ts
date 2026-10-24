import { initDb } from '@/lib/db/loader';
import { bad, json } from '@/lib/account/api';
import { currentUser } from '@/lib/account/auth';
import { listUserOrders } from '@/lib/account/dao';

export const runtime = 'nodejs';

type Item = { slug?: string; name?: string; quantity?: number; unitAmountUsd?: number };

export async function GET() {
  await initDb();
  const user = await currentUser();
  if (!user) return bad('请先登录', 401);

  const orders = listUserOrders(user.id, user.email).map((o) => {
    let items: Item[] = [];
    try {
      items = JSON.parse(o.items || '[]') as Item[];
    } catch {
      items = [];
    }
    return {
      id: o.id,
      createdAt: o.created_at,
      status: o.status,
      total: o.total,
      subtotal: o.subtotal,
      discount: o.discount,
      shipping: o.shipping,
      currency: o.currency,
      couponCode: o.coupon_code,
      trackingNo: o.tracking_no,
      items,
      sessionId: o.stripe_session_id,
    };
  });

  return json({ orders });
}
