import { NextRequest, NextResponse } from 'next/server';
import { initDb } from '@/lib/db/loader';
import { publicBaseUrl } from '@/lib/admin/http';
import { USER_COOKIE_OPTIONS, createSession } from '@/lib/account/auth';
import {
  createUser,
  findIdentity,
  findUserByEmail,
  findUserById,
  linkIdentity,
  touchLogin,
  updateUser,
} from '@/lib/account/dao';
import { awardSignup } from '@/lib/account/points';
import {
  consumeState,
  exchangeCode,
  isProviderEnabled,
  verifyGoogleIdToken,
} from '@/lib/account/oauth';
import type { OAuthProfile, ProviderKey } from '@/lib/account/oauth';

export const runtime = 'nodejs';

/**
 * OAuth 回调。
 *
 * Google：前端中继，POST JSON { id_token, state }（服务器用本地 JWKS 验签，不访问 Google）。
 * Apple ：服务端 form_post，POST 表单（code + user），由服务器换 token（Apple 端点同样被墙，暂未启用）。
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  // Google 已改为前端页面中继（id_token 在 fragment），本 API 不再接收 Google 的 GET；
  // 直接到这里的按取消处理。
  const base = publicBaseUrl(req);
  return NextResponse.redirect(new URL('/account/login?error=oauth_cancelled', base));
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  const ct = req.headers.get('content-type') || '';
  let idToken: string | null = null;
  let state = '';
  let form: FormData | null = null;

  if (ct.includes('application/json')) {
    try {
      const j = (await req.json()) as { id_token?: string; state?: string };
      idToken = j.id_token ?? null;
      state = j.state ?? '';
    } catch {
      /* ignore */
    }
  } else {
    try {
      form = await req.formData();
      if (form) state = String(form.get('state') || '');
    } catch {
      form = null;
    }
  }
  return handle(req, ctx, form, idToken, state);
}

async function handle(
  req: NextRequest,
  ctx: { params: Promise<{ provider: string }> },
  form: FormData | null,
  idToken: string | null,
  state: string
) {
  const { provider } = await ctx.params;
  const base = publicBaseUrl(req);
  const fail = (code: string) => NextResponse.redirect(new URL(`/account/login?error=${code}`, base));

  if (provider !== 'google' && provider !== 'apple') return fail('unknown_provider');
  if (!isProviderEnabled(provider as ProviderKey)) return fail('provider_disabled');
  if (!state) return fail('oauth_cancelled');

  await initDb();
  const checked = await consumeState(state, provider as ProviderKey);
  if (!checked.ok) return fail('oauth_state');

  let profile: OAuthProfile | null = null;
  if (idToken) {
    profile = await verifyGoogleIdToken(idToken, checked.nonce);
  } else if (form) {
    const code = String(form.get('code') || '');
    if (code) profile = await exchangeCode(provider as ProviderKey, code, base);
  }
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

  // 前端中继流程（idToken）返回 JSON 让前端跳转；浏览器 form_post 流程（Apple）返回 302 跟随。
  const res = idToken
    ? NextResponse.json({ ok: true, redirectTo: checked.redirectTo || '/account' })
    : NextResponse.redirect(new URL(checked.redirectTo || '/account', base));
  res.cookies.set('zhs_user_token', token, USER_COOKIE_OPTIONS);
  return res;
}
