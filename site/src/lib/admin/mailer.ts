/**
 * 邮件通道（兼容层）
 *
 * v0.0.10 起发信改由 lib/mail/* 承担：
 *   - 交易邮件走 zhenhesheng.com（Resend）
 *   - 营销邮件走 news.zhenhesheng.com（Resend），带退订链接与物理地址
 *
 * 本文件保留原有导出名，避免调用点大改；新代码请直接用 lib/mail/send。
 * 腾讯云 SES 的旧实现已移除：跨境 + 共享 IP 的送达率撑不起「密码重置」这类
 * 必须进收件箱的邮件，且原实现无法带 List-Unsubscribe 头。
 */

import { mailConfig, transactionalReady, missingMailConfig } from '@/lib/mail/config';
import { sendTransactional, sendMarketing } from '@/lib/mail/send';

/** 交易邮件是否可发（密码重置依赖它） */
export function isMailConfigured(): boolean {
  return transactionalReady();
}

/** 营销邮件是否可发（与交易邮件共用 Resend Key，但要求单独的 From） */
export function isMarketingConfigured(): boolean {
  const c = mailConfig();
  return Boolean(c.resendKey && c.fromMarketing && c.physicalAddress);
}

export function mailStatus() {
  const c = mailConfig();
  return {
    ready: Boolean(c.resendKey),
    marketingReady: isMarketingConfigured(),
    fromTransactional: c.fromTransactional,
    fromMarketing: c.fromMarketing,
    replyTo: c.replyTo,
    physicalAddress: c.physicalAddress,
    missing: missingMailConfig(),
  };
}

/** 交易邮件（密码重置、账号通知） */
export async function sendTransactionalEmail(to: string, subject: string, html: string): Promise<void> {
  const r = await sendTransactional({ to, subject, html });
  if (!r.ok) throw new Error(r.error);
}

/**
 * 营销邮件（后台「邮件推广」群发）
 *
 * 注意：会自动查询退订名单并在函数内跳过——调用方仍需按返回值区分
 * 「已退订跳过」与「真失败」，不要都记成 failed。
 */
export async function sendCampaignEmail(to: string, subject: string, html: string): Promise<void> {
  const r = await sendMarketing({ to, subject, html });
  if (!r.ok) {
    const err = new Error(r.error) as Error & { skipped?: string };
    if (r.skipped) err.skipped = r.skipped;
    throw err;
  }
}
