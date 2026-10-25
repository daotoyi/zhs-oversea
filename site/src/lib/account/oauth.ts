/**
 * 第三方登录（Google / Apple）—— 原生实现，不引入 next-auth
 *
 * 凭据来源优先级：后台「登录配置」页（settings 表）> 环境变量。
 * 两者都没有时，前台按钮仍会显示（让用户看得见有哪些方式），
 * 但点进会回到登录页并提示「尚未启用」，绝不静默失败。
 *
 *   Google：Client ID + Client Secret
 *   Apple ：Services ID + Team ID + Key ID + Private Key(.p8)
 *
 * 回调地址（必须在各自控制台登记，一字不差）：
 *   https://zhenhesheng.com/api/auth/oauth/google/callback
 *   https://zhenhesheng.com/api/auth/oauth/apple/callback
 */

import crypto from 'node:crypto';
import { SignJWT, importPKCS8, jwtVerify, createLocalJWKSet } from 'jose';
import { resolve } from '@/lib/settings';
import { GOOGLE_JWKS } from './google-jwks';

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
  /** 已填写了哪些字段，后台诊断用 */
  missing: string[];
};

export type Credentials = {
  clientId: string | null;
  clientSecret: string | null;
  teamId: string | null;
  keyId: string | null;
  privateKey: string | null;
};

export function credentials(key: ProviderKey): Credentials {
  if (key === 'google') {
    return {
      clientId: resolve('oauth_google_client_id', 'GOOGLE_CLIENT_ID'),
      clientSecret: resolve('oauth_google_client_secret', 'GOOGLE_CLIENT_SECRET'),
      teamId: null,
      keyId: null,
      privateKey: null,
    };
  }
  return {
    clientId: resolve('oauth_apple_client_id', 'APPLE_CLIENT_ID'),
    clientSecret: null,
    teamId: resolve('oauth_apple_team_id', 'APPLE_TEAM_ID'),
    keyId: resolve('oauth_apple_key_id', 'APPLE_KEY_ID'),
    privateKey: resolve('oauth_apple_private_key', 'APPLE_PRIVATE_KEY')?.replace(/\\n/g, '\n') ?? null,
  };
}

export function missingFields(key: ProviderKey): string[] {
  const c = credentials(key);
  if (key === 'google') {
    const miss: string[] = [];
    if (!c.clientId) miss.push('Client ID');
    if (!c.clientSecret) miss.push('Client Secret');
    return miss;
  }
  const miss: string[] = [];
  if (!c.clientId) miss.push('Services ID');
  if (!c.teamId) miss.push('Team ID');
  if (!c.keyId) miss.push('Key ID');
  if (!c.privateKey) miss.push('Private Key');
  return miss;
}

export function isProviderEnabled(key: ProviderKey): boolean {
  return missingFields(key).length === 0;
}

export function enabledProviders(): ProviderMeta[] {
  return (['google', 'apple'] as ProviderKey[]).map((key) => ({
    key,
    label: key === 'google' ? 'Google' : 'Apple',
    enabled: isProviderEnabled(key),
    missing: missingFields(key),
  }));
}

export function redirectUri(base: string, key: ProviderKey): string {
  return `${base}/api/auth/oauth/${key}/callback`;
}

/** Google 走前端页面中继（国内服务器无法直连 Google，故用隐式 id_token 流 + 本地验签） */
export function frontendRedirectUri(base: string, key: ProviderKey): string {
  return `${base}/account/oauth/${key}/callback`;
}

