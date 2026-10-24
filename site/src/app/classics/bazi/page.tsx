import type { Metadata } from 'next';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { getNavStrings, getFooterStrings, getTrustItems, getUi } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'The Four Pillars — an introduction',
  description:
    'A forty-part introduction to BaZi: the ten heavenly stems, twelve earthly branches, how a chart is built, and what the ten gods mean.',
  alternates: { canonical: '/classics/bazi' },
};

const PARTS = [
  { n: 1, title: 'What a chart actually is', zh: '四柱' },
  { n: 2, title: 'The ten heavenly stems', zh: '十天干' },
  { n: 3, title: 'The twelve earthly branches', zh: '十二地支' },
  { n: 4, title: 'Why four pillars and not three', zh: '四柱之由' },
  { n: 5, title: 'The five elements and their cycles', zh: '五行生克' },
  { n: 6, title: 'Reading the day stem first', zh: '日元' },
  { n: 7, title: 'The ten gods', zh: '十神' },
  { n: 8, title: 'Strength, and what it is not', zh: '旺衰' },
  { n: 9, title: 'The luck pillars', zh: '大运' },
  { n: 10, title: 'What the system cannot tell you', zh: '所不能' },
];

export default async function BaziPage() {
  const { locale, t } = await getUi();
  const navStrings = await getNavStrings();
  const footerStrings = await getFooterStrings();
  return (
    <>
      <Nav strings={navStrings} />
      <section className="sec" style={{ paddingTop: 56 }}>
        <div className="wrap">
          <Link href="/classics" className="eyebrow" style={{ display: 'inline-block', marginBottom: 28 }}>
            ← The Classics
          </Link>
          <h1 className="serif" style={{ fontWeight: 300, fontSize: 'clamp(2rem, 4.4vw, 3.2rem)', lineHeight: 1.1, marginBottom: 18 }}>
            The Four Pillars
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ash)', maxWidth: 600, lineHeight: 1.8, marginBottom: 20 }}>
            A forty-part introduction to the system: the ten heavenly stems and twelve earthly branches,
            how a chart is built from a birth date and hour, and what the ten gods mean when they appear.
            Written for readers who have never seen a chart before.
          </p>
          <p style={{ fontSize: 13.5, color: 'var(--ash)', maxWidth: 600, lineHeight: 1.8, marginBottom: 48 }}>
            We publish the system as a subject of study. We do not sell readings, and we do not claim
            that a chart determines what a person will do.
          </p>

          <div className="chapter-grid">
            {PARTS.map((p) => (
              <div key={p.n} className="chapter-cell">
                <span className="chapter-n">{String(p.n).padStart(2, '0')}</span>
                <span className="chapter-title serif">{p.title}</span>
                <span className="chapter-zh cjk">{p.zh}</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 24, fontSize: 12.5, color: 'var(--ash)' }}>
            Full text publishing monthly. Members receive each part as it is written.
          </p>
        </div>
      </section>
      <Footer strings={footerStrings} />
    </>
  );
}
