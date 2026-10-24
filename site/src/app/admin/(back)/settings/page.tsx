import { initDb } from '@/lib/db/loader';
import { listSettings } from '@/lib/settings';
import { credentials, missingFields } from '@/lib/account/oauth';
import OAuthSettings from '@/components/admin/OAuthSettings';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  await initDb();
  const stored = listSettings();

  const google = credentials('google');
  const apple = credentials('apple');

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1>登录配置</h1>
          <p>Google / Apple 一键登录 · 填完即生效，无需改代码或重启</p>
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
    </>
  );
}
