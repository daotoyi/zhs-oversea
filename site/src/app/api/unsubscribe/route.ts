import { NextRequest, NextResponse } from 'next/server';
import { initDb } from '@/lib/db/loader';
import { emailForToken, suppress } from '@/lib/mail/suppression';

export const runtime = 'nodejs';

/**
 * 一键退订端点（RFC 8058）
 *
 * 支持两种用法：
 *   POST /api/unsubscribe?t=<token>           —— 邮箱客户端「退订」按钮直接调用
 *   POST /api/unsubscribe  {"token": "..."}   —— 落地页确认按钮
 *   GET                                    —— 落地页表单以 GET 提前探活时也接受（返回说明，不改数据）
 *
 * 用 POST 而非 GET 做「真正退订」，是为了避免邮件安全扫描器预先抓取链接
 * 就把用户悄悄退订掉——这类误退订在群发场景很常见。
 */
export async function POST(req: NextRequest) {
  await initDb();
  const token = new URL(req.url).searchParams.get('t') ?? '';
  let tokenFromBody = '';
  if (!token) {
    try {
      const body = (await req.json()) as { token?: string };
      tokenFromBody = body?.token ?? '';
    } catch {
      tokenFromBody = '';
    }
  }
  const finalToken = token || tokenFromBody;
  const email = emailForToken(finalToken);
  if (!email) {
    return NextResponse.json({ ok: false, error: '链接无效或已过期' }, { status: 400 });
  }
  suppress(email, 'unsubscribe', 'one-click');
  return NextResponse.json({ ok: true, email });
}

export async function GET(req: NextRequest) {
  await initDb();
  const token = new URL(req.url).searchParams.get('t') ?? '';
  const email = emailForToken(token);
  if (!email) {
    return NextResponse.json({ ok: false, error: '链接无效或已过期' }, { status: 400 });
  }
  // 只回应状态，不改数据（防扫描器预取误退订）
  return NextResponse.json({ ok: true, action: 'POST to confirm' });
}
