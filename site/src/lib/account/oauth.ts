/**
 * 第三方登录（Google / Apple）—— 原生实现，不引入 next-auth
 *
 * 只有配置了对应环境变量，前台才会出现该按钮；未配置时完全静默，
 * 不影响邮箱密码注册登录。
 *
 *   GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
 *   APPLE_CLIENT_ID（Services ID）/ APPLE_TEAM_ID / APPLE_KEY_ID / APPLE_PRIVATE_KEY（.p8 内容）
 *
 * 回调地址（必须在各自控制台登记）：
 *   https://zhenhesheng.com/api/auth/oauth/google/callback
 *   https://zhenhesheng.com/api/auth/oauth/apple/callback
 */

import crypto from 'node:crypto';
import { SignJWT, importPKCS8 } from 'jose';

export type ProviderKey = 'google' | 'apple';

export type OAuthProfile = {
  providerUid: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
};

export type ProviderMeta = {
  key: ProviderKey;
  label: string;
  enabled: boolean;
};

export function isProviderEnabled(key: ProviderKey): boolean {
  if (key === 'google') return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  return Boolean(
    process.env.APPLE_CLIENT_ID &&
      process.env.APPLE_TEAM_ID &&
      process.env.APPLE_KEY_ID &&
      process.env.APPLE_PRIVATE_KEY
  );
}

export function enabledProviders(): ProviderMeta[] {
  return [
    { key: 'google', label: 'Google', enabled: isProviderEnabled('google') },
    { key: 'apple', label: 'Apple', enabled: isProviderEnabled('apple') },
  ];
}

export function redirectUri(base: string, key: ProviderKey): string {
  return `${base}/api/auth/oauth/${key}/callback`;
}

export function authorizeUrl(key: ProviderKey, state: string, base: string): string {
  const uri = redirectUri(base, key);
  if (key === 'google') {
    const p = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: uri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      access_type: 'online',
      prompt: 'select_account',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${p.toString()}`;
  }
  const p = new URLSearchParams({
    client_id: process.env.APPLE_CLIENT_ID!,
    redirect_uri: uri,
    response_type: 'code',
    scope: 'name email',
    response_mode: 'form_post',
    state,
  });
  return `https://appleid.apple.com/auth/authorize?${p.toString()}`;
}

/** Apple 的 client_secret 是 ES256 签名的短时 JWT，最长 6 个月，这里签 5 分钟 */
async function appleClientSecret(): Promise<string> {
  const privateKey = (process.env.APPLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const key = await importPKCS8(privateKey, 'ES256');
  const nowSec = Math.floor(Date.now() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: process.env.APPLE_KEY_ID! })
    .setIssuer(process.env.APPLE_TEAM_ID!)
    .setAudience('https://appleid.apple.com')
    .setSubject(process.env.APPLE_CLIENT_ID!)
    .setIssuedAt(nowSec)
    .setExpirationTime(nowSec + 300)
    .sign(key);
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const part = token.split('.')[1];
  if (!part) return null;
  try {
    return JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function exchangeCode(
  key: ProviderKey,
  code: string,
  base: string
): Promise<OAuthProfile | null> {
  const uri = redirectUri(base, key);

  if (key === 'google') {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: uri,
        grant_type: 'authorization_code',
      }),
    });
    if (!res.ok) {
      console.error('[oauth] google token failed', res.status, (await res.text()).slice(0, 200));
      return null;
    }
    const data = (await res.json()) as { access_token?: string; id_token?: string };
    if (!data.access_token) return null;
    const infoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    if (!infoRes.ok) return null;
    const info = (await infoRes.json()) as {
      sub?: string;
      email?: string;
      email_verified?: boolean;
      name?: string;
      picture?: string;
    };
    if (!info.sub) return null;
    return {
      providerUid: info.sub,
      email: info.email ?? null,
      name: info.name ?? null,
      avatarUrl: info.picture ?? null,
      emailVerified: Boolean(info.email_verified),
    };
  }

  // Apple
  const clientSecret = await appleClientSecret();
  const res = await fetch('https://appleid.apple.com/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.APPLE_CLIENT_ID!,
      client_secret: clientSecret,
      redirect_uri: uri,
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) {
    console.error('[oauth] apple token failed', res.status, (await res.text()).slice(0, 200));
    return null;
  }
  const data = (await res.json()) as { id_token?: string };
  const claims = data.id_token ? decodeJwtPayload(data.id_token) : null;
  if (!claims?.sub) return null;
  return {
    providerUid: String(claims.sub),
    email: typeof claims.email === 'string' ? claims.email : null,
    name: null, // Apple 只在首次授权通过 form_post 的 user 字段给名字，由调用方补
    avatarUrl: null,
    emailVerified: claims.email_verified === true || claims.email_verified === 'true',
  };
}

/* ── state 防 CSRF（落库，多实例也安全）── */

export async function createState(provider: ProviderKey, redirectTo: string | null): Promise<string> {
  const { run, now } = await import('@/lib/db/loader');
  const state = crypto.randomBytes(24).toString('base64url');
  run('INSERT INTO oauth_states (state, provider, redirect_to, created_at, expires_at) VALUES (?, ?, ?, ?, ?)', [
    state,
    provider,
    redirectTo,
    now(),
    now() + 10 * 60 * 1000,
  ]);
  return state;
}

export async function consumeState(state: string, provider: ProviderKey): Promise<{ ok: boolean; redirectTo: string | null }> {
  const { get, run, now } = await import('@/lib/db/loader');
  const row = get<{ provider: string; redirect_to: string | null; expires_at: number }>(
    'SELECT provider, redirect_to, expires_at FROM oauth_states WHERE state = ?',
    [state]
  );
  if (!row) return { ok: false, redirectTo: null };
  run('DELETE FROM oauth_states WHERE state = ?', [state]);
  if (row.provider !== provider || row.expires_at < now()) return { ok: false, redirectTo: null };
  return { ok: true, redirectTo: row.redirect_to };
}
