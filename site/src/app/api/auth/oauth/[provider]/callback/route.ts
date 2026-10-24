import { NextRequest, NextResponse } from 'next/server';
import { initDb } from '@/lib/db/loader';
import { publicBaseUrl } from '@/lib/admin/http';
import { USER_COOKIE_OPTIONS, createSession } from '@/lib/account/auth';
import { createUser, findIdentity, findUserByEmail, findUserById, linkIdentity, touchLogin, updateUser } from '@/lib/account/dao';
import { awardSignup } from '@/lib/account/points';
import { consumeState, exchangeCode, isProviderEnabled } from '@/lib/account/oauth';
import type { ProviderKey } from '@/lib/account/oauth';

export const runtime = 'nodejs';

/**
 * OAuth 回调
 *
 * Google 走 GET（query 带 code/state）；
 * Apple 用 response_mode=form_post，走 POST（表单里带 code/state/user）。
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  return handle(req, ctx, null);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  let form: FormData | null = null;
  try {
    form = await req.formData();
  } catch {
    form = null;
  }
  return handle(req, ctx, form);
}

async function handle(req: NextRequest, ctx: { params: Promise<{ provider: string }> }, form: FormData | null) {
  const { provider } = await ctx.params;
  const base = publicBaseUrl(req);
  const fail = (code: string) => NextResponse.redirect(new URL(`/account/login?error=${code}`, base));

  if (provider !== 'google' && provider !== 'apple') return fail('unknown_provider');
  if (!isProviderEnabled(provider as ProviderKey)) return fail('provider_disabled');

  const url = new URL(req.url);
  const code = form ? String(form.get('code') || '') : url.searchParams.get('code') || '';
  const state = form ? String(form.get('state') || '') : url.searchParams.get('state') || '';
  if (!code || !state) return fail('oauth_cancelled');

  await initDb();
  const checked = await consumeState(state, provider as ProviderKey);
  if (!checked.ok) return fail('oauth_state');

  const profile = await exchangeCode(provider as ProviderKey, code, base);
  if (!profile) return fail('oauth_failed');

  // Apple 首次授权会把姓名放在 user 字段里（JSON）
  let appleName: string | null = null;
  const rawUser = form?.get('user');
  if (typeof rawUser === 'string' && rawUser) {
    try {
      const parsed = JSON.parse(rawUser) as { name?: { firstName?: string; lastName?: string } };
      const parts = [parsed.name?.firstName, parsed.name?.lastName].filter(Boolean) as string[];
      if (parts.length) appleName = parts.join(' ');
    } catch {
      /* ignore */
    }
  }

  const identity = findIdentity(provider, profile.providerUid);
  let userId: string;

  if (identity) {
    userId = identity.user_id;
    if (profile.email) {
      const u = findUserById(userId);
      if (u && !u.email_verified) updateUser(userId, { emailVerified: profile.emailVerified });
    }
  } else if (profile.email && findUserByEmail(profile.email)) {
    // 同邮箱已有账户 → 关联而非新建，避免账户分裂
    const existing = findUserByEmail(profile.email)!;
    userId = existing.id;
    linkIdentity(userId, provider, profile.providerUid, profile.email);
  } else {
    if (!profile.email) {
      // Apple 隐藏邮箱的极端情况：没有邮箱无法建账户
      return fail('oauth_no_email');
    }
    const created = createUser({
      email: profile.email,
      name: appleName ?? profile.name,
      provider: provider as ProviderKey,
      providerUid: profile.providerUid,
      avatarUrl: profile.avatarUrl,
      emailVerified: profile.emailVerified,
    });
    userId = created.id;
    awardSignup(userId);
  }

  const user = findUserById(userId);
  if (!user || user.status !== 'active') return fail('account_disabled');

  touchLogin(userId);
  const token = createSession(userId, { userAgent: req.headers.get('user-agent') });

  const res = NextResponse.redirect(new URL(checked.redirectTo || '/account', base));
  res.cookies.set('zhs_user_token', token, USER_COOKIE_OPTIONS);
  return res;
}
