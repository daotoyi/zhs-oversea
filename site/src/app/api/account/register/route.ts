import { initDb } from '@/lib/db/loader';
import { bad, json, readJson, safeNext, setUserCookie } from '@/lib/account/api';
import { createSession, normalizeEmail, passwordProblem, rateLimit, clientIp, sweepExpired } from '@/lib/account/auth';
import { createUser, findUserByEmail, findUserById, linkIdentity, touchLogin, updateUser } from '@/lib/account/dao';
import { awardSignup, grantWelcomeCoupon } from '@/lib/account/points';

export const runtime = 'nodejs';

/**
 * 注册（邮箱 + 密码）
 *
 * 特例：邮箱已存在但从未设密码（此前用 Google/Apple 授权登录过）时，
 * 视为「补齐密码」而不是报重复注册 —— 避免同一个邮箱被迫分裂成两个账户。
 */
export async function POST(req: Request) {
  await initDb();
  sweepExpired();

  const ip = clientIp(req);
  if (!rateLimit(`register:${ip}`, 8)) return bad('操作过于频繁，请稍后再试', 429);

  const body = await readJson(req);
  const email = normalizeEmail(body.email);
  if (!email) return bad('请输入有效邮箱');
  const pwdIssue = passwordProblem(body.password);
  if (pwdIssue) return bad(pwdIssue);

  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 80) || null : null;
  const birthday = validBirthday(body.birthday);
  const marketingOptIn = body.marketingOptIn !== false;

  const existing = findUserByEmail(email);
  let userId: string;

  if (existing) {
    if (existing.password_hash) return bad('该邮箱已注册，请直接登录', 409);
    // OAuth-only 账户：补密码并登录
    updateUser(existing.id, { password: String(body.password), name: name ?? existing.name ?? null });
    linkIdentity(existing.id, 'password', existing.id, email);
    userId = existing.id;
  } else {
    const user = createUser({
      email,
      name,
      password: String(body.password),
      birthday,
      marketingOptIn,
      provider: 'password',
      providerUid: '', // createUser 内部回落到新 userId
    });
    userId = user.id;
    awardSignup(userId);
    grantWelcomeCoupon(userId, email);
  }

  touchLogin(userId);
  const token = createSession(userId, { userAgent: req.headers.get('user-agent'), ip });
  const user = findUserById(userId)!;

  const res = json({ ok: true, redirect: safeNext(body.next), user: publicUser(user) });
  return setUserCookie(res, token);
}

function validBirthday(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const m = /^(\d{1,2})-(\d{1,2})$/.exec(raw.trim());
  if (!m) return null;
  const mm = Number(m[1]);
  const dd = Number(m[2]);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  return `${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
}

function publicUser(u: { id: string; email: string; name: string | null; points: number; tier: string; birthday: string | null }) {
  return { id: u.id, email: u.email, name: u.name, points: u.points, tier: u.tier, birthday: u.birthday };
}
