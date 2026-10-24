import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { getNavStrings, getFooterStrings, getUi } from '@/lib/i18n';
import { UI_ZH } from '@/lib/i18n/zh-hans';

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getUi();
  return {
    title: locale === 'en' ? 'Privacy policy' : '隐私政策',
    description:
      locale === 'en'
        ? 'How Zhen He Sheng collects, uses and protects your personal information.'
        : '真和盛如何收集、使用与保护您的个人信息。',
    alternates: { canonical: '/policies/privacy' },
  };
}

export default async function PrivacyPage() {
  const { locale, t } = await getUi();
  const navStrings = await getNavStrings();
  const footerStrings = await getFooterStrings();
  const h = UI_ZH.policies.privacy;

  return (
    <>
      <Nav strings={navStrings} />
      <section className="sec" style={{ paddingTop: 64 }}>
        <div className="wrap">
          <div className="eyebrow" style={{ marginBottom: 18 }}>
            {t('Policies', UI_ZH.policies.eyebrow)}
          </div>
          <h1
            className="serif"
            style={{ fontWeight: 300, fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.1, marginBottom: 32 }}
          >
            {t('Privacy policy', h.h1)}
          </h1>
          <div className="prose">
            <h2>{t('What we collect', h.whatH)}</h2>
            <p>{t(
              'When you order, we collect your name, email address, delivery address and the contents of your order. When you subscribe to the Sunday hexagram, we collect your email address and nothing else. We do not collect payment card details ourselves — those go directly to our payment processor and never touch our servers.',
              h.whatP
            )}</p>

            <h2>{t('Why we collect it', h.whyH)}</h2>
            <ul>
              {h.whyL.map((item, i) => (
                <li key={i}>{t(
                  ['To take, ship and deliver your order, and to answer questions about it',
                   'To email you the tracking number, the order confirmation and, if you asked for it, the weekly reading',
                   'To meet our tax and legal obligations',
                   'To detect and prevent fraud, including payment disputes'][i],
                  item
                )}</li>
              ))}
            </ul>

            <h2>{t('Who we share it with', h.shareH)}</h2>
            <p>{t(
              'We share what is necessary to run the business, and nothing more: our payment processor, our email service, our shipping carrier, and the tax authorities we are required to report to. We do not sell personal information, and we do not share it for advertising.',
              h.shareP
            )}</p>

            <h2>{t('Cookies', h.cookiesH)}</h2>
            <p>{t(
              'We use a small number of cookies: some are required for the site to work at all, and others tell us which pages are read so we can write more of what is useful. You can refuse the optional ones without losing any functionality.',
              h.cookiesP
            )}</p>

            <h2>{t('How long we keep it', h.keepH)}</h2>
            <p>{t(
              'Order records are kept for as long as our tax obligations require. Newsletter subscriptions are kept until you unsubscribe, and we remove them from our list within thirty days of a request.',
              h.keepP
            )}</p>

            <h2>{t('Your rights', h.rightsH)}</h2>
            <p>{t(
              'You can ask to see the personal data we hold about you, ask us to correct it, or ask us to delete it where we are not legally required to keep it. California residents have specific rights under the CCPA, including the right to know and the right to delete; residents of states with similar laws have the same. Write to us and we will respond within thirty days.',
              h.rightsP
            )}</p>
          </div>
        </div>
      </section>
      <Footer strings={footerStrings} />
    </>
  );
}
