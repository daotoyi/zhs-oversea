import { requireStaff, json, bad } from '@/lib/admin/guard';
import { initDb, persistSoon } from '@/lib/db/loader';
import { listCoupons, saveCoupon, deleteCoupon } from '@/lib/admin/dao';
import { audit } from '@/lib/admin/dao';

export async function GET() {
  const auth = await requireStaff('coupons');
  if (!auth.ok) return auth.res;
  await initDb();
  return json({ coupons: listCoupons() });
}

export async function POST(req: Request) {
  const auth = await requireStaff('coupons');
  if (!auth.ok) return auth.res;
  await initDb();
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad('请求格式错误');
  }
  const code = String(body.code ?? '').trim().toUpperCase();
  if (!code) return bad('券码必填');
  if (body.action === 'delete') {
    deleteCoupon(code);
    persistSoon();
    audit(auth.staff, 'coupon.delete', code);
    return json({ ok: true });
  }
  const coupon = saveCoupon({
    code,
    type: String(body.type ?? 'percent'),
    value: Number(body.value ?? 0),
    min_subtotal: Number(body.min_subtotal ?? 0),
    max_uses: Number(body.max_uses ?? 0),
    per_customer_limit: Number(body.per_customer_limit ?? 0),
    starts_at: body.starts_at ? Number(body.starts_at) : null,
    ends_at: body.ends_at ? Number(body.ends_at) : null,
    status: String(body.status ?? 'active'),
    created_by: auth.staff.username,
  });
  persistSoon();
  audit(auth.staff, 'coupon.save', code, `${coupon.type}=${coupon.value}`);
  return json({ coupon });
}
