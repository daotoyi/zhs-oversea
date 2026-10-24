import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { getNavStrings, getFooterStrings, getTrustItems, getUi } from '@/lib/i18n';
import { UI_ZH } from '@/lib/i18n/zh-hans';

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getUi();
  return {
    title: locale === 'en' ? 'Contact' : '联系',
    description:
      locale === 'en'
        ? 'Reach the Zhen He Sheng studio in Beijing. We answer written enquiries within one business day.'
        : '联系北京真和盛作坊。书面来函一个工作日内必复。',
    alternates: { canonical: '/contact' },
  };
}

export default async function ContactPage() {
  const { locale, t } = await getUi();
  const navStrings = await getNavStrings();
  const footerStrings = await getFooterStrings();
  const h = UI_ZH.contactPage;

  return (
    <>
      <Nav strings={navStrings} />
      <section className="sec" style={{ paddingTop: 64 }}>
        <div className="wrap">
          <div className="eyebrow" style={{ marginBottom: 18 }}>
            {t('Contact', h.eyebrow)}
          </div>
          <h1
            className="serif"
            style={{ fontWeight: 300, fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.1, marginBottom: 32 }}
          >
            {t('Write to the studio.', h.h1)}
          </h1>
          <div className="prose">
            <p>{t(
              'If something about an object is unclear — its size, its material, whether it suits a particular use — write and ask. We would rather answer before you order than after.',
              h.lead
            )}</p>
            <h2>{t('Email', h.emailH)}</h2>
            <p>
              <a href="mailto:hello@zhenhesheng.com" style={{ color: 'var(--cinnabar)' }}>
                hello@zhenhesheng.com
              </a>
              <br />
              {t('Response within one business day, Monday to Saturday.', h.emailNote)}
            </p>
            <h2>{t('Studio address', h.addrH)}</h2>
            <p>
              {t('Zhen He Sheng', h.addr1)}
              <br />
              {t('Tongzhou, Beijing, China', h.addr2)}
              <br />
              {t('Registered in Hong Kong SAR — company details on the ', h.addr3a)}
              <a href="/policies/imprint" style={{ color: 'var(--cinnabar)' }}>
                {t('imprint page', h.addr3Link)}
              </a>
              {t('.', h.addr3b)}
            </p>
            <h2>{t('Before you write', h.beforeH)}</h2>
            <p>
              {t('Shipping times, duties and returns are all covered on the ', h.beforePa)}
              <a href="/policies/shipping" style={{ color: 'var(--cinnabar)' }}>
                {t('shipping page', h.beforeShipLink)}
              </a>
              {t(' and the ', h.beforeMid)}
              <a href="/policies/returns" style={{ color: 'var(--cinnabar)' }}>
                {t('returns page', h.beforeReturnLink)}
              </a>
              {t('. Most questions are already answered there.', h.beforePb)}
            </p>
          </div>
        </div>
      </section>
      <Footer strings={footerStrings} />
    </>
  );
}
