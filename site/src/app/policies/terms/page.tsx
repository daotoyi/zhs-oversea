import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { getNavStrings, getFooterStrings, getUi } from '@/lib/i18n';
import { UI_ZH } from '@/lib/i18n/zh-hans';

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getUi();
  return {
    title: locale === 'en' ? 'Terms of service' : '服务条款',
    description:
      locale === 'en'
        ? 'The terms that apply when you order from zhenhesheng.com.'
        : '在 zhenhesheng.com 下单时适用的条款。',
    alternates: { canonical: '/policies/terms' },
  };
}

export default async function TermsPage() {
  const { locale, t } = await getUi();
  const navStrings = await getNavStrings();
  const footerStrings = await getFooterStrings();
  const h = UI_ZH.policies.terms;

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
            {t('Terms of service', h.h1)}
          </h1>
          <div className="prose">
            <h2>{t('Orders', h.ordersH)}</h2>
            <p>{t(
              'An order is an offer to buy. It becomes a contract when we send the order confirmation email. We may decline an order — for example if an item is out of stock, if a listed certificate turns out to be unavailable, or if we cannot ship to your address.',
              h.ordersP
            )}</p>

            <h2>{t('Descriptions and measurements', h.descH)}</h2>
            <p>{t(
              'Handmade objects vary. Dimensions, weight and colour may differ slightly from the figures given, and that is stated on the product page where it applies. A piece that falls outside the stated tolerance is not faulty.',
              h.descP
            )}</p>

            <h2>{t('Content and cultural material', h.contentH)}</h2>
            <p>
              {t('The texts, translations and commentary published here are our own work unless otherwise credited. The ', h.contentPa)}
              <em>Dao De Jing</em>
              {t(' itself is ancient and in the public domain, but particular English translations are still in copyright and are not reproduced here.', h.contentPb)}
            </p>

            <h2>{t('No medical or financial advice', h.adviceH)}</h2>
            <p>{t(
              'Nothing published on this site is medical, legal or financial advice. Objects described in cultural terms are offered as examples of practice and craft, not as instruments with a therapeutic or commercial effect.',
              h.adviceP
            )}</p>

            <h2>{t('Liability', h.liabilityH)}</h2>
            <p>{t(
              'Our liability for any order is limited to the amount you paid for it. This does not limit liability that cannot be limited by law, including for death or personal injury caused by negligence, or for fraud.',
              h.liabilityP
            )}</p>

            <h2>{t('Changes', h.changesH)}</h2>
            <p>{t(
              'We may revise these terms. The version in force is the one published on this page at the time your order was placed.',
              h.changesP
            )}</p>
          </div>
        </div>
      </section>
      <Footer strings={footerStrings} />
    </>
  );
}
