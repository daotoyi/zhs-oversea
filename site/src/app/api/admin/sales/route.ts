import { requireStaff, json, bad } from '@/lib/admin/guard';
import { initDb, persistSoon } from '@/lib/db/loader';
import { listSaleEvents, saveSaleEvent, deleteSaleEvent } from '@/lib/admin/dao';
import { audit } from '@/lib/admin/dao';

export async function GET() {
  const auth = await requireStaff('sales');
  if (!auth.ok) return auth.res;
  await initDb();
  return json({ events: listSaleEvents() });
}

export async function POST(req: Request) {
  const auth = await requireStaff('sales');
  if (!auth.ok) return auth.res;
  await initDb();
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad('请求格式错误');
  }
  if (body.action === 'delete') {
    deleteSaleEvent(String(body.id ?? ''));
    persistSoon();
    audit(auth.staff, 'sale.delete', String(body.id ?? ''));
    return json({ ok: true });
  }
  const name = String(body.name ?? '').trim();
  const percent = Number(body.discount_percent ?? 0);
  const starts = Number(body.starts_at ?? 0);
  const ends = Number(body.ends_at ?? 0);
  if (!name || percent < 1 || percent > 90 || !starts || !ends || ends <= starts) {
    return bad('名称必填，折扣 1–90%，起止时间需合法且晚于开始');
  }
  const event = saveSaleEvent({
    id: body.id ? String(body.id) : undefined,
    name,
    discount_percent: percent,
    applies_to: String(body.applies_to ?? 'all'),
    target: Array.isArray(body.target) ? JSON.stringify(body.target) : String(body.target ?? '[]'),
    starts_at: starts,
    ends_at: ends,
    status: String(body.status ?? 'active'),
  });
  persistSoon();
  audit(auth.staff, 'sale.save', event.id, `name=${name} percent=${percent}`);
  return json({ event });
}
