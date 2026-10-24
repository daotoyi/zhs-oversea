import type { Metadata } from 'next';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Order confirmed',
  robots: { index: false, follow: false },
};

export default function CheckoutSuccessPage() {
  return (
    <>
      <Nav />
      <section className="sec" style={{ paddingTop: 96, paddingBottom: 120 }}>
        <div className="wrap" style={{ maxWidth: 620, textAlign: 'center' }}>
          <div className="brand-mark" style={{ margin: '0 auto 28px', width: 44, height: 44, fontSize: 20 }}>
            ☯
          </div>
          <h1 className="serif" style={{ fontWeight: 300, fontSize: 'clamp(1.9rem, 4vw, 2.8rem)', lineHeight: 1.15, marginBottom: 20 }}>
            Thank you — it&rsquo;s on its way.
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ash)', lineHeight: 1.8, marginBottom: 16 }}>
            A confirmation is in your inbox with the order details and tracking. Parcels leave Beijing
            within two business days and take 7–15 business days to reach the United States.
          </p>
          <p style={{ fontSize: 14, color: 'var(--ash)', lineHeight: 1.8, marginBottom: 40 }}>
            Each order includes an English card explaining the object&rsquo;s origin, its maker and — where
            it applies — its consecration certificate number. If anything is unclear when it arrives,
            write to us and a person will answer.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link className="btn btn-outline" href="/objects">
              Back to the collection
            </Link>
            <Link className="btn btn-solid" href="/classics">
              Read the Dao De Jing
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
