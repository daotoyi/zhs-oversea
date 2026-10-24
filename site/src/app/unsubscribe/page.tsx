import type { Metadata } from 'next';
import { initDb } from '@/lib/db/loader';
import { emailForToken, isSuppressed } from '@/lib/mail/suppression';
import { getUi } from '@/lib/i18n';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { getNavStrings, getFooterStrings } from '@/lib/i18n';
import { UnsubscribeConfirm } from '@/components/UnsubscribeConfirm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Unsubscribe — Zhen He Sheng',
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const sp = await searchParams;
  await initDb();

  const { locale, t } = await getUi();
  const token = typeof sp.t === 'string' ? sp.t : '';
  const email = emailForToken(token);
  const already = email ? isSuppressed(email) : false;

  const navStrings = await getNavStrings();
  const footerStrings = await getFooterStrings();

  const labels = {
    title: t('Unsubscribe', '退订'),
    lead: t(
      'One click and this address stops receiving our letters. Order and account emails still arrive — they are not marketing.',
      '一键退订后，此邮箱将不再收到我们的推广来信。订单与账户邮件不受影响——那些不是营销邮件。'
    ),
    confirm: t('Unsubscribe me', '确认退订'),
    done: t('You are unsubscribed', '已退订'),
    doneLead: t('No further marketing letters will be sent to this address.', '此邮箱不会再收到推广邮件。'),
    invalid: t('This link is not valid. It may have been cut short by your email client.', '链接无效，可能被邮件客户端截断了。'),
    back: t('Back to the shop', '返回商店'),
  };

  return (
    <>
      <Nav strings={navStrings} />
      <section className="sec unsub-sec">
        <div className="wrap">
          {already ? (
            <div className="unsub">
              <div className="eyebrow">Zhen He Sheng</div>
              <h1 className="serif">{labels.done}</h1>
              <p className="unsub-lead">{labels.doneLead}</p>
            </div>
          ) : (
            <UnsubscribeConfirm token={token} email={email ?? (locale === 'en' ? 'this address' : '此邮箱')} labels={labels} />
          )}
        </div>
      </section>
      <Footer strings={footerStrings} />
    </>
  );
}
