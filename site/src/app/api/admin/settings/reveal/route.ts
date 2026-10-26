import { initDb } from '@/lib/db/loader';
import { requireStaff, json, bad } from '@/lib/admin/guard';
import { audit } from '@/lib/admin/dao';
import { resolve, getSetting } from '@/lib/settings';

export const runtime = 'nodejs';

/**
 * 按需取回密钥明文（后台「小眼睛」用）
 *
 * 为什么单独开一个接口而不是随页面一起下发：
 * 页面 HTML 里带明文密钥 = 任何快照、代理缓存、浏览器源码都能看到。
 * 这里改成「点了眼睛才取一次」，且全程走 requireStaff('settings')，
 * 每次取用都写审计日志，事后能查到谁在什么时候看过。
 *
 * 只允许白名单字段，绝不接受任意 settings key（防止顺手套走别的配置）。
 */

const ALLOWED: Record<string, { key: string; env?: string; label: string }> = {
  google_client_secret: { key: 'oauth_google_client_secret', env: 'GOOGLE_CLIENT_SECRET', label: 'Google Client Secret' },
  apple_private_key: { key: 'oauth_apple_private_key', env: 'APPLE_PRIVATE_KEY', label: 'Apple Private Key' },
  paypal_client_secret: { key: 'paypal_client_secret', env: 'PAYPAL_CLIENT_SECRET', label: 'PayPal Client Secret' },
  resend_api_key: { key: 'mail_resend_api_key', env: 'RESEND_API_KEY', label: 'Resend API Key' },
  resend_webhook_secret: { key: 'mail_webhook_secret', env: 'RESEND_WEBHOOK_SECRET', label: 'Resend Webhook 密钥' },
};

export async function POST(req: Request) {
  const guard = await requireStaff('settings');
  if (!guard.ok) return guard.res;

  await initDb();

  const body = (await req.json().catch(() => ({}))) as { field?: string };
  const field = String(body.field ?? '');
  const hit = ALLOWED[field];
  if (!hit) return bad('字段不允许读取');

  // 与运行时取值同源：数据库优先，其次环境变量（线上可能只配了 env）
  const value = resolve(hit.key, hit.env ?? '');
  if (!value) return json({ value: '', configured: false, source: null });

  const fromDb = Boolean(getSetting(hit.key));
  audit(guard.staff, 'settings.reveal', field, `查看 ${hit.label} 明文`);

  return json({ value, configured: true, source: fromDb ? 'db' : 'env' });
}
