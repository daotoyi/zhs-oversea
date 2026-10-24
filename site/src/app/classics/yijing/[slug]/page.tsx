import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { getNavStrings, getFooterStrings, getUi, localizeHexagram } from '@/lib/i18n';
import { HEXAGRAMS } from '@/data/hexagrams';
import { toTraditional } from '@/lib/i18n/convert';

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
  const base = HEXAGRAMS[slug];
  if (!base) notFound();

  const { t } = await getUi();
  const navStrings = await getNavStrings();
  const footerStrings = await getFooterStrings();
  const h = await localizeHexagram(base, slug);

  return (
    <>
      <Nav strings={navStrings} />
      <article className="sec" style={{ paddingTop: 56 }}>
        <div className="wrap" style={{ maxWidth: 760 }}>
          <Link href="/classics/yijing" className="eyebrow" style={{ display: 'inline-block', marginBottom: 28 }}>
            {t('← The Sixty-Four Hexagrams', '← 六十四卦')}
          </Link>
          <div className="hex-symbol" style={{ fontSize: 48, marginBottom: 22 }}>
            {base.symbol}
          </div>
          <h1 className="serif" style={{ fontWeight: 300, fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.12, marginBottom: 10 }}>
            {h.en}
          </h1>
          <div className="cjk" style={{ fontSize: 16, color: 'var(--ash)', letterSpacing: '0.16em', marginBottom: 8 }}>
            {base.zh}
          </div>
          <div className="eyebrow" style={{ marginBottom: 40 }}>{base.image}</div>
          <p style={{ fontSize: 15.5, lineHeight: 1.85, color: '#3A352E' }}>{h.reading}</p>
        </div>
      </article>
      <Footer strings={footerStrings} />
    </>
  );
}
