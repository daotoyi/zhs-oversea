import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { getNavStrings, getFooterStrings, getUi } from '@/lib/i18n';
import { UI_ZH } from '@/lib/i18n/zh-hans';

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getUi();
  return {
    title: locale === 'en' ? 'Shipping & duties' : '运费与关税',
    description:
      locale === 'en'
        ? 'Shipping times, costs and duties for orders from Beijing to the United States. Duties are settled at checkout — nothing collected on delivery.'
        : '自北京发往美国订单的时效、费用与关税。关税于结账时结清——到货不再收取。',
    alternates: { canonical: '/policies/shipping' },
  };
}

export default async function ShippingPage() {
  const { locale, t } = await getUi();
  const navStrings = await getNavStrings();
  const footerStrings = await getFooterStrings();
  const h = UI_ZH.policies.shipping;

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
            {t('Shipping & duties', h.h1)}
          </h1>
          <div className="prose">
            <h2>{t('Where we ship', h.whereH)}</h2>
            <p>{t(
              'We currently ship to the United States only. Other destinations are not yet available at checkout — this is deliberate, so that each market we open is properly set up for tax and compliance rather than roughly added.',
              h.whereP
            )}</p>

            <h2>{t('Times and cost', h.timesH)}</h2>
            <ul>
              {h.timesL.map((item, i) => (
                <li key={i}>{t(
                  ['Light items (under 500 g) — 7–12 business days, $12 flat',
                   'Standard (under 2 kg) — 8–14 business days, $12 flat',
                   'Fragile or heavy pieces (under 8 kg) — 10–18 business days, $12 flat',
                   'Free shipping on every order over $60'][i],
                  item
                )}</li>
              ))}
            </ul>
            <p>{t(
              'Shipping is charged as a flat $12 rather than by weight, because the fragile pieces cost the same to pack as the light ones and we would rather absorb the difference than build it into the price.',
              h.timesP
            )}</p>

            <h2>{t('Duties and taxes', h.dutiesH)}</h2>
            <p>{t(
              'Import duties and taxes are settled at checkout, not collected on delivery. The price you see at checkout is the price you pay. This is deliberate — being surprised by a customs bill at the door is one of the most common reasons customers abandon an order, and one of the most common reasons they dispute a payment.',
              h.dutiesP1
            )}</p>
            <p>{t('Sales tax is calculated automatically for every US state that imposes it, based on your delivery address.', h.dutiesP2)}</p>

            <h2>{t('Tracking and care', h.trackingH)}</h2>
            <p>{t(
              'Every order is insured and tracked. You will receive the tracking number by email as soon as the parcel is scanned. Fragile pieces are packed to survive the journey; if one still arrives damaged, send us a photo and we will replace it or refund in full without asking you to return it.',
              h.trackingP
            )}</p>

            <h2>{t('Customs', h.customsH)}</h2>
            <p>{t(
              'We declare accurately and never mark goods as gifts or understate their value. Some species we work with — sandalwood, red sandalwood, agarwood — are listed under CITES Appendix II and travel with export certificates. Where a species cannot be certified, it is not sold.',
              h.customsP
            )}</p>
          </div>
        </div>
      </section>
      <Footer strings={footerStrings} />
    </>
  );
}
