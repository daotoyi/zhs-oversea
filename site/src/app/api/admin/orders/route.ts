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
  if (!['paid', 'shipped', 'delivered', 'refunded', 'cancelled'].includes(status)) return bad('非法状态');
  const carrier = body.carrier !== undefined ? String(body.carrier).slice(0, 80) : undefined;
  const tracking = body.tracking_no !== undefined ? String(body.tracking_no).slice(0, 80) : undefined;
  updateOrderStatus(id, status, tracking, carrier);
  persistSoon();
  audit(auth.staff, 'order.status', id, `status=${status}${carrier ? ` carrier=${carrier}` : ''}`);
  return json({ ok: true });
}
