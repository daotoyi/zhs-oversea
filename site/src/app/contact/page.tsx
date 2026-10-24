import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { getNavStrings, getFooterStrings, getTrustItems, getUi } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Reach the Zhen He Sheng studio in Beijing. We answer written enquiries within one business day.',
  alternates: { canonical: '/contact' },
};

export default async function ContactPage() {
  const { locale, t } = await getUi();
  const navStrings = await getNavStrings();
  const footerStrings = await getFooterStrings();
  return (
    <>
      <Nav strings={navStrings} />
      <section className="sec" style={{ paddingTop: 64 }}>
        <div className="wrap">
          <div className="eyebrow" style={{ marginBottom: 18 }}>
            Contact
          </div>
          <h1
            className="serif"
            style={{ fontWeight: 300, fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.1, marginBottom: 32 }}
          >
            写信到作坊。
          </h1>
          <div className="prose">
            <p>
              If something about an object is unclear — its size, its material, whether it suits a
              particular use — write and ask. We would rather answer before you order than after.
            </p>
            <h2>邮件</h2>
            <p>
              <a href="mailto:hello@zhenhesheng.com" style={{ color: 'var(--cinnabar)' }}>
                hello@zhenhesheng.com
              </a>
              <br />
              周一至周六，一个工作日内回复。
            </p>
            <h2>作坊地址</h2>
            <p>
              Zhen He Sheng
              <br />
              Tongzhou, Beijing, China
              <br />
              Registered in Hong Kong SAR — company details on the{' '}
              <a href="/policies/imprint" style={{ color: 'var(--cinnabar)' }}>
                imprint page
              </a>
              .
            </p>
            <h2>写信之前</h2>
            <p>
              Shipping times, duties and returns are all covered on the{' '}
              <a href="/policies/shipping" style={{ color: 'var(--cinnabar)' }}>
                shipping page
              </a>{' '}
              and the{' '}
              <a href="/policies/returns" style={{ color: 'var(--cinnabar)' }}>
                returns page
              </a>
              . Most questions are already answered there.
            </p>
          </div>
        </div>
      </section>
      <Footer strings={footerStrings} />
    </>
  );
}
