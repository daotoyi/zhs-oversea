import type { Metadata } from 'next';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { getProducts } from '@/lib/products';
import { formatUsd } from '@/lib/shipping';

export const metadata: Metadata = {
  title: 'Practice — study sessions & membership',
  description:
    'The Sunday hexagram, the weekly study sessions in Beijing, and the membership that brings both to you.',
  alternates: { canonical: '/practice' },
};

export default function PracticePage() {
  const objects = getProducts().slice(0, 3);

  return (
    <>
      <Nav />
      <section className="sec" style={{ paddingTop: 64 }}>
        <div className="wrap">
          <div className="eyebrow" style={{ marginBottom: 18 }}>
            Practice · 道之术
          </div>
          <h1
            className="serif"
            style={{ fontWeight: 300, fontSize: 'clamp(2.2rem, 4.4vw, 3.4rem)', lineHeight: 1.1, marginBottom: 22 }}
          >
            A chapter a week,<br />
            <em>and a way to keep it.</em>
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ash)', maxWidth: 560, lineHeight: 1.8, marginBottom: 52 }}>
            Reading the <em>Dao De Jing</em> once and putting it down is the usual outcome. What follows
            is the part that keeps it: a weekly reading, a session you can attend, and objects chosen
            to make the practice easier to hold onto.
          </p>

          <div className="plan-grid">
            <div className="plan-card">
              <div className="plan-price">
                <span className="serif">$19</span>
                <span className="plan-per">/ month</span>
              </div>
              <h2 className="serif">Membership</h2>
              <ul>
                <li>The Sunday hexagram, with commentary</li>
                <li>All 81 chapters in full English translation</li>
                <li>Chapter commentaries ahead of publication</li>
                <li>First access to limited objects</li>
                <li>Members&rsquo; price on every ritual object</li>
              </ul>
              <p className="plan-note">$169 a year. Cancel whenever.</p>
              <button className="btn btn-outline" style={{ width: '100%' }} type="button">
                Join the membership
              </button>
              <p className="plan-foot">
                Membership is a digital product and is billed through our merchant-of-record
                checkout, so tax is handled for you wherever you are.
              </p>
            </div>

            <div className="plan-card">
              <div className="plan-price">
                <span className="serif">Free</span>
              </div>
              <h2 className="serif">The Sunday hexagram</h2>
              <ul>
                <li>One hexagram a week, with a short commentary</li>
                <li>One object that carries the same idea</li>
                <li>No card required</li>
              </ul>
              <div className="sub-input" style={{ borderColor: 'var(--rule)', marginTop: 20 }}>
                <input type="email" placeholder="your@email.com" aria-label="Email address" />
                <button type="button">Subscribe</button>
              </div>
            </div>

            <div className="plan-card">
              <div className="plan-price">
                <span className="serif">$39</span>
                <span className="plan-per">/ session</span>
              </div>
              <h2 className="serif">Study sessions</h2>
              <ul>
                <li>Tuesday evenings, online — the silk <em>Dao De Jing</em>, with Liang Kun</li>
                <li>Sundays, online — Chinese characters and calligraphy, with Zhang Hong</li>
                <li>Wednesday and Saturday, in person at our Tongzhou studio</li>
                <li>Open to any level — you do not need to read any Chinese</li>
              </ul>
              <p className="plan-foot">
                Sessions are held live and recorded. We do not offer one-to-one paid readings: fortune
                telling for payment is restricted by law in several US states, and we are not licensed
                there.
              </p>
            </div>
          </div>

          <div style={{ marginTop: 80 }}>
            <div className="eyebrow" style={{ marginBottom: 22 }}>
              Objects for this practice
            </div>
            <div className="obj-grid">
              {objects.map((p) => (
                <Link key={p.slug} className="obj-card" href={`/objects/${p.slug}`}>
                  <div className="obj-media">
                    <img src={p.images[0]} alt={p.title} />
                    <span className="obj-price">from {formatUsd(p.priceUsd)}</span>
                  </div>
                  <div className="obj-body">
                    <div className="obj-cat">{p.titleZh}</div>
                    <h3 className="obj-name">{p.title}</h3>
                    <p className="obj-desc">{p.tagline}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
