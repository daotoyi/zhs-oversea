import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Reach the Zhen He Sheng studio in Beijing. We answer written enquiries within one business day.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <>
      <Nav />
      <section className="sec" style={{ paddingTop: 64 }}>
        <div className="wrap">
          <div className="eyebrow" style={{ marginBottom: 18 }}>
            Contact
          </div>
          <h1
            className="serif"
            style={{ fontWeight: 300, fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.1, marginBottom: 32 }}
          >
            Write to the studio.
          </h1>
          <div className="prose">
            <p>
              If something about an object is unclear — its size, its material, whether it suits a
              particular use — write and ask. We would rather answer before you order than after.
            </p>
            <h2>Email</h2>
            <p>
              <a href="mailto:hello@zhenhesheng.com" style={{ color: 'var(--cinnabar)' }}>
                hello@zhenhesheng.com
              </a>
              <br />
              Response within one business day, Monday to Saturday.
            </p>
            <h2>Studio address</h2>
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
            <h2>Before you write</h2>
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
      <Footer />
    </>
  );
}
