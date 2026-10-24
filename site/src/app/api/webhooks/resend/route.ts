import { NextResponse } from 'next/server';
import { initDb } from '@/lib/db/loader';
import { getSetting } from '@/lib/settings';
import { suppress } from '@/lib/mail/suppression';
import crypto from 'node:crypto';

export const runtime = 'nodejs';

/**
 * Resend Webhook —— 送达率健康度的唯一真相来源
 *
 * 为什么必须有这个端点：
 * 群发时把信反复投给「已经不存在的邮箱」（硬退信）或「点了举报的用户」（投诉），
 * 是域名声誉最快崩掉的方式。Gmail 会按投诉率与退信率直接判定发件方为垃圾源，
 * 届时连密码重置都发不进收件箱。所以退信/投诉必须**自动**进拒收名单，
 * 不能靠人去后台看。
 *
 * 签名：Resend 用 Svix 格式（svix-id / svix-timestamp / svix-signature）。
 * 未配置 secret 时一律拒绝——宁可不收，也不能接受无法验真的请求
 * （否则任何人构造一个 bounced 事件就能把任意邮箱加进黑名单）。
 */

type ResendEvent = {
  type?: string;
  created_at?: string;
  data?: {
    email_id?: string;
    to?: string[] | string;
    subject?: string;
    bounce?: { type?: string; subType?: string; message?: string } | string;
    bounce_type?: string;
    bounceType?: string;
  };
};

function recipients(data: ResendEvent['data']): string[] {
  const to = data?.to;
  if (Array.isArray(to)) return to.filter((x): x is string => typeof x === 'string');
  if (typeof to === 'string') return [to];
  return [];
}

/** 判断是否硬退信：只有永久的、不会自愈的地址才该永久压制 */
function isHardBounce(data: ResendEvent['data']): boolean {
  const raw = data?.bounce;
  const label =
    (typeof raw === 'string' ? raw : raw?.type || raw?.subType) ??
    data?.bounce_type ??
    data?.bounceType ??
    '';
  const s = String(label).toLowerCase();
  if (!s) return true; // 未标明类型时按硬退信处理（保守：宁可不再发）
  if (s.includes('soft') || s.includes('transient') || s.includes('temporary')) return false;
  return true;
}

/** Svix 签名校验（Resend webhook） */
function verifySvix(secret: string, headers: Headers, body: string): string | null {
  const id = headers.get('svix-id');
  const ts = headers.get('svix-timestamp');
  const sigHeader = headers.get('svix-signature');
  if (!id || !ts || !sigHeader) return '缺少 svix 签名头';

  // 防重放：5 分钟容差
  const age = Math.abs(Date.now() / 1000 - Number(ts));
  if (!Number.isFinite(age) || age > 300) return '时间戳超出容差';

  const keyB64 = secret.replace(/^whsec_/, '');
  let key: Buffer;
  try {
    key = Buffer.from(keyB64, 'base64');
  } catch {
    return 'webhook secret 格式不正确';
  }
  const expected = crypto.createHmac('sha256', key).update(`${id}.${ts}.${body}`).digest('base64');

  // 头里可能是「多个签名的空格分隔列表」，每个形如 v1,<sig>
  const candidates = sigHeader.split(' ').map((part) => (part.includes(',') ? part.split(',')[1] : part));
  const ok = candidates.some((sig) => {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
  return ok ? null : '签名不匹配';
}

export async function POST(request: Request) {
  await initDb();

  const secret = getSetting('mail_webhook_secret') ?? process.env.RESEND_WEBHOOK_SECRET?.trim() ?? null;
  if (!secret) {
    // 明确 503 而非 200：让 Resend 知道端点在、但没配好，方便排查
    return NextResponse.json({ error: 'Webhook secret 未配置' }, { status: 503 });
  }

  const body = await request.text();
  const invalid = verifySvix(secret, request.headers, body);
  if (invalid) {
    return NextResponse.json({ error: invalid }, { status: 401 });
  }

  let event: ResendEvent;
  try {
    event = JSON.parse(body) as ResendEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const type = event.type ?? '';
  const tos = recipients(event.data);
  let action = 'ignored';

  for (const addr of tos) {
    const email = addr.trim().toLowerCase();
    if (!email) continue;

    if (type === 'email.bounced') {
      if (isHardBounce(event.data)) {
        suppress(email, 'bounce', 'resend-webhook');
        action = 'suppressed_hard_bounce';
      } else {
        // 软退信通常是对方邮箱满/临时故障，不永久压制，只留痕
        action = 'soft_bounce_logged';
      }
    } else if (type === 'email.complained') {
      // 用户点了「举报垃圾邮件」——最严重信号，永久压制且需人工关注
      suppress(email, 'complaint', 'resend-webhook');
      action = 'suppressed_complaint';
    } else if (type === 'email.delivered') {
      // 送达成功：若此人此前因软退信被记录，这里不做改动（不擅自恢复名单）
      action = 'delivered';
    }
  }

  console.log(
    `[resend-webhook] ${type} to=${tos.join(',') || '(none)'} action=${action} id=${event.data?.email_id ?? '-'}`
  );

  // 始终 200：签名已验证，业务侧不该让 Resend 无限重试
  return NextResponse.json({ ok: true, type, action });
}
