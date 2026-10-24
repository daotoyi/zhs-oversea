import { requireStaff, json, bad } from '@/lib/admin/guard';
import { initDb, persistSoon, now } from '@/lib/db/loader';
import {
  listCampaigns, saveCampaign, deleteCampaign, updateCampaignStatus, logEmail, listCustomers,
} from '@/lib/admin/dao';
import { audit } from '@/lib/admin/dao';

export async function GET() {
  const auth = await requireStaff('campaigns');
  if (!auth.ok) return auth.res;
  await initDb();
  return json({ campaigns: listCampaigns() });
}

export async function POST(req: Request) {
  const auth = await requireStaff('campaigns');
  if (!auth.ok) return auth.res;
  await initDb();
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad('请求格式错误');
  }

  if (body.action === 'delete') {
    deleteCampaign(String(body.id ?? ''));
    persistSoon();
    audit(auth.staff, 'campaign.delete', String(body.id ?? ''));
    return json({ ok: true });
  }

  if (body.action === 'send') {
    const id = String(body.id ?? '');
    const campaigns = listCampaigns();
    const campaign = campaigns.find((c) => c.id === id);
    if (!campaign) return bad('活动不存在');
    if (campaign.status === 'sending') return bad('该活动正在发送中');

    const { mailStatus } = await import('@/lib/admin/mailer');
    const { sendMarketing } = await import('@/lib/mail/send');
    const { sleep } = await import('@/lib/mail/resend');
    const { isSuppressed } = await import('@/lib/mail/suppression');
    const { mailConfig } = await import('@/lib/mail/config');
    const cfg = mailConfig();

    const status = mailStatus();
    if (!status.marketingReady) {
      return bad(
        `营销邮件通道未就绪，缺少：${[
          !cfg.resendKey && 'Resend API Key',
          !cfg.fromMarketing && '营销 From',
          !cfg.physicalAddress && '物理地址',
        ]
          .filter(Boolean)
          .join('、')}（后台「登录配置 → 邮件」）`
      );
    }

    updateCampaignStatus(id, 'sending');
    persistSoon();

    // 收件人：全部客户或按标签筛选
    const tags: string[] = JSON.parse(campaign.target_tags || '[]');
    const all = listCustomers().filter((c) => {
      if (!tags.length) return true;
      try {
        const own: string[] = JSON.parse(c.tags || '[]');
        return tags.some((t) => own.includes(t));
      } catch {
        return false;
      }
    });

    // 合规过滤：已退订 / 在账户里关掉营销订阅的人，一律不发
    const { all: dbAll } = await import('@/lib/db/loader');
    const optedOut = new Set(
      dbAll<{ email: string }>(
        "SELECT lower(email) AS email FROM users WHERE marketing_opt_in = 0"
      ).map((r) => r.email)
    );
    const recipients = all.filter((c) => {
      const e = c.email.trim().toLowerCase();
      return !isSuppressed(e) && !optedOut.has(e);
    });
    const skipped = all.length - recipients.length;

    let sent = 0;
    let failed = 0;
    for (let i = 0; i < recipients.length; i += 1) {
      const r = recipients[i];
      const out = await sendMarketing({ to: r.email, subject: campaign.subject, html: campaign.body });
      if (out.ok) {
        logEmail(id, r.email, 'sent');
        sent += 1;
      } else {
        logEmail(id, r.email, 'failed', out.error);
        failed += 1;
      }
      // Resend 免费档 2 req/s，最后一封不必等
      if (i < recipients.length - 1) await sleep(cfg.throttleMs);
    }

    updateCampaignStatus(id, 'sent', sent, now());
    persistSoon();
    audit(
      auth.staff,
      'campaign.send',
      id,
      `candidates=${all.length} skipped=${skipped} sent=${sent} failed=${failed}`
    );
    return json({
      ok: true,
      candidates: all.length,
      recipients: recipients.length,
      sent,
      failed,
      skipped,
      delivered: true,
      message: `已发送 ${sent} 封${skipped ? `，跳过已退订/关闭订阅 ${skipped} 人` : ''}${failed ? `，失败 ${failed} 封` : ''}`,
    });
  }

  const name = String(body.name ?? '').trim();
  const subject = String(body.subject ?? '').trim();
  const bodyHtml = String(body.body ?? '').trim();
  if (!name || !subject || !bodyHtml) return bad('名称、主题、正文必填');
  const campaign = saveCampaign({
    id: body.id ? String(body.id) : undefined,
    name,
    subject,
    body: bodyHtml,
    target_tags: Array.isArray(body.target_tags) ? body.target_tags.map(String) : [],
    created_by: auth.staff.username,
  });
  persistSoon();
  audit(auth.staff, body.id ? 'campaign.update' : 'campaign.create', campaign.id, `name=${name}`);
  return json({ campaign });
}
