/**
 * 前台会员认证 —— HMAC-SHA256 自签 Token + bcrypt 密码
 *
 * 与后台 staff 体系完全隔离：
 * - Cookie 名不同（zhs_user_token vs zhs_admin_token）
 * - 密钥不同（USER_JWT_SECRET 优先，缺省由 ADMIN_JWT_SECRET 派生，绝不共用同一密钥）
 * - Token 里带 sid（服务端会话行），支持单端/全端登出吊销
 *
 * 设计取舍：会话表 + 短 Token 不是必要的，但它让「退出登录」「踢设备」
 * 「改密后全端下线」变得可验证，代价只是一次内存 SQLite 查询。
 */

import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { all, get, run, now, uid, initDb } from '@/lib/db/loader';
import type { UserRow } from './dao';

export const USER_COOKIE = 'zhs_user_token';
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 天

let cachedSecret: string | null = null;

function secret(): string {
  if (cachedSecret) return cachedSecret;
  const explicit = process.env.USER_JWT_SECRET;
  if (explicit) {
    cachedSecret = explicit;
    return cachedSecret;
  }
  // 派生而非共用：即使两者都缺省，也不会与 admin token 互通
  const base = process.env.ADMIN_JWT_SECRET || 'zhs-admin-dev-secret-change-me';
  cachedSecret = crypto.createHash('sha256').update(`user-session::${base}`).digest('hex');
  return cachedSecret;
}

/* ── 密码 ── */

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}

export function verifyPassword(plain: string, hash: string | null): boolean {
  if (!hash) return false;
  try {
    return bcrypt.compareSync(plain, hash);
  } catch {
    return false;
  }
}

/* ── Token ── */

type Claims = { uid: string; sid: string; iat: number; exp: number };

function b64url(buf: Buffer): string {
  return buf.toString('base64url');
}

export function signSession(userId: string, sessionId: string): string {
  const header = b64url(Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const iat = Math.floor(Date.now() / 1000);
  const payload = b64url(
    Buffer.from(JSON.stringify({ uid: userId, sid: sessionId, iat, exp: iat + SESSION_TTL_MS / 1000 }))
  );
  const sig = crypto.createHmac('sha256', secret()).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}

export function verifySessionToken(token: string): Claims | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, sig] = parts;
  const expect = crypto.createHmac('sha256', secret()).update(`${header}.${payload}`).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expect);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Claims;
    if (!data.uid || !data.sid) return null;
    if (!data.exp || data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

/* ── 服务端会话 ── */

export type UserSession = {
  userId: string;
  sessionId: string;
};

export function createSession(userId: string, meta: { userAgent?: string | null; ip?: string | null } = {}): string {
  const sid = uid('uss');
  const t = now();
  run(
    `INSERT INTO user_sessions (id, user_id, user_agent, ip, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [sid, userId, meta.userAgent?.slice(0, 300) ?? null, meta.ip ?? null, t, t + SESSION_TTL_MS]
  );
  return signSession(userId, sid);
}

export function resolveSession(token: string | undefined): UserSession | null {
  if (!token) return null;
  const claims = verifySessionToken(token);
  if (!claims) return null;
  const row = get<{ id: string; user_id: string; expires_at: number; revoked_at: number | null }>(
    'SELECT id, user_id, expires_at, revoked_at FROM user_sessions WHERE id = ?',
    [claims.sid]
  );
  if (!row || row.revoked_at) return null;
  if (row.expires_at < now()) return null;
  return { userId: row.user_id, sessionId: row.id };
}

export function revokeSession(sessionId: string): void {
  run('UPDATE user_sessions SET revoked_at = ? WHERE id = ?', [now(), sessionId]);
}

export function revokeAllSessions(userId: string): void {
  run('UPDATE user_sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL', [now(), userId]);
}

/* ── 请求上下文 ── */

export async function currentSession(): Promise<UserSession | null> {
  const store = await cookies();
  const token = store.get(USER_COOKIE)?.value;
  return resolveSession(token);
}

/** 当前登录会员（未登录返回 null） */
export async function currentUser(): Promise<UserRow | null> {
  const session = await currentSession();
  if (!session) return null;
  await initDb(); // 幂等，避免调用方忘记初始化
  const user = get<UserRow>('SELECT * FROM users WHERE id = ?', [session.userId]);
  if (!user || user.status !== 'active') return null;
  return user;
}

export const USER_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: Math.floor(SESSION_TTL_MS / 1000),
};

/* ── 登录节流（内存，单实例 pm2 足够）── */

const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit = 12, windowMs = 10 * 60 * 1000): boolean {
  const t = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < t) {
    buckets.set(key, { count: 1, resetAt: t + windowMs });
    return true;
  }
  b.count += 1;
  if (b.count > limit) return false;
  return true;
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

/* ── 校验 ── */

export function normalizeEmail(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const email = input.trim().toLowerCase();
  if (email.length < 5 || email.length > 254) return null;
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) return null;
  return email;
}

export function passwordProblem(input: unknown): string | null {
  if (typeof input !== 'string' || input.length < 8) return '密码至少 8 位';
  if (input.length > 128) return '密码过长';
  if (!/[a-zA-Z]/.test(input) || !/[0-9]/.test(input)) return '密码需同时包含字母与数字';
  return null;
}

/** 清理过期会话与令牌（登录时顺手做，无需定时任务） */
export function sweepExpired(): void {
  const t = now();
  try {
    run('DELETE FROM user_sessions WHERE expires_at < ?', [t]);
    run('DELETE FROM user_tokens WHERE expires_at < ?', [t]);
    run('DELETE FROM oauth_states WHERE expires_at < ?', [t]);
  } catch {
    /* 清理失败不影响主流程 */
  }
}

export function activeSessionCount(userId: string): number {
  const row = get<{ n: number }>(
    'SELECT COUNT(*) AS n FROM user_sessions WHERE user_id = ? AND revoked_at IS NULL AND expires_at > ?',
    [userId, now()]
  );
  return row?.n ?? 0;
}

export function listSessions(userId: string) {
  return all<{ id: string; user_agent: string | null; created_at: number; expires_at: number }>(
    `SELECT id, user_agent, created_at, expires_at FROM user_sessions
     WHERE user_id = ? AND revoked_at IS NULL AND expires_at > ?
     ORDER BY created_at DESC`,
    [userId, now()]
  );
}
