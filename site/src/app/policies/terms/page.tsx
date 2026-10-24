import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { getNavStrings, getFooterStrings } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Terms of service',
  description: 'The terms that apply when you order from zhenhesheng.com.',
  alternates: { canonical: '/policies/terms' },
};

export default async function TermsPage() {
  const navStrings = await getNavStrings();
  const footerStrings = await getFooterStrings();
  return (
    <>
      <Nav strings={navStrings} />
      <section className="sec" style={{ paddingTop: 64 }}>
        <div className="wrap">
          <div className="eyebrow" style={{ marginBottom: 18 }}>
            Policies
          </div>
          <h1
            className="serif"
            style={{ fontWeight: 300, fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.1, marginBottom: 32 }}
          >
            Terms of service
          </h1>
          <div className="prose">
            <h2>Orders</h2>
            <p>
              An order is an offer to buy. It becomes a contract when we send the order confirmation
              email. We may decline an order — for example if an item is out of stock, if a listed
              certificate turns out to be unavailable, or if we cannot ship to your address.
            </p>

            <h2>Descriptions and measurements</h2>
            <p>
              Handmade objects vary. Dimensions, weight and colour may differ slightly from the
              figures given, and that is stated on the product page where it applies. A piece that
              falls outside the stated tolerance is not faulty.
            </p>

            <h2>Content and cultural material</h2>
            <p>
              The texts, translations and commentary published here are our own work unless otherwise
              credited. The <em>Dao De Jing</em> itself is ancient and in the public domain, but
              particular English translations are still in copyright and are not reproduced here.
            </p>

            <h2>No medical or financial advice</h2>
            <p>
              Nothing published on this site is medical, legal or financial advice. Objects described
              in cultural terms are offered as examples of practice and craft, not as instruments with
              a therapeutic or commercial effect.
            </p>

            <h2>Liability</h2>
            <p>
              Our liability for any order is limited to the amount you paid for it. This does not
              limit liability that cannot be limited by law, including for death or personal injury
              caused by negligence, or for fraud.
            </p>

            <h2>Changes</h2>
            <p>
              We may revise these terms. The version in force is the one published on this page at the
              time your order was placed.
            </p>
          </div>
        </div>
      </section>
      <Footer strings={footerStrings} />
    </>
  );
}
