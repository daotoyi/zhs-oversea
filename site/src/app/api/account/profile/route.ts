import { initDb } from '@/lib/db/loader';
import { bad, json, readJson } from '@/lib/account/api';
import { currentSession, currentUser } from '@/lib/account/auth';
import { findUserById, updateUser } from '@/lib/account/dao';

export const runtime = 'nodejs';

/** 更新资料（姓名 / 生日 / 营销订阅） */
export async function PATCH(req: Request) {
  await initDb();
  const user = await currentUser();
  if (!user) return bad('请先登录', 401);

  const body = await readJson(req);
  const patch: { name?: string | null; birthday?: string | null; marketingOptIn?: boolean } = {};

  if (body.name !== undefined) {
    if (typeof body.name !== 'string') return bad('姓名格式不正确');
    patch.name = body.name.trim().slice(0, 80) || null;
  }
  if (body.birthday !== undefined) {
    if (body.birthday === null || body.birthday === '') {
      patch.birthday = null;
    } else {
      const m = /^(\d{1,2})-(\d{1,2})$/.exec(String(body.birthday).trim());
      if (!m) return bad('生日格式请用 MM-DD');
      const mm = Number(m[1]);
      const dd = Number(m[2]);
      if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return bad('生日日期无效');
      patch.birthday = `${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
    }
  }
  if (body.marketingOptIn !== undefined) patch.marketingOptIn = Boolean(body.marketingOptIn);

  updateUser(user.id, patch);
  const fresh = findUserById(user.id)!;
  return json({
    ok: true,
    user: {
      id: fresh.id,
      email: fresh.email,
      name: fresh.name,
      birthday: fresh.birthday,
      marketingOptIn: fresh.marketing_opt_in === 1,
    },
  });
}

/** 主动登出其他设备 */
export async function DELETE() {
  await initDb();
  const session = await currentSession();
  if (!session) return bad('请先登录', 401);
  const { revokeAllSessions, createSession, USER_COOKIE_OPTIONS } = await import('@/lib/account/auth');
  revokeAllSessions(session.userId);
  // 当前设备换发新会话，用户不会被自己踢下线
  const token = createSession(session.userId, {});
  const res = json({ ok: true });
  res.cookies.set('zhs_user_token', token, USER_COOKIE_OPTIONS);
  return res;
}
