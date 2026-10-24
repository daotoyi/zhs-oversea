/**
 * 邮件配置解析
 *
 * 三层分离（不要混用，混用会互相拖累送达率）：
 *   1. 营销邮件   news.zhenhesheng.com   —— 有退订、有物理地址，声誉独立
 *   2. 交易邮件   zhenhesheng.com        —— 密码重置等，必须进收件箱
 *   3. 收信       腾讯企业邮（MX）        —— 人工读信，与上面两条无关
 *
 * 取值优先级：数据库（后台「邮件配置」页）> 环境变量 > 默认值。
 * 后台可改意味着换服务商/改 From 不用重部署。
 */

import { resolve } from '@/lib/settings';

export type MailConfig = {
  /** Resend API Key */
  resendKey: string | null;
  /** 交易邮件 From，如 "Zhen He Sheng <orders@zhenhesheng.com>" */
  fromTransactional: string;
  /** 营销邮件 From，如 "Zhen He Sheng <news@news.zhenhesheng.com>" */
  fromMarketing: string;
  /** Reply-To，客户回信进人工邮箱 */
  replyTo: string;
  /** 营销邮件页脚必须含物理地址（CAN-SPAM 硬要求） */
  physicalAddress: string;
  companyName: string;
  /** 站点地址，用于拼退订链接 */
  siteUrl: string;
  /** 单封发送间隔（毫秒）：Resend 免费档 2 req/s */
  throttleMs: number;
};

function pm(envKey: string, fallback: string): string {
  const v = resolve(`mail_${envKey.toLowerCase()}`, envKey);
  return v && v.trim() ? v.trim() : fallback;
}

export function mailConfig(): MailConfig {
  return {
    resendKey: resolve('mail_resend_api_key', 'RESEND_API_KEY'),
    fromTransactional: pm('MAIL_FROM_TRANSACTIONAL', 'Zhen He Sheng <orders@zhenhesheng.com>'),
    fromMarketing: pm('MAIL_FROM_MARKETING', 'Zhen He Sheng <news@news.zhenhesheng.com>'),
    replyTo: pm('MAIL_REPLY_TO', 'hello@zhenhesheng.com'),
    physicalAddress: pm(
      'MAIL_PHYSICAL_ADDRESS',
      'Zhen He Sheng Limited · Hong Kong SAR, China'
    ),
    companyName: pm('MAIL_COMPANY_NAME', 'Zhen He Sheng'),
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://zhenhesheng.com',
    throttleMs: Number(process.env.MAIL_THROTTLE_MS ?? 0) || 600,
  };
}

/** 交易邮件能否发出（只看 Resend，因为它承载密码重置） */
export function transactionalReady(): boolean {
  return Boolean(mailConfig().resendKey);
}

/** 配置缺口，用于后台与日志给出可操作提示 */
export function missingMailConfig(): string[] {
  const c = mailConfig();
  const miss: string[] = [];
  if (!c.resendKey) miss.push('Resend API Key');
  if (!c.fromTransactional) miss.push('交易邮件 From');
  if (!c.fromMarketing) miss.push('营销邮件 From');
  if (!c.physicalAddress) miss.push('物理地址');
  return miss;
}
