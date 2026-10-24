/**
 * 邮件发送通道 —— 腾讯云 SES（零依赖，fetch + TC3-HMAC-SHA256 签名）
 *
 * 未配置 TENCENT_SES_SECRET_ID / TENCENT_SES_SECRET_KEY 时，
 * 后台推广邮件只记录收件人为 pending，不谎报已发送。
 */

import crypto from 'node:crypto';

function sha256hex(data: string): string {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}

function hmac(key: crypto.KeyObject | string, data: string): string {
  return crypto.createHmac('sha256', key).update(data, 'utf8').digest('hex');
}

function tc3Sign(
  secretId: string,
  secretKey: string,
  service: string,
  host: string,
  action: string,
  version: string,
  region: string,
  payload: string
): Record<string, string> {
  const algorithm = 'TC3-HMAC-SHA256';
  const timestamp = Math.floor(Date.now() / 1000);
  const date = new Date(timestamp * 1000).toISOString().slice(0, 10);

  const canonicalRequest = `POST\n/\n\ncontent-type:application/json\nhost:${host}\n\ncontent-type;host\n${sha256hex(payload)}`;
  const credentialScope = `${date}/${service}/tc3_request`;
  const stringToSign = `${algorithm}\n${timestamp}\n${credentialScope}\n${sha256hex(canonicalRequest)}`;

  const kDate = crypto.createHmac('sha256', `TC3${secretKey}`).update(date).digest();
  const kService = crypto.createHmac('sha256', kDate).update(service).digest();
  const kSigning = crypto.createHmac('sha256', kService).update('tc3_request').digest();
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  return {
    Authorization: `${algorithm} Credential=${secretId}/${credentialScope}, SignedHeaders=content-type;host, Signature=${signature}`,
    'Content-Type': 'application/json',
    Host: host,
    'X-TC-Action': action,
    'X-TC-Version': version,
    'X-TC-Timestamp': String(timestamp),
    'X-TC-Region': region,
  };
}

export function isMailConfigured(): boolean {
  return Boolean(process.env.TENCENT_SES_SECRET_ID && process.env.TENCENT_SES_SECRET_KEY);
}

export async function sendCampaignEmail(to: string, subject: string, html: string): Promise<void> {
  const secretId = process.env.TENCENT_SES_SECRET_ID;
  const secretKey = process.env.TENCENT_SES_SECRET_KEY;
  if (!secretId || !secretKey) throw new Error('邮件通道未配置');

  const region = process.env.TENCENT_SES_REGION || 'ap-guangzhou';
  const host = 'ses.tencentcloudapi.com';
  const from = process.env.TENCENT_SES_FROM || 'hello@zhenhesheng.com';

  const payload = JSON.stringify({
    FromEmailAddress: from,
    Destination: [to],
    Subject: subject,
    Html: html,
  });

  const headers = tc3Sign(secretId, secretKey, 'ses', host, 'SendEmail', '2022-01-05', region, payload);
  const res = await fetch(`https://${host}/`, { method: 'POST', headers, body: payload });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`SES ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = (await res.json().catch(() => null)) as { Response?: { Error?: { Message?: string } } } | null;
  if (data?.Response?.Error) throw new Error(data.Response.Error.Message || 'SES error');
}
