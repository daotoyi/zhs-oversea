import { NextRequest } from 'next/server';
import { initDb, persistSoon } from '@/lib/db/loader';
import { requireStaff, json, bad } from '@/lib/admin/guard';
import { audit } from '@/lib/admin/dao';
import { setSetting, deleteSetting } from '@/lib/settings';
import { mailConfig, missingMailConfig } from '@/lib/mail/config';
import { sendTransactional, sendMarketing } from '@/lib/mail/send';
import { listSuppressions, suppressionCount, unsuppress, suppress } from '@/lib/mail/suppression';

export const runtime = 'nodejs';

const KEYS: Record<string, string> = {
  resendKey: 'mail_resend_api_key',
  fromTransactional: 'mail_from_transactional',
  fromMarketing: 'mail_from_marketing',
  replyTo: 'mail_reply_to',
  physicalAddress: 'mail_physical_address',
  companyName: 'mail_company_name',
};

/** 保存邮件配置（留空 = 保持原值；显式 clear 才删除） */
export async function POST(req: NextRequest) {
  const guard = await requireStaff('settings');
  if (!guard.ok) return guard.res;
  await initDb();

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  if (body.action === 'unsuppress') {
    const email = String(body.email ?? '').trim();
    if (!email) return bad('缺少邮箱');
    unsuppress(email);
    persistSoon();
    audit(guard.staff, 'mail.unsuppress', email);
    return json({ ok: true });
  }

  if (body.action === 'suppress') {
    const email = String(body.email ?? '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) return bad('邮箱格式不正确');
    suppress(email, 'manual', guard.staff.username);
    persistSoon();
    audit(guard.staff, 'mail.suppress', email);
    return json({ ok: true });
  }

  if (body.clear === true) {
    for (const key of Object.values(KEYS)) deleteSetting(key);
    persistSoon();
    audit(guard.staff, 'mail.clear', 'mail');
    return json({ ok: true, cleared: true });
  }

  // 校验 From 必须是 "Name <addr@domain>" 或裸地址
  const addr = /<([^>]+)>/;
  for (const field of ['fromTransactional', 'fromMarketing'] as const) {
    const v = typeof body[field] === 'string' ? (body[field] as string).trim() : '';
    if (!v) continue;
    const m = addr.exec(v);
    const email = (m ? m[1] : v).trim();
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) return bad(`${field} 里的邮箱地址格式不正确`);
  }

  for (const [field, key] of Object.entries(KEYS)) {
    const v = body[field];
    if (typeof v === 'string' && v.trim()) setSetting(key, v.trim(), guard.staff.username);
  }
  persistSoon();
  audit(guard.staff, 'mail.save', 'mail', '更新邮件配置');

  const cfg = mailConfig();
  return json({
    ok: true,
    status: {
      fromTransactional: cfg.fromTransactional,
      fromMarketing: cfg.fromMarketing,
      replyTo: cfg.replyTo,
      physicalAddress: cfg.physicalAddress,
      missing: missingMailConfig(),
    },
  });
}

/** 发送测试邮件：验证 DNS 与通道是否真的通 */
export async function PUT(req: NextRequest) {
  const guard = await requireStaff('settings');
  if (!guard.ok) return guard.res;
  await initDb();

  const body = (await req.json().catch(() => ({}))) as { to?: string; kind?: string };
  const to = String(body.to ?? '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(to)) return bad('收件邮箱格式不正确');
  const kind = body.kind === 'marketing' ? 'marketing' : 'transactional';

  const subject =
    kind === 'marketing'
      ? 'Test — marketing letter (with unsubscribe footer)'
      : 'Test — transactional email';
  const html = `<p>This is a ${kind} test from your Zhen He Sheng admin panel.</p>
<p>If you can read this in your inbox rather than spam, the DNS records are working.</p>
<p>这是一封 ${kind === 'marketing' ? '营销' : '交易'}邮件测试。</p>`;

  const out =
    kind === 'marketing'
      ? await sendMarketing({ to, subject, html })
      : await sendTransactional({ to, subject, html });

  audit(guard.staff, 'mail.test', to, `${kind} ok=${out.ok}`);
  if (!out.ok) return bad(out.error, 502);
  return json({ ok: true, id: out.id, kind });
}

/** 退订名单（供后台展示） */
export async function GET() {
  const guard = await requireStaff('settings');
  if (!guard.ok) return guard.res;
  await initDb();
  return json({ total: suppressionCount(), suppressions: listSuppressions(200) });
}
