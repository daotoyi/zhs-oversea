import { requireStaff, json, bad } from '@/lib/admin/guard';
import { initDb, persistSoon } from '@/lib/db/loader';
import { listCustomers, updateCustomer, allTags } from '@/lib/admin/dao';
import { audit } from '@/lib/admin/dao';

export async function GET(req: Request) {
  const auth = await requireStaff('users');
  if (!auth.ok) return auth.res;
  await initDb();
  const url = new URL(req.url);
  const customers = listCustomers({
    tag: url.searchParams.get('tag') ?? undefined,
    q: url.searchParams.get('q') ?? undefined,
  });
  return json({ customers, tags: allTags() });
}

export async function PATCH(req: Request) {
  const auth = await requireStaff('users');
  if (!auth.ok) return auth.res;
  await initDb();
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad('请求格式错误');
  }
  const id = String(body.id ?? '');
  if (!id) return bad('缺少用户 ID');
  updateCustomer(id, {
    name: body.name !== undefined ? String(body.name) : undefined,
    tags: Array.isArray(body.tags) ? body.tags.map(String) : undefined,
    notes: body.notes !== undefined ? String(body.notes) : undefined,
  });
  persistSoon();
  audit(auth.staff, 'customer.update', id, `tags=${JSON.stringify(body.tags)}`);
  return json({ ok: true });
}
