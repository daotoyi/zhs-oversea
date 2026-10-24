import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: 'How Zhen He Sheng collects, uses and protects your personal information.',
  alternates: { canonical: '/policies/privacy' },
};

export default function PrivacyPage() {
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
            Privacy policy
          </h1>
          <div className="prose">
            <h2>What we collect</h2>
            <p>
              When you order, we collect your name, email address, delivery address and the contents of
              your order. When you subscribe to the Sunday hexagram, we collect your email address and
              nothing else. We do not collect payment card details ourselves — those go directly to
              our payment processor and never touch our servers.
            </p>

            <h2>Why we collect it</h2>
            <ul>
              <li>To take, ship and deliver your order, and to answer questions about it</li>
              <li>To email you the tracking number, the order confirmation and, if you asked for it, the weekly reading</li>
              <li>To meet our tax and legal obligations</li>
              <li>To detect and prevent fraud, including payment disputes</li>
            </ul>

            <h2>Who we share it with</h2>
            <p>
              We share what is necessary to run the business, and nothing more: our payment processor,
              our email service, our shipping carrier, and the tax authorities we are required to
              report to. We do not sell personal information, and we do not share it for advertising.
            </p>

            <h2>Cookies</h2>
            <p>
              We use a small number of cookies: some are required for the site to work at all, and
              others tell us which pages are read so we can write more of what is useful. You can
              refuse the optional ones without losing any functionality.
            </p>

            <h2>How long we keep it</h2>
            <p>
              Order records are kept for as long as our tax obligations require. Newsletter
              subscriptions are kept until you unsubscribe, and we remove them from our list within
              thirty days of a request.
            </p>

            <h2>Your rights</h2>
            <p>
              You can ask to see the personal data we hold about you, ask us to correct it, or ask us
              to delete it where we are not legally required to keep it. California residents have
              specific rights under the CCPA, including the right to know and the right to delete;
              residents of states with similar laws have the same. Write to us and we will respond
              within thirty days.
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
