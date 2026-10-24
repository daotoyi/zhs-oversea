import { NextRequest } from 'next/server';
import { initDb } from '@/lib/db/loader';
import { bad, json, readJson } from '@/lib/account/api';
import { clientIp, normalizeEmail, rateLimit } from '@/lib/account/auth';
import { createToken, findUserByEmail } from '@/lib/account/dao';
import { isMailConfigured, sendCampaignEmail } from '@/lib/admin/mailer';
import { publicBaseUrl } from '@/lib/admin/http';

export const runtime = 'nodejs';

const TTL_MS = 60 * 60 * 1000; // 1 小时

/**
 * 忘记密码 —— 无论邮箱是否存在都返回同样结果，避免账户枚举。
 * 邮件通道未配置时明确报错（宁可说"没发出去"，也不谎报已发送）。
 */
export async function POST(req: NextRequest) {
  await initDb();
  const body = await readJson(req);
  const email = normalizeEmail(body.email);
  if (!email) return bad('请输入有效邮箱');
  if (!rateLimit(`forgot:${clientIp(req)}`, 5) || !rateLimit(`forgot:${email}`, 3)) {
    return bad('请求过于频繁，请稍后再试', 429);
  }
  if (!isMailConfigured()) {
    return bad('邮件通道尚未配置，暂时无法自助重置。请写信至 hello@zhenhesheng.com，我们会手动为你处理。', 503);
  }

  const user = findUserByEmail(email);
  if (user && user.status === 'active') {
    const token = createToken(user.id, 'reset', TTL_MS);
    const link = `${publicBaseUrl(req)}/account/reset?token=${encodeURIComponent(token)}`;
    const html = `
      <div style="font-family:Georgia,serif;color:#1a1714;line-height:1.7">
        <p>Set a new password for your Zhen He Sheng account:</p>
        <p><a href="${link}" style="color:#9e3b2e">${link}</a></p>
        <p style="color:#6b645b;font-size:13px">This link expires in one hour. If you did not request it, ignore this email.</p>
        <hr style="border:0;border-top:1px solid #e3ddd0;margin:24px 0">
        <p>重设真和盛账户密码，请点击上方链接，一小时内有效。若非本人操作请忽略本邮件。</p>
      </div>`;
    try {
      await sendCampaignEmail(email, 'Reset your Zhen He Sheng password / 重设密码', html);
    } catch (err) {
      console.error('[account] reset mail failed:', err instanceof Error ? err.message : err);
      return bad('邮件发送失败，请稍后重试或直接联系我们', 502);
    }
  }

  return json({ ok: true });
}
