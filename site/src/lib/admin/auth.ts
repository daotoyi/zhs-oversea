/**
 * 员工认证 —— HMAC-SHA256 自签 Token + bcrypt 密码
 *
 * 零外部依赖（node:crypto 同步 API），httpOnly Cookie 承载。
 */

import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { ModuleKey } from '../db/schema';

export const ADMIN_COOKIE = 'zhs_admin_token';
const TOKEN_TTL = 60 * 60 * 12; // 12 小时

function secret(): string {
  return process.env.ADMIN_JWT_SECRET || 'zhs-admin-dev-secret-change-me';
}

export type StaffSession = {
  id: string;
  username: string;
  name: string;
  role: string;
  permissions: ModuleKey[];
};

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}

export function verifyPassword(plain: string, hash: string): boolean {
  try {
    return bcrypt.compareSync(plain, hash);
  } catch {
    return false;
  }
}

function b64url(buf: Buffer): string {
  return buf.toString('base64url');
}

export function signToken(session: StaffSession): string {
  const header = b64url(Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const payload = b64url(
    Buffer.from(
      JSON.stringify({
        ...session,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + TOKEN_TTL,
      })
    )
  );
  const sig = crypto.createHmac('sha256', secret()).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}

export function verifyToken(token: string): StaffSession | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, sig] = parts;
  const expect = crypto.createHmac('sha256', secret()).update(`${header}.${payload}`).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expect);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data.exp || data.exp < Math.floor(Date.now() / 1000)) return null;
    return {
      id: data.id,
      username: data.username,
      name: data.name,
      role: data.role,
      permissions: Array.isArray(data.permissions) ? data.permissions : [],
    };
  } catch {
    return null;
  }
}

export function hasPermission(session: StaffSession | null, mod: ModuleKey): boolean {
  if (!session) return false;
  if (session.role === 'super') return true;
  return session.permissions.includes(mod);
}

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: TOKEN_TTL,
};
