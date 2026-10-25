import { initDb } from '@/lib/db/loader';
import { listSettings } from '@/lib/settings';
import { credentials, missingFields } from '@/lib/account/oauth';
import { mailConfig, missingMailConfig } from '@/lib/mail/config';
import { listSuppressions, suppressionCount } from '@/lib/mail/suppression';
import OAuthSettings from '@/components/admin/OAuthSettings';
import PayPalSettings from '@/components/admin/PayPalSettings';
import MailSettings from '@/components/admin/MailSettings';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  await initDb();
  const stored = listSettings();

  const google = credentials('google');
  const apple = credentials('apple');
  const mail = mailConfig();

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1>登录与邮件配置</h1>
          <p>Google / Apple 一键登录 · 邮件发信通道 · 填完即生效，无需改代码或重启</p>
        </div>
      </div>

      <OAuthSettings
        initial={{
          googleClientId: stored.oauth_google_client_id ?? '',
          googleSecretSet: Boolean(google.clientSecret),
          googleSecretTail: google.clientSecret ? google.clientSecret.slice(-4) : '',
          googleMissing: missingFields('google'),
          appleClientId: stored.oauth_apple_client_id ?? '',
          appleTeamId: stored.oauth_apple_team_id ?? '',
          appleKeyId: stored.oauth_apple_key_id ?? '',
          appleKeySet: Boolean(apple.privateKey),
          appleMissing: missingFields('apple'),
          appleAssoc: stored.apple_domain_assoc ?? '',
          envGoogle: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
          envApple: Boolean(
            process.env.APPLE_CLIENT_ID &&
              process.env.APPLE_TEAM_ID &&
              process.env.APPLE_KEY_ID &&
              process.env.APPLE_PRIVATE_KEY
          ),
        }}
      />

      <hr className="rule" style={{ margin: '30px 0 20px' }} />
      <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>支付通道（PayPal）</h2>
      <PayPalSettings
        initial={{
          clientId: stored.paypal_client_id ?? '',
          secretSet: Boolean(stored.paypal_client_secret || process.env.PAYPAL_CLIENT_SECRET),
          secretTail: (stored.paypal_client_secret || process.env.PAYPAL_CLIENT_SECRET || '').slice(-4),
          env: stored.paypal_env || process.env.PAYPAL_ENV || 'sandbox',
          envFromSettings: Boolean(stored.paypal_env),
          envFromEnv: Boolean(process.env.PAYPAL_ENV),
          missing:
            stored.paypal_client_id && (stored.paypal_client_secret || process.env.PAYPAL_CLIENT_SECRET)
              ? []
              : ['Client ID', 'Client Secret'],
        }}
      />

      <hr className="rule" style={{ margin: '30px 0 4px' }} />

      <MailSettings
        initial={{
          ready: Boolean(mail.resendKey),
          marketingReady: Boolean(mail.resendKey && mail.fromMarketing && mail.physicalAddress),
          keyTail: mail.resendKey ? mail.resendKey.slice(-4) : '',
          fromTransactional: mail.fromTransactional,
          fromMarketing: mail.fromMarketing,
          replyTo: mail.replyTo,
          physicalAddress: mail.physicalAddress,
          companyName: mail.companyName,
          missing: missingMailConfig(),
          webhookSecretSet: Boolean(stored.mail_webhook_secret),
          suppressions: listSuppressions(200),
          suppressionsTotal: suppressionCount(),
        }}
      />
    </>
  );
}
