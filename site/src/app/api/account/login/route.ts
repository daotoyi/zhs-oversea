import { initDb } from '@/lib/db/loader';
import { bad, json, readJson, safeNext, setUserCookie } from '@/lib/account/api';
import { clientIp, createSession, normalizeEmail, rateLimit, sweepExpired, verifyPassword } from '@/lib/account/auth';
import { findUserByEmail, touchLogin } from '@/lib/account/dao';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  await initDb();
  sweepExpired();

  const body = await readJson(req);
  const email = normalizeEmail(body.email);
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !password) return bad('请输入邮箱与密码');

  const ip = clientIp(req);
  if (!rateLimit(`login:${ip}`, 15) || !rateLimit(`login:${email}`, 8)) {
    return bad('尝试次数过多，请 10 分钟后再试', 429);
  }

  const user = findUserByEmail(email);
  if (!user) return bad('邮箱或密码不正确', 401);
  if (user.status !== 'active') return bad('该账户已被停用，请联系我们', 403);

  if (!user.password_hash) {
    return bad('该邮箱此前用 Google / Apple 授权登录，请用同一方式登录，或先设置密码', 409);
  }
  if (!verifyPassword(password, user.password_hash)) return bad('邮箱或密码不正确', 401);

  touchLogin(user.id);
  const token = createSession(user.id, { userAgent: req.headers.get('user-agent'), ip });
  const res = json({
    ok: true,
    redirect: safeNext(body.next),
    user: { id: user.id, email: user.email, name: user.name, points: user.points, tier: user.tier },
  });
  return setUserCookie(res, token);
}
