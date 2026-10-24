import { requireStaff, json, bad } from '@/lib/admin/guard';
import { initDb, persistSoon } from '@/lib/db/loader';
import { listOrders, updateOrderStatus } from '@/lib/admin/dao';
import { audit } from '@/lib/admin/dao';

export async function GET(req: Request) {
  const auth = await requireStaff('orders');
  if (!auth.ok) return auth.res;
  await initDb();
  const url = new URL(req.url);
  const status = url.searchParams.get('status') ?? undefined;
  const q = url.searchParams.get('q') ?? undefined;
  const orders = listOrders({ status, q, limit: 1000 });
  return json({ orders });
}

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
  const status = String(body.status ?? '');
  if (!id) return bad('缺少订单号');
  if (!['paid', 'shipped', 'refunded', 'cancelled'].includes(status)) return bad('非法状态');
  updateOrderStatus(id, status, body.tracking_no ? String(body.tracking_no) : undefined);
  persistSoon();
  audit(auth.staff, 'order.status', id, `status=${status}`);
  return json({ ok: true });
}
