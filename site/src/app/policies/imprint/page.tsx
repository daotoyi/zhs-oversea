import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { getNavStrings, getFooterStrings, getUi } from '@/lib/i18n';
import { UI_ZH } from '@/lib/i18n/zh-hans';

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getUi();
  return {
    title: locale === 'en' ? 'Imprint & legal notice' : '法律声明',
    description:
      locale === 'en'
        ? 'Company details, responsible party and dispute resolution for zhenhesheng.com.'
        : 'zhenhesheng.com 的公司信息、责任方与争议解决。',
    alternates: { canonical: '/policies/imprint' },
  };
}

export default async function ImprintPage() {
  const { locale, t } = await getUi();
  const navStrings = await getNavStrings();
  const footerStrings = await getFooterStrings();
  const h = UI_ZH.policies.imprint;

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
            {t('Imprint & legal notice', h.h1)}
          </h1>
          <div className="prose">
            <h2>{t('Operator of this site', h.operatorH)}</h2>
            <p>{t(
              'This website is operated by Zhen He Sheng Limited (真和盛有限公司), a company incorporated in Hong Kong SAR. The company number, registered office and the name of the responsible managing director are stated in the company imprint published with our business registration.',
              h.operatorP
            )}</p>

            <h2>{t('Contact', h.contactH)}</h2>
            <p>
              <a href="mailto:hello@zhenhesheng.com" style={{ color: 'var(--cinnabar)' }}>
                hello@zhenhesheng.com
              </a>
              <br />
              {t('Zhen He Sheng, Tongzhou, Beijing, China', h.contactAddr)}
            </p>

            <h2>{t('Our Chinese-language site', h.cnSiteH)}</h2>
            <p>
              {t('The Chinese-language edition of this work is published separately at ', h.cnSiteP1)}
              <a href="https://zhenhesheng.cn" style={{ color: 'var(--cinnabar)' }}>
                zhenhesheng.cn
              </a>
              {t(', operated by the same studio. The Chinese-language site is the primary source for our cultural and study content; this English edition is the international storefront.', h.cnSiteP2)}
            </p>

            <h2>{t('Prices and availability', h.pricesH)}</h2>
            <p>{t(
              'All prices are shown in United States dollars and exclude any sales tax, which is calculated at checkout where applicable. Prices and availability are subject to change without notice, but never after an order has been placed.',
              h.pricesP
            )}</p>

            <h2>{t('Consecration statements', h.consecrationH)}</h2>
            <p>{t(
              'Where we describe an object as consecrated or ritually prepared, we mean that a specific rite was performed by a named practitioner on a stated date, recorded in a certificate with a number. We make no claim about the effect of that rite, and we do not promise any outcome. These are matters of tradition and practice, not of medical or financial effect.',
              h.consecrationP
            )}</p>

            <h2>{t('Dispute resolution', h.disputeH)}</h2>
            <p>{t(
              'We would rather resolve a problem directly than through a formal process. Write to us first and we will answer within one business day. Nothing in these terms prevents you from exercising your statutory rights or from bringing a claim before the competent court or consumer body in your place of residence.',
              h.disputeP
            )}</p>

            <h2>{t('Governing law', h.lawH)}</h2>
            <p>{t(
              'These terms are governed by the laws of Hong Kong SAR, without prejudice to any mandatory consumer protection law that applies to you where you live.',
              h.lawP
            )}</p>
          </div>
        </div>
      </section>
      <Footer strings={footerStrings} />
    </>
  );
}