export function authorizeUrl(key: ProviderKey, state: string, nonce: string, base: string): string {
  const creds = credentials(key);
  if (key === 'google') {
    const p = new URLSearchParams({
      client_id: creds.clientId!,
      redirect_uri: frontendRedirectUri(base, key),
      response_type: 'id_token',
      scope: 'openid email profile',
      state,
      nonce,
      prompt: 'select_account',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${p.toString()}`;
  }
  const uri = redirectUri(base, key);
  const p = new URLSearchParams({
    client_id: creds.clientId!,
    redirect_uri: uri,
    response_type: 'code',
    scope: 'name email',
    response_mode: 'form_post',
    state,
  });
  return `https://appleid.apple.com/auth/authorize?${p.toString()}`;
}

/** Apple 的 client_secret 是 ES256 签名的短时 JWT，最长 6 个月，这里签 5 分钟 */
async function appleClientSecret(privateKeyOverride?: string): Promise<string> {
  const creds = credentials('apple');
  const key = await importPKCS8(privateKeyOverride ?? creds.privateKey!, 'ES256');
  const nowSec = Math.floor(Date.now() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: creds.keyId! })
    .setIssuer(creds.teamId!)
    .setAudience('https://appleid.apple.com')
    .setSubject(creds.clientId!)
    .setIssuedAt(nowSec)
    .setExpirationTime(nowSec + 300)
    .sign(key);
}

/**
 * 归一化私钥：Apple 官方 .p8 是 PKCS#8（BEGIN PRIVATE KEY），但用户可能从别处
 * 拿到 SEC1（BEGIN EC PRIVATE KEY）。jose 的 importPKCS8 只吃 PKCS#8，
 * 这里统一转换，避免用户对着「must be PKCS#8 formatted string」发懵。
 */
export function normalizePrivateKey(raw: string): { key: string } | { error: string } {
  const key = raw.replace(/\\n/g, '\n').trim();
  if (!key.includes('BEGIN')) return { error: '看起来不是 PEM 格式的私钥，请粘贴 .p8 文件全文' };
  try {
    const obj = crypto.createPrivateKey({ key });
    const pkcs8 = obj.export({ type: 'pkcs8', format: 'pem' }).toString();
    return { key: pkcs8 };
  } catch (err) {
    return { error: `私钥无法解析：${err instanceof Error ? err.message : String(err)}` };
  }
}

/** 校验 Apple .p8 私钥是否可用（后台保存时前置检查，避免线上才发现） */
export async function validateAppleKey(override?: string): Promise<string | null> {
  const creds = credentials('apple');
  const source = override ?? creds.privateKey;
  if (!source) return '未填写 Private Key';
  if (!creds.teamId || !creds.keyId || !creds.clientId) return 'Team ID / Key ID / Services ID 未填全';

  const normalized = normalizePrivateKey(source);
  if ('error' in normalized) return normalized.error;

  try {
    await appleClientSecret(normalized.key);
    return null;
  } catch (err) {
    return `私钥签名失败：${err instanceof Error ? err.message : String(err)}`;
  }
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

export async function exchangeCode(key: ProviderKey, code: string, base: string): Promise<OAuthProfile | null> {
  const creds = credentials(key);
  const uri = redirectUri(base, key);

  if (key === 'google') {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: creds.clientId!,
        client_secret: creds.clientSecret!,
        redirect_uri: uri,
        grant_type: 'authorization_code',
      }),
    });
    if (!res.ok) {
      console.error('[oauth] google token failed', res.status, (await res.text()).slice(0, 300));
      return null;
    }
    const data = (await res.json()) as { access_token?: string };
    if (!data.access_token) return null;
    const infoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    if (!infoRes.ok) {
      console.error('[oauth] google userinfo failed', infoRes.status);
      return null;
    }
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
      client_id: creds.clientId!,
      client_secret: clientSecret,
      redirect_uri: uri,
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) {
    console.error('[oauth] apple token failed', res.status, (await res.text()).slice(0, 300));
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

export async function createState(
  provider: ProviderKey,
  redirectTo: string | null
): Promise<{ state: string; nonce: string }> {
  const { run, now } = await import('@/lib/db/loader');
  const state = crypto.randomBytes(24).toString('base64url');
  const nonce = crypto.randomBytes(24).toString('base64url');
  run(
    'INSERT INTO oauth_states (state, provider, redirect_to, nonce, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
    [state, provider, redirectTo, nonce, now(), now() + 10 * 60 * 1000]
  );
  return { state, nonce };
}

export async function consumeState(
  state: string,
  provider: ProviderKey
): Promise<{ ok: boolean; redirectTo: string | null; nonce: string | null }> {
  const { get, run, now } = await import('@/lib/db/loader');
  const row = get<{ provider: string; redirect_to: string | null; nonce: string | null; expires_at: number }>(
    'SELECT provider, redirect_to, nonce, expires_at FROM oauth_states WHERE state = ?',
    [state]
  );
  if (!row) return { ok: false, redirectTo: null, nonce: null };
  run('DELETE FROM oauth_states WHERE state = ?', [state]);
  if (row.provider !== provider || row.expires_at < now())
    return { ok: false, redirectTo: null, nonce: null };
  return { ok: true, redirectTo: row.redirect_to, nonce: row.nonce };
}

const GOOGLE_JWK_SET = createLocalJWKSet(GOOGLE_JWKS);

/**
 * 验证 Google 返回的 id_token（由前端中继带过来），用本地可信 JWKS 验签。
 * 不再由服务器访问 Google，规避国内服务器被墙导致的 token 交换超时 500。
 * 校验：签发者、受众（本站 client_id）、过期时间、以及防重放 nonce。
 */
export async function verifyGoogleIdToken(
  idToken: string,
  expectedNonce: string | null
): Promise<OAuthProfile | null> {
  try {
    const { payload } = await jwtVerify(idToken, GOOGLE_JWK_SET, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: credentials('google').clientId ?? undefined,
    });
    if (!payload.sub) return null;
    if (expectedNonce && payload.nonce !== expectedNonce) return null;
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return {
      providerUid: String(payload.sub),
      email: typeof payload.email === 'string' ? payload.email : null,
      name: typeof payload.name === 'string' ? payload.name : null,
      avatarUrl: typeof payload.picture === 'string' ? payload.picture : null,
      emailVerified: payload.email_verified === true || payload.email_verified === 'true',
    };
  } catch (err) {
    console.error('[oauth] google id_token verify failed:', err instanceof Error ? err.message : err);
    return null;
  }
}
