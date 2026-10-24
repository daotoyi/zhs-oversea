/**
 * 邮件发送统一入口
 *
 * 两条路径，各自合规：
 *   sendTransactional —— 密码重置等，**不查退订名单**（用户要找回账户，不能因为退过营销就收不到）。
 *                        但不发营销内容，故不需要退订链接。
 *   sendMarketing     —— 强制页脚（物理地址 + 退订链接）与 List-Unsubscribe 头，
 *                        且发前查拒收名单，已退订直接跳过。
 *
 * 邮件客户端里的「退订」按钮靠 List-Unsubscribe / List-Unsubscribe-Post 两个头，
 * 缺了它 Gmail 会判定为「未提供一键退订」而降权（2024 年起批量发信强制要求）。
 */

import { mailConfig } from './config';
import { sendViaResend } from './resend';
import { isSuppressed, oneClickUnsubscribeUrl, unsubscribeUrl } from './suppression';

export type MailKind = 'transactional' | 'marketing';

export type OutgoingMail = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  /** 仅营销邮件用：显示在页脚的收件人（用于「为什么收到这封邮件」说明） */
  kind?: MailKind;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 营销邮件页脚：物理地址 + 退订链接（CAN-SPAM 三个必备要素里的两个，第三个是主题不误导） */
export function marketingFooter(email: string): string {
  const cfg = mailConfig();
  const unsub = unsubscribeUrl(email);
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;border-top:1px solid #e3ddd0">
  <tr>
    <td style="padding:18px 0;font-family:Georgia,serif;font-size:12px;line-height:1.7;color:#6b645b">
      <p style="margin:0 0 8px">You are receiving this because you bought from, or subscribed at, ${escapeHtml(cfg.companyName)}.</p>
      <p style="margin:0 0 8px">
        <a href="${unsub}" style="color:#9e3b2e">Unsubscribe / 退订</a>
        &nbsp;·&nbsp;
        <a href="${cfg.siteUrl}/account" style="color:#9e3b2e">Manage preferences / 管理订阅</a>
      </p>
      <p style="margin:0;color:#8d857b">
        ${escapeHtml(cfg.companyName)}<br>
        ${escapeHtml(cfg.physicalAddress)}
      </p>
    </td>
  </tr>
</table>`;
}

/** 粗判断：内容是否已是完整 HTML 文档（有 <html> 或 <body> 就不套外壳） */
function looksLikeDocument(html: string): boolean {
  return /<(html|body)[\s>]/i.test(html);
}

/** 给纯文本/片段套一个中性外壳，避免正文是裸文字时排版塌掉 */
function wrapBody(body: string): string {
  if (looksLikeDocument(body)) return body;
  if (/<(p|div|table|h1|h2|ul|ol|br)[\s>/]/i.test(body)) {
    return `<div style="font-family:Georgia,serif;font-size:15px;line-height:1.75;color:#1a1714">${body}</div>`;
  }
  const paras = body
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
  return `<div style="font-family:Georgia,serif;font-size:15px;line-height:1.75;color:#1a1714">${paras}</div>`;
}

function plainTextOf(body: string): string {
  return body
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export type SendOutcome =
  | { ok: true; id: string }
  | { ok: false; error: string; skipped?: 'suppressed' | 'not_configured' };

export async function sendMail(mail: OutgoingMail): Promise<SendOutcome> {
  const cfg = mailConfig();
  const kind: MailKind = mail.kind ?? 'transactional';

  if (!cfg.resendKey) {
    return { ok: false, error: 'Resend 未配置（后台「邮件配置」页填 API Key）', skipped: 'not_configured' };
  }

  if (kind === 'marketing' && isSuppressed(mail.to)) {
    return { ok: false, error: '该收件人已退订', skipped: 'suppressed' };
  }

  const html = `${wrapBody(mail.html)}${
    kind === 'marketing' ? marketingFooter(mail.to) : ''
  }`;

  const headers: Record<string, string> = {};
  if (kind === 'marketing') {
    const oneClick = oneClickUnsubscribeUrl(mail.to);
    headers['List-Unsubscribe'] = `<${oneClick}>, <${unsubscribeUrl(mail.to)}>`;
    headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
  }

  try {
    const r = await sendViaResend({
      to: mail.to,
      subject: mail.subject,
      html,
      text: mail.text ?? plainTextOf(mail.html),
      from: kind === 'marketing' ? cfg.fromMarketing : cfg.fromTransactional,
      replyTo: cfg.replyTo,
      headers,
    });
    return { ok: true, id: r.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** 交易邮件：不查退订名单、不加营销页脚 */
export function sendTransactional(mail: Omit<OutgoingMail, 'kind'>): Promise<SendOutcome> {
  return sendMail({ ...mail, kind: 'transactional' });
}

/** 营销邮件：查退订名单、强制合规页脚与一键退订头 */
export function sendMarketing(mail: Omit<OutgoingMail, 'kind'>): Promise<SendOutcome> {
  return sendMail({ ...mail, kind: 'marketing' });
}
