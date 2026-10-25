import { initDb, persistSoon } from '@/lib/db/loader';
import { requireStaff, json, bad } from '@/lib/admin/guard';
import { audit } from '@/lib/admin/dao';
import { setSetting, deleteSetting } from '@/lib/settings';
import { validateAppleKey, credentials, normalizePrivateKey } from '@/lib/account/oauth';
import { publicBaseUrl } from '@/lib/admin/http';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';

type Body = {
  provider?: 'google' | 'apple' | 'paypal';
  clientId?: string;
  clientSecret?: string;
  teamId?: string;
  keyId?: string;
  privateKey?: string;
  paypalEnv?: string;
  clear?: boolean;
};

/**
 * 保存第三方登录凭据
 *
 * 安全取向：
 * - 只接受文本字段，密钥原样落库（.data/zhs.db，仅服务端可读）
 * - 界面上永不回传完整密钥，只回末 4 位
 * - Apple 私钥保存前用 jose 实际签一次，签名失败直接拒绝，避免线上才发现配错
 */
export async function POST(req: NextRequest) {
  const guard = await requireStaff('settings');
  if (!guard.ok) return guard.res;

  await initDb();
  const body = (await req.json().catch(() => ({}))) as Body;
  const provider = body.provider;
  if (provider !== 'google' && provider !== 'apple' && provider !== 'paypal') return bad('provider 无效');

  const clean = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

  if (body.clear) {
    if (provider === 'google') {
      deleteSetting('oauth_google_client_id');
      deleteSetting('oauth_google_client_secret');
    } else if (provider === 'apple') {
      deleteSetting('oauth_apple_client_id');
      deleteSetting('oauth_apple_team_id');
      deleteSetting('oauth_apple_key_id');
      deleteSetting('oauth_apple_private_key');
    } else {
      deleteSetting('paypal_client_id');
      deleteSetting('paypal_client_secret');
      deleteSetting('paypal_env');
    }
    persistSoon();
    audit(guard.staff, 'oauth.clear', provider, '清除第三方登录凭据');
    return json({ ok: true, cleared: true });
  }

  if (provider === 'google') {
    const clientId = clean(body.clientId);
    if (clientId && !clientId.endsWith('.apps.googleusercontent.com')) {
      return bad('Client ID 应以 .apps.googleusercontent.com 结尾');
    }
    if (clientId) setSetting('oauth_google_client_id', clientId, guard.staff.username);
    const secret = clean(body.clientSecret);
    if (secret) setSetting('oauth_google_client_secret', secret, guard.staff.username);
  } else if (provider === 'apple') {
    const clientId = clean(body.clientId);
    const teamId = clean(body.teamId);
    const keyId = clean(body.keyId);
    const privateKey = typeof body.privateKey === 'string' ? body.privateKey.trim() : '';

    if (clientId) setSetting('oauth_apple_client_id', clientId, guard.staff.username);
    if (teamId) setSetting('oauth_apple_team_id', teamId, guard.staff.username);
    if (keyId) setSetting('oauth_apple_key_id', keyId, guard.staff.username);

    // 私钥归一化为 PKCS#8 再入库（兼容 SEC1），并真实签一次 client_secret 做前置校验
    if (privateKey) {
      const normalized = normalizePrivateKey(privateKey);
      if ('error' in normalized) return bad(`Apple 私钥有问题：${normalized.error}`);
      setSetting('oauth_apple_private_key', normalized.key, guard.staff.username);
    }

    const err = await validateAppleKey();
    if (err) return bad(`Apple 配置未通过校验：${err}`);
  } else {
    const clientId = clean(body.clientId);
    if (clientId) setSetting('paypal_client_id', clientId, guard.staff.username);
    const secret = clean(body.clientSecret);
    if (secret) setSetting('paypal_client_secret', secret, guard.staff.username);
    const env = clean(body.paypalEnv);
    if (env === 'sandbox' || env === 'live') setSetting('paypal_env', env, guard.staff.username);
  }

  persistSoon();
  audit(guard.staff, 'oauth.save', provider, '更新第三方登录凭据');

  return json({
    ok: true,
    redirectUri:
      provider === 'paypal'
        ? `${publicBaseUrl(req)}/api/webhooks/paypal`
        : `${publicBaseUrl(req)}/api/auth/oauth/${provider}/callback`,
    configured: provider === 'paypal' ? true : credentials(provider),
  });
}

/** 保存 Apple 域名归属校验文件内容 */
export async function PUT(req: NextRequest) {
  const guard = await requireStaff('settings');
  if (!guard.ok) return guard.res;

  await initDb();
  const body = (await req.json().catch(() => ({}))) as { assoc?: string };
  const assoc = typeof body.assoc === 'string' ? body.assoc.trim() : '';
  if (assoc) setSetting('apple_domain_assoc', assoc, guard.staff.username);
  else deleteSetting('apple_domain_assoc');
  persistSoon();
  audit(guard.staff, 'oauth.assoc', 'apple', assoc ? '更新域名校验文件' : '清除域名校验文件');
  return json({ ok: true, served: Boolean(assoc) });
}
