import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Imprint & legal notice',
  description: 'Company details, responsible party and dispute resolution for zhenhesheng.com.',
  alternates: { canonical: '/policies/imprint' },
};

export default function ImprintPage() {
  return (
    <>
      <Nav />
      <section className="sec" style={{ paddingTop: 64 }}>
        <div className="wrap">
          <div className="eyebrow" style={{ marginBottom: 18 }}>
            Policies
          </div>
          <h1
            className="serif"
            style={{ fontWeight: 300, fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.1, marginBottom: 32 }}
          >
            Imprint &amp; legal notice
          </h1>
          <div className="prose">
            <h2>Operator of this site</h2>
            <p>
              This website is operated by Zhen He Sheng Limited (真和盛有限公司), a company incorporated
              in Hong Kong SAR. The company number, registered office and the name of the responsible
              managing director are stated in the company imprint published with our business
              registration.
            </p>

            <h2>Contact</h2>
            <p>
              <a href="mailto:hello@zhenhesheng.com" style={{ color: 'var(--cinnabar)' }}>
                hello@zhenhesheng.com
              </a>
              <br />
              Zhen He Sheng, Tongzhou, Beijing, China
            </p>

            <h2>Our Chinese-language site</h2>
            <p>
              The Chinese-language edition of this work is published separately at{' '}
              <a href="https://zhenhesheng.cn" style={{ color: 'var(--cinnabar)' }}>
                zhenhesheng.cn
              </a>
              , operated by the same studio. The Chinese-language site is the primary source for our
              cultural and study content; this English edition is the international storefront.
            </p>

            <h2>Prices and availability</h2>
            <p>
              All prices are shown in United States dollars and exclude any sales tax, which is
              calculated at checkout where applicable. Prices and availability are subject to change
              without notice, but never after an order has been placed.
            </p>

            <h2>Consecration statements</h2>
            <p>
              Where we describe an object as consecrated or ritually prepared, we mean that a
              specific rite was performed by a named practitioner on a stated date, recorded in a
              certificate with a number. We make no claim about the effect of that rite, and we do not
              promise any outcome. These are matters of tradition and practice, not of medical or
              financial effect.
            </p>

            <h2>Dispute resolution</h2>
            <p>
              We would rather resolve a problem directly than through a formal process. Write to us
              first and we will answer within one business day. Nothing in these terms prevents you
              from exercising your statutory rights or from bringing a claim before the competent
              court or consumer body in your place of residence.
            </p>

            <h2>Governing law</h2>
            <p>
              These terms are governed by the laws of Hong Kong SAR, without prejudice to any
              mandatory consumer protection law that applies to you where you live.
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
