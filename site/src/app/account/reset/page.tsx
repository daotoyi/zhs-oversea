import type { Metadata } from 'next';
import { initDb } from '@/lib/db/loader';
import { accountLabels } from '@/lib/account/ui';
import { getNavStrings, getFooterStrings, getUi } from '@/lib/i18n';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { ResetForm } from '@/components/account/ResetForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Reset password — Zhen He Sheng',
  robots: { index: false, follow: false },
};

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const sp = await searchParams;
  await initDb();
  const { locale } = await getUi();
  const labels = accountLabels(locale);
  const navStrings = await getNavStrings();
  const footerStrings = await getFooterStrings();

  return (
    <>
      <Nav strings={navStrings} />
      <section className="acct-sec">
        <div className="wrap acct-wrap">
          <ResetForm labels={labels} token={typeof sp.token === 'string' ? sp.token : ''} />
        </div>
      </section>
      <Footer strings={footerStrings} />
    </>
  );
}
