import { clearUserCookie, json } from '@/lib/account/api';
import { currentSession, revokeSession } from '@/lib/account/auth';

export const runtime = 'nodejs';

export async function POST() {
  const session = await currentSession();
  if (session) revokeSession(session.sessionId);
  return clearUserCookie(json({ ok: true }));
}
