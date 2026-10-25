import { requireStaff, json, bad } from '@/lib/admin/guard';
import { initDb, persistSoon } from '@/lib/db/loader';
import {
  getRefundRequest,
  listRefundRequests,
  setRefundRequestStatus,
  updateOrderStatus,
} from '@/lib/admin/dao';
import { reverseOrderPoints } from '@/lib/account/points';
import { audit } from '@/lib/admin/dao';

export const runtime = 'nodejs';

/** 退款申请列表（待处理在前） */
export async function GET() {
  const auth = await requireStaff('orders');
  if (!auth.ok) return auth.res;
  await initDb();
  return json({ refunds: listRefundRequests() });
}

/**
 * 处理退款申请
 * PATCH /api/admin/refunds  { id, action: 'approve' | 'reject', note }
 *
 * 批准：订单置 refunded，并回滚该单发放的会员积分（ledger reason=refund）。
 * 拒绝：保留订单原状态，仅记录处理结果与备注。
 */
export async function PATCH(req: Request) {
  const auth = await requireStaff('orders');
  if (!auth.ok) return auth.res;
  await initDb();

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad('请求格式错误');
  }

  const id = String(body.id ?? '');
  const action = String(body.action ?? '');
  const note = body.note ? String(body.note).slice(0, 500) : undefined;
  if (!id) return bad('缺少申请号');
  if (action !== 'approve' && action !== 'reject') return bad('非法操作');

  const refund = getRefundRequest(id);
  if (!refund) return bad('退款申请不存在', 404);
  if (refund.status !== 'pending') return bad('该申请已处理过', 409);

  if (action === 'approve') {
    updateOrderStatus(refund.order_id, 'refunded');
    setRefundRequestStatus(id, 'approved', note);
    // 回滚该单发放的积分（无会员归属或未发过积分则跳过）
    if (refund.user_id) {
      try {
        reverseOrderPoints(refund.user_id, refund.order_id);
      } catch (err) {
        console.error('[refund] 积分回滚失败:', err instanceof Error ? err.message : err);
      }
    }
    audit(auth.staff, 'order.refund', refund.order_id, `approved refund=${id}`);
  } else {
    setRefundRequestStatus(id, 'rejected', note);
    audit(auth.staff, 'order.refund', refund.order_id, `rejected refund=${id}`);
  }

  persistSoon();
  return json({ ok: true });
}
