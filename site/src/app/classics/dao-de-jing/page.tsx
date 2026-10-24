import type { Metadata } from 'next';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { CHAPTERS } from '@/data/chapters';

export const metadata: Metadata = {
  title: 'The Dao De Jing — 81 chapters',
  description:
    'The Mawangdui silk manuscript of the Dao De Jing, translated into English chapter by chapter, with commentary and a weekly practice.',
  alternates: { canonical: '/classics/dao-de-jing' },
};

const TRANSLATED = Object.keys(CHAPTERS).map(Number).sort((a, b) => a - b);

export default function DaoDeJingIndex() {
  return (
    <>
      <Nav />
      <section className="sec" style={{ paddingTop: 56 }}>
        <div className="wrap">
          <Link href="/classics" className="eyebrow" style={{ display: 'inline-block', marginBottom: 28 }}>
            ← The Classics
          </Link>
          <h1 className="serif" style={{ fontWeight: 300, fontSize: 'clamp(2rem, 4.4vw, 3.2rem)', lineHeight: 1.1, marginBottom: 18 }}>
            The Dao De Jing
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ash)', maxWidth: 560, lineHeight: 1.8, marginBottom: 48 }}>
            Eighty-one chapters from the Mawangdui silk manuscript. {TRANSLATED.length} chapters are
            published so far; the rest follow monthly. Each carries the text, a reading, and a practice
            for the week.
          </p>

          <div className="chapter-grid">
            {Array.from({ length: 81 }, (_, i) => i + 1).map((n) => {
              const live = TRANSLATED.includes(n);
              return live ? (
                <Link key={n} href={`/classics/dao-de-jing/${n}`} className="chapter-cell">
                  <span className="chapter-n">{String(n).padStart(2, '0')}</span>
                  <span className="chapter-title serif">Read chapter {n}</span>
                </Link>
              ) : (
                <div key={n} className="chapter-cell disabled">
                  <span className="chapter-n">{String(n).padStart(2, '0')}</span>
                  <span className="chapter-title serif" style={{ opacity: 0.35 }}>
                    Forthcoming
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
