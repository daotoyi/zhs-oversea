/**
 * API 路由守卫 —— 校验 session + 模块权限
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, verifyToken, hasPermission } from './auth';
import type { StaffSession } from './auth';
import type { ModuleKey } from '../db/schema';

export async function requireStaff(mod?: ModuleKey): Promise<
  { ok: true; staff: StaffSession } | { ok: false; res: NextResponse }
> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  const session = token ? verifyToken(token) : null;
  if (!session) {
    return { ok: false, res: NextResponse.json({ error: '未登录' }, { status: 401 }) };
  }
  if (mod && !hasPermission(session, mod)) {
    return { ok: false, res: NextResponse.json({ error: '无权限' }, { status: 403 }) };
  }
  return { ok: true, staff: session };
}

/** JSON 响应帮助 */
export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function bad(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}
