import { initDb } from '@/lib/db/loader';
import { bad, json, readJson, setUserCookie } from '@/lib/account/api';
import {
  createSession,
  currentSession,
  currentUser,
  passwordProblem,
  revokeAllSessions,
  verifyPassword,
  USER_COOKIE_OPTIONS,
} from '@/lib/account/auth';
import { findUserById, updateUser } from '@/lib/account/dao';

export const runtime = 'nodejs';

/** 设置 / 修改密码：改密后其他设备全部下线 */
export async function POST(req: Request) {
  await initDb();
  const user = await currentUser();
  const session = await currentSession();
  if (!user || !session) return bad('请先登录', 401);

  const body = await readJson(req);
  const issue = passwordProblem(body.password);
  if (issue) return bad(issue);

  if (user.password_hash) {
    const current = typeof body.currentPassword === 'string' ? body.currentPassword : '';
    if (!verifyPassword(current, user.password_hash)) return bad('当前密码不正确', 403);
  }

  updateUser(user.id, { password: String(body.password) });
  revokeAllSessions(user.id);
  const token = createSession(user.id, { userAgent: req.headers.get('user-agent') });
  const fresh = findUserById(user.id)!;

  const res = json({ ok: true, email: fresh.email });
  res.cookies.set('zhs_user_token', token, USER_COOKIE_OPTIONS);
  return setUserCookie(res, token);
}
