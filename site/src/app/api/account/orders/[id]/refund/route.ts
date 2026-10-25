import { initDb } from '@/lib/db/loader';
import { bad, json, readJson } from '@/lib/account/api';
import { currentUser } from '@/lib/account/auth';
import { createRefundRequest, findUserOrder, getRefundRequestByOrder } from '@/lib/account/dao';

export const runtime = 'nodejs';

/** 可申请退款的状态：已付款 / 已发货 / 已送达（已退款、已取消不再受理） */
const REFUNDABLE = ['paid', 'shipped', 'delivered'];

/**
 * 会员申请退款
 * POST /api/account/orders/[id]/refund  { reason }
 *
 * 退款走「申请 → 后台处理」两段式：这里只登记申请，
 * 实际扣款（Stripe/PayPal 退款接口）尚未接入，由后台在订单管理里批准或拒绝。
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await initDb();
  const user = await currentUser();
  if (!user) return bad('请先登录', 401);

  const { id } = await params;
  const order = findUserOrder(user.id, user.email, id);
  if (!order) return bad('订单不存在', 404);

  if (!REFUNDABLE.includes(order.status)) {
    return bad('当前订单状态不支持申请退款', 400);
  }

  const existing = getRefundRequestByOrder(id);
  if (existing && existing.status === 'pending') {
    return bad('该订单已有退款申请正在处理中', 409);
  }

  const body = await readJson(req);
  const reason = String(body.reason ?? '').trim().slice(0, 500);
  if (!reason) return bad('请填写退款原因', 400);

  const request = createRefundRequest({
    orderId: order.id,
    userId: user.id,
    email: order.email,
    reason,
    amount: order.total,
  });

  return json({ ok: true, request });
}
