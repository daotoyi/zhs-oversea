import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { CartClient } from '@/components/CartClient';

export const metadata: Metadata = {
  title: 'Your bag',
  description: 'Your Zhen He Sheng order.',
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <>
      <Nav />
      <section className="sec" style={{ paddingTop: 56 }}>
        <div className="wrap">
          <div className="eyebrow" style={{ marginBottom: 16 }}>
            Your bag
          </div>
          <h1
            className="serif"
            style={{ fontWeight: 300, fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.1, marginBottom: 40 }}
          >
            Order
          </h1>
          <CartClient />
        </div>
      </section>
      <Footer />
    </>
  );
}
