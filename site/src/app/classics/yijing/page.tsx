import type { Metadata } from 'next';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { HEXAGRAMS } from '@/data/hexagrams';

export const metadata: Metadata = {
  title: 'The Sixty-Four Hexagrams',
  description: 'The Yijing book of changes, hexagram by hexagram, with the classical image and reading.',
  alternates: { canonical: '/classics/yijing' },
};

export default function YijingIndex() {
  const keys = Object.keys(HEXAGRAMS);
  return (
    <>
      <Nav />
      <section className="sec" style={{ paddingTop: 56 }}>
        <div className="wrap">
          <Link href="/classics" className="eyebrow" style={{ display: 'inline-block', marginBottom: 28 }}>
            ← The Classics
          </Link>
          <h1 className="serif" style={{ fontWeight: 300, fontSize: 'clamp(2rem, 4.4vw, 3.2rem)', lineHeight: 1.1, marginBottom: 18 }}>
            The Sixty-Four Hexagrams
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ash)', maxWidth: 560, lineHeight: 1.8, marginBottom: 48 }}>
            The Book of Changes read as a living text rather than a fortune. {keys.length} hexagrams are
            published so far; each carries the classical image and a reading.
          </p>
          <div className="hex-grid">
            {keys.map((k) => {
              const h = HEXAGRAMS[k];
              return (
                <Link key={k} href={`/classics/yijing/${k}`} className="hex-cell">
                  <span className="hex-symbol">{h.symbol}</span>
                  <span className="hex-zh cjk">{h.zh}</span>
                  <span className="hex-en serif">{h.en}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
