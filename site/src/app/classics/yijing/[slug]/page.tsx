import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { getNavStrings, getFooterStrings, getUi, localizeHexagram } from '@/lib/i18n';
import { HEXAGRAMS } from '@/data/hexagrams';
import { HEXAGRAMS_ZH } from '@/lib/i18n/zh-hans-content';
import { toTraditional } from '@/lib/i18n/convert';

export function generateStaticParams() {
  return Object.keys(HEXAGRAMS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { locale } = await getUi();
  const h = HEXAGRAMS[slug];
  if (!h) return { title: 'Hexagram not found' };
  const z = HEXAGRAMS_ZH[slug];
  const name = locale === 'en' ? h.en : (z?.en ?? h.en);
  return {
    title:
      locale === 'en'
        ? `${h.en} — Hexagram ${h.zh}`
        : `${name} — 周易第${h.zh}卦`,
    description:
      locale === 'en'
        ? `${h.en} (${h.zh}), ${h.image}. Reading the hexagram from the classical commentary.`
        : `${name}（${h.zh}），${h.image}。据古典注文读此卦。`,
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
          <div className="eyebrow">{base.image}</div>

          <section className="hex-sec">
            <h2 className="hex-sec-label">{t('Judgement', '卦辞')}</h2>
            <p className="hex-classical cjk">{h.judgement}</p>
            <p className="hex-en">{h.judgementEn}</p>
          </section>

          <section className="hex-sec">
            <h2 className="hex-sec-label">{t('The Image', '象传')}</h2>
            <p className="hex-classical cjk">{h.imageText}</p>
            <p className="hex-en">{h.imageTextEn}</p>
          </section>

          <section className="hex-sec">
            <h2 className="hex-sec-label">{t('The Lines', '爻辞')}</h2>
            {h.lines.map((l, i) => (
              <div className="hex-line" key={`${l.name}-${i}`}>
                <div className="hex-line-pos cjk">{l.name}</div>
                <div className="hex-line-body">
                  <p className="hex-classical cjk">{l.text}</p>
                  <p className="hex-en">{l.textEn}</p>
                  {l.image && <p className="hex-line-img cjk">{l.image}</p>}
                  {l.imageEn && <p className="hex-en hex-line-img-en">{l.imageEn}</p>}
                </div>
              </div>
            ))}
          </section>

          <section className="hex-sec">
            <h2 className="hex-sec-label">{t('Reading', '读法')}</h2>
            <p style={{ fontSize: 15.5, lineHeight: 1.85, color: '#3A352E' }}>{h.reading}</p>
          </section>
        </div>
      </article>
      <Footer strings={footerStrings} />
    </>
  );
}
