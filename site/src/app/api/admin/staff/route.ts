import { requireStaff, json, bad } from '@/lib/admin/guard';
import { initDb, persistSoon } from '@/lib/db/loader';
import { listStaff, createStaff, updateStaff, deleteStaff, audit } from '@/lib/admin/dao';

/** 员工管理仅超级管理员可访问 */
export async function GET() {
  const auth = await requireStaff();
  if (!auth.ok) return auth.res;
  if (auth.staff.role !== 'super') return bad('仅超级管理员可管理员工', 403);
  await initDb();
  return json({ staff: listStaff().map(({ password_hash, ...rest }) => rest) });
}

export async function POST(req: Request) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.res;
  if (auth.staff.role !== 'super') return bad('仅超级管理员可管理员工', 403);
  await initDb();
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad('请求格式错误');
  }
  const username = String(body.username ?? '').trim();
  const password = String(body.password ?? '');
  const name = String(body.name ?? '').trim();
  const role = String(body.role ?? 'ops');
  if (!username || !password || !name) return bad('工号、密码、姓名必填');
  if (!['super', 'admin', 'ops', 'support'].includes(role)) return bad('非法角色');
  if (password.length < 6) return bad('密码至少 6 位');

  if (body.action === 'delete') {
    if (String(body.id) === auth.staff.id) return bad('不能删除自己');
    deleteStaff(String(body.id));
    persistSoon();
    audit(auth.staff, 'staff.delete', String(body.username ?? body.id ?? ''));
    return json({ ok: true });
  }

  const staff = createStaff({
    username,
    password,
    name,
    role,
    permissions: Array.isArray(body.permissions) ? (body.permissions as never) : undefined,
  });
  persistSoon();
  audit(auth.staff, 'staff.create', staff.username, `role=${role}`);
  return json({ staff: { ...staff, password_hash: undefined } });
}

export async function PATCH(req: Request) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.res;
  if (auth.staff.role !== 'super') return bad('仅超级管理员可管理员工', 403);
  await initDb();
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad('请求格式错误');
  }
  const id = String(body.id ?? '');
  if (!id) return bad('缺少员工 ID');
  if (id === auth.staff.id && (body.status === 'disabled' || body.role !== undefined)) {
    return bad('不能修改自己的角色或停用自己');
  }
  updateStaff(id, {
    name: body.name !== undefined ? String(body.name) : undefined,
    role: body.role !== undefined ? String(body.role) : undefined,
    status: body.status !== undefined ? String(body.status) : undefined,
    password: body.password ? String(body.password) : undefined,
    permissions: Array.isArray(body.permissions) ? (body.permissions as never) : undefined,
  });
  persistSoon();
  audit(auth.staff, 'staff.update', id, JSON.stringify(body));
  return json({ ok: true });
}
