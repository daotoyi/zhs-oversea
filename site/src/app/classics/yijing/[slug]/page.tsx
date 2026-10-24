import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Nav } from '@/components/Nav';
import { HEXAGRAMS } from '@/data/hexagrams';
import { Footer } from '@/components/Footer';

export const dynamic = 'force-static';


export function generateStaticParams() {
  return Object.keys(HEXAGRAMS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const h = HEXAGRAMS[slug];
  if (!h) return { title: 'Hexagram not found' };
  return {
    title: `${h.en} — Hexagram ${h.zh}`,
    description: `${h.en} (${h.zh}), ${h.image}. Reading the hexagram from the classical commentary.`,
    alternates: { canonical: `/classics/yijing/${slug}` },
  };
}

export default async function HexagramPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const h = HEXAGRAMS[slug];
  if (!h) notFound();

  return (
    <>
      <Nav />
      <article className="sec" style={{ paddingTop: 56 }}>
        <div className="wrap" style={{ maxWidth: 760 }}>
          <Link href="/classics/yijing" className="eyebrow" style={{ display: 'inline-block', marginBottom: 28 }}>
            ← The Sixty-Four Hexagrams
          </Link>
          <div className="hex-symbol" style={{ fontSize: 48, marginBottom: 22 }}>
            {h.symbol}
          </div>
          <h1 className="serif" style={{ fontWeight: 300, fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.12, marginBottom: 10 }}>
            {h.en}
          </h1>
          <div className="cjk" style={{ fontSize: 16, color: 'var(--ash)', letterSpacing: '0.16em', marginBottom: 8 }}>
            {h.zh}
          </div>
          <div className="eyebrow" style={{ marginBottom: 40 }}>
            {h.image}
          </div>
          <p style={{ fontSize: 15.5, lineHeight: 1.85, color: '#3A352E' }}>{h.reading}</p>
        </div>
      </article>
      <Footer />
    </>
  );
}
