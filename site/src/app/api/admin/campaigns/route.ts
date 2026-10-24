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

    updateCampaignStatus(id, 'sending');
    persistSoon();

    // 收件人：全部客户或按标签筛选
    const tags: string[] = JSON.parse(campaign.target_tags || '[]');
    const recipients = listCustomers().filter((c) => {
      if (!tags.length) return true;
      try {
        const own: string[] = JSON.parse(c.tags || '[]');
        return tags.some((t) => own.includes(t));
      } catch {
        return false;
      }
    });

    // 邮件发送通道：未配置 SES 密钥时记录为 pending（不谎报已发送）
    const { isMailConfigured } = await import('@/lib/admin/mailer');
    const mailConfigured = isMailConfigured();
    let sent = 0;
    for (const r of recipients) {
      if (mailConfigured) {
        try {
          const { sendCampaignEmail } = await import('@/lib/admin/mailer');
          await sendCampaignEmail(r.email, campaign.subject, campaign.body);
          logEmail(id, r.email, 'sent');
          sent += 1;
        } catch (err) {
          logEmail(id, r.email, 'failed', err instanceof Error ? err.message : 'unknown');
        }
      } else {
        logEmail(id, r.email, 'pending', '邮件通道未配置');
      }
    }
    updateCampaignStatus(id, mailConfigured ? 'sent' : 'draft', sent, now());
    persistSoon();
    audit(auth.staff, 'campaign.send', id, `recipients=${recipients.length} sent=${sent}`);
    return json({
      ok: true,
      recipients: recipients.length,
      sent,
      delivered: mailConfigured,
      message: mailConfigured ? '已发送' : '邮件通道未配置，收件人已记录为待发送',
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
