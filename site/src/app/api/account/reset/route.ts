import { initDb } from '@/lib/db/loader';
import { bad, json, readJson } from '@/lib/account/api';
import { passwordProblem, revokeAllSessions } from '@/lib/account/auth';
import { consumeToken, findUserById, touchLogin, updateUser } from '@/lib/account/dao';

export const runtime = 'nodejs';

/** 用邮件链接里的 token 重设密码 */
export async function POST(req: Request) {
  await initDb();
  const body = await readJson(req);
  const token = typeof body.token === 'string' ? body.token.trim() : '';
  if (!token) return bad('链接无效');

  const issue = passwordProblem(body.password);
  if (issue) return bad(issue);

  const userId = consumeToken(token, 'reset');
  if (!userId) return bad('链接已失效或已使用，请重新申请', 400);

  const user = findUserById(userId);
  if (!user || user.status !== 'active') return bad('账户不可用', 403);

  updateUser(userId, { password: String(body.password) });
  revokeAllSessions(userId); // 改密后所有旧会话下线
  touchLogin(userId);

  return json({ ok: true, email: user.email });
}
