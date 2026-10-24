/**
 * Resend 发送通道（REST，零 SDK 依赖）
 *
 * 文档：POST https://api.resend.com/emails
 * 免费档 3,000 封/月、100 封/天；限速 2 req/s —— 群发必须节流。
 *
 * 刻意不做「失败静默」：任何非 2xx 都抛出带响应体摘要的错误，
 * 由调用方决定记录为 failed 还是回滚，绝不谎报已发送。
 */

import { mailConfig } from './config';

export type SendInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  headers?: Record<string, string>;
};

export type SendResult = { id: string };

// 端点可覆盖：仅用于本地联调（打本地 mock）与将来可能的数据驻留区端点。
// 只读环境变量，不接受后台配置，避免被改成任意地址。
const ENDPOINT = process.env.RESEND_ENDPOINT?.trim() || 'https://api.resend.com/emails';

export async function sendViaResend(input: SendInput): Promise<SendResult> {
  const cfg = mailConfig();
  if (!cfg.resendKey) throw new Error('Resend 未配置（缺少 API Key）');

  const payload: Record<string, unknown> = {
    from: input.from || cfg.fromTransactional,
    to: [input.to],
    subject: input.subject,
    html: input.html,
    reply_to: input.replyTo || cfg.replyTo || undefined,
  };
  if (input.text) payload.text = input.text;
  if (input.headers && Object.keys(input.headers).length) payload.headers = input.headers;

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const raw = await res.text().catch(() => '');
  if (!res.ok) {
    throw new Error(`Resend ${res.status}: ${raw.slice(0, 300)}`);
  }
  let id = '';
  try {
    id = (JSON.parse(raw) as { id?: string }).id ?? '';
  } catch {
    id = '';
  }
  return { id };
}

/** 串行发送节流（Resend 免费档 2 req/s，留足余量） */
export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
