/**
 * 账户 API 通用助手
 */

import { NextResponse } from 'next/server';
import { USER_COOKIE, USER_COOKIE_OPTIONS } from './auth';

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function bad(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const data = await req.json();
    return data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function setUserCookie(res: NextResponse, token: string): NextResponse {
  res.cookies.set(USER_COOKIE, token, USER_COOKIE_OPTIONS);
  return res;
}

export function clearUserCookie(res: NextResponse): NextResponse {
  res.cookies.set(USER_COOKIE, '', { ...USER_COOKIE_OPTIONS, maxAge: 0 });
  return res;
}

/** 只允许跳回站内 /account 系列路径，防开放重定向 */
export function safeNext(raw: unknown): string {
  if (typeof raw !== 'string') return '/account';
  const v = raw.trim();
  if (!v.startsWith('/') || v.startsWith('//')) return '/account';
  if (!/^\/account(\/|\?|$)/.test(v)) return '/account';
  return v;
}

export function isEmail(v: unknown): v is string {
  return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.trim());
}
