import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Returns & refunds',
  description:
    'Thirty days to return anything unworn, unused and in its original packaging. We cover the return shipping.',
  alternates: { canonical: '/policies/returns' },
};

export default function ReturnsPage() {
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
            Returns &amp; refunds
          </h1>
          <div className="prose">
            <h2>Thirty days</h2>
            <p>
              You have thirty days from delivery to return anything that is unworn, unused and in its
              original packaging. We cover the return shipping — you do not need to pay to send it
              back.
            </p>

            <h2>Damaged in transit</h2>
            <p>
              If an object arrives damaged, send us a photograph and we will replace it or refund you
              in full. You do not need to return the damaged item; we will ask you to dispose of it,
              which is the kinder thing to ask when the item is already broken.
            </p>

            <h2>How refunds are issued</h2>
            <p>
              Refunds go back to the original payment method within five business days of us
              receiving the return. Your bank or card issuer may take a further few days to post the
              credit. We cannot refund to a different method, and we cannot refund a method that has
              expired.
            </p>

            <h2>What we cannot accept back</h2>
            <ul>
              <li>Books that have been read — the pages cannot be un-read</li>
              <li>Incense and fragrance, once the box is opened</li>
              <li>Any object that has been used for its intended purpose</li>
            </ul>
            <p>
              If you are unsure whether something will suit you, write to us first. We would rather
              answer a question before an order than handle a return after one.
            </p>

            <h2>Your statutory rights</h2>
            <p>
              Nothing on this page limits your rights under the consumer law that applies to you. If
              an item is faulty, we will repair or replace it, and if that is not possible, refund you.
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
