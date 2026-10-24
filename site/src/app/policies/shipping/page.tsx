import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { getNavStrings, getFooterStrings } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Shipping & duties',
  description:
    'Shipping times, costs and duties for orders from Beijing to the United States. Duties are settled at checkout — nothing collected on delivery.',
  alternates: { canonical: '/policies/shipping' },
};

export default async function ShippingPage() {
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
            Shipping &amp; duties
          </h1>
          <div className="prose">
            <h2>Where we ship</h2>
            <p>
              We currently ship to the United States only. Other destinations are not yet available at
              checkout — this is deliberate, so that each market we open is properly set up for tax and
              compliance rather than roughly added.
            </p>

            <h2>Times and cost</h2>
            <ul>
              <li>Light items (under 500 g) — 7–12 business days, $12 flat</li>
              <li>Standard (under 2 kg) — 8–14 business days, $12 flat</li>
              <li>Fragile or heavy pieces (under 8 kg) — 10–18 business days, $12 flat</li>
              <li>Free shipping on every order over $60</li>
            </ul>
            <p>
              Shipping is charged as a flat $12 rather than by weight, because the fragile pieces cost
              the same to pack as the light ones and we would rather absorb the difference than build it
              into the price.
            </p>

            <h2>Duties and taxes</h2>
            <p>
              Import duties and taxes are settled at checkout, not collected on delivery. The price
              you see at checkout is the price you pay. This is deliberate — being surprised by a
              customs bill at the door is one of the most common reasons customers abandon an order,
              and one of the most common reasons they dispute a payment.
            </p>
            <p>
              Sales tax is calculated automatically for every US state that imposes it, based on your
              delivery address.
            </p>

            <h2>Tracking and care</h2>
            <p>
              Every order is insured and tracked. You will receive the tracking number by email as
              soon as the parcel is scanned. Fragile pieces are packed to survive the journey; if one
              still arrives damaged, send us a photo and we will replace it or refund in full without
              asking you to return it.
            </p>

            <h2>Customs</h2>
            <p>
              We declare accurately and never mark goods as gifts or understate their value. Some
              species we work with — sandalwood, red sandalwood, agarwood — are listed under CITES
              Appendix II and travel with export certificates. Where a species cannot be certified, it
              is not sold.
            </p>
          </div>
        </div>
      </section>
      <Footer strings={footerStrings} />
    </>
  );
}
