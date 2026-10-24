import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, COOKIE_OPTIONS, signToken } from '@/lib/admin/auth';
import { authenticate, ensureSuperAdmin } from '@/lib/admin/dao';
import { initDb } from '@/lib/db/loader';

export async function POST(req: NextRequest) {
  await initDb();
  ensureSuperAdmin();

  const form = await req.formData().catch(() => null);
  const username = String(form?.get('username') ?? '').trim();
  const password = String(form?.get('password') ?? '');

  if (!username || !password) {
    return NextResponse.redirect(new URL('/admin/login?e=1', req.url), 303);
  }

  const session = authenticate(username, password);
  if (!session) {
    return NextResponse.redirect(new URL('/admin/login?e=2', req.url), 303);
  }

  const store = await cookies();
  store.set(ADMIN_COOKIE, signToken(session), COOKIE_OPTIONS);
  return NextResponse.redirect(new URL('/admin', req.url), 303);
}
