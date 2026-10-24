import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { initDb } from '@/lib/db/loader';
import { currentUser } from '@/lib/account/auth';
import { accountLabels } from '@/lib/account/ui';
import type { AccountLabels } from '@/lib/account/ui';
import { enabledProviders } from '@/lib/account/oauth';
import { getNavStrings, getFooterStrings, getUi } from '@/lib/i18n';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { AuthPanel } from '@/components/account/AuthPanel';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Account — Zhen He Sheng',
    description: 'Sign in to track orders, keep a list of saved objects and collect member points.',
    robots: { index: false, follow: false },
  };
}

function errorText(code: string | undefined, labels: AccountLabels): string | undefined {
  switch (code) {
    case 'provider_disabled':
      return labels.errProviderDisabled;
    case 'oauth_failed':
    case 'oauth_cancelled':
      return labels.errOauthFailed;
    case 'oauth_no_email':
      return labels.errNoEmail;
    case 'oauth_state':
      return labels.errState;
    case 'account_disabled':
      return labels.errAccountDisabled;
    default:
      return undefined;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;
  await initDb();

  const next = typeof sp.next === 'string' && sp.next.startsWith('/account') ? sp.next : '/account';
  const user = await currentUser();
  if (user) redirect(next);

  const { locale } = await getUi();
  const labels = accountLabels(locale);
  const navStrings = await getNavStrings();
  const footerStrings = await getFooterStrings();

  return (
    <>
      <Nav strings={navStrings} />
      <section className="acct-sec">
        <div className="wrap acct-wrap">
          <AuthPanel
            labels={labels}
            providers={enabledProviders()}
            next={next}
            initialError={errorText(sp.error, labels)}
          />
        </div>
      </section>
      <Footer strings={footerStrings} />
    </>
  );
}
