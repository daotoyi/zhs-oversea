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
  const contentType = req.headers.get('Content-Type') || '';
  if (contentType.includes('application/json')) {
    try {
      body = await req.json();
    } catch {
      return bad('请求格式错误');
    }
  } else {
    const formData = await req.formData().catch(() => null);
    if (!formData) return bad('请求格式错误');
    // field-name → value mapping
    body = {
      code: String(formData.get('code') ?? ''),
      type: String(formData.get('type') ?? 'percent'),
      value: Number(formData.get('value') ?? 0),
      min_subtotal: Number(formData.get('min_subtotal') ?? 0),
      max_uses: Number(formData.get('max_uses') ?? 0),
      per_customer_limit: Number(formData.get('per_customer_limit') ?? 0),
      starts_at: formData.get('starts_at') ? new Date(String(formData.get('starts_at'))).getTime() : null,
      ends_at: formData.get('ends_at') ? new Date(String(formData.get('ends_at'))).getTime() : null,
      status: String(formData.get('status') ?? 'active'),
      acquisition_mode: String(formData.get('acquisition_mode') ?? 'manual'),
    };
  }
  const code = String(body.code ?? '').trim().toUpperCase();
  if (!code && body.action !== 'delete') return bad('券码必填');
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
    acquisition_mode: String(body.acquisition_mode ?? body.acquisitionMode ?? 'manual'),
    created_by: auth.staff.username,
  });
  persistSoon();
  audit(auth.staff, 'coupon.save', code, `${coupon.type}=${coupon.value}`);
  return json({ coupon });
}
