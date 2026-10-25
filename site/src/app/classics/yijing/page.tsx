import type { Metadata } from 'next';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { getNavStrings, getFooterStrings, getUi } from '@/lib/i18n';
import { HEXAGRAMS } from '@/data/hexagrams';
import { HEXAGRAMS_ZH } from '@/lib/i18n/zh-hans-content';
import { toTraditional } from '@/lib/i18n/convert';

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getUi();
  return {
    title: locale === 'en' ? 'The Sixty-Four Hexagrams' : '《周易》六十四卦',
    description:
      locale === 'en'
        ? 'The Yijing book of changes, hexagram by hexagram, with the classical image and reading.'
        : '把《易经》当作活的文本读，逐卦含古典象意与读法。',
    alternates: { canonical: '/classics/yijing' },
  };
}

export default async function YijingIndex() {
  const { locale, t } = await getUi();
  const navStrings = await getNavStrings();
  const footerStrings = await getFooterStrings();
  const keys = Object.keys(HEXAGRAMS);

  return (
    <>
      <Nav strings={navStrings} />
      <section className="sec" style={{ paddingTop: 56 }}>
        <div className="wrap">
          <Link href="/classics" className="eyebrow" style={{ display: 'inline-block', marginBottom: 28 }}>
            {t('← The Classics', '← 经典')}
          </Link>
          <h1 className="serif" style={{ fontWeight: 300, fontSize: 'clamp(2rem, 4.4vw, 3.2rem)', lineHeight: 1.1, marginBottom: 18 }}>
            {t('The Sixty-Four Hexagrams', '《周易》六十四卦')}
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ash)', maxWidth: 560, lineHeight: 1.8, marginBottom: 48 }}>
            {t(
              'The Book of Changes read as a living text rather than a fortune. All sixty-four hexagrams, each with the classical image and a reading.',
              '把《易经》当作活的文本读，而不是当作占卜之书。六十四卦俱全，每卦含古典象意与读法。'
            )}
          </p>
          <div className="hex-grid">
            {keys.map((k) => {
              const h = HEXAGRAMS[k];
              return (
                <Link key={k} href={`/classics/yijing/${k}`} className="hex-cell">
                  <span className="hex-symbol">{h.symbol}</span>
                  <span className="hex-zh cjk">{h.zh}</span>
                  <span className="hex-en serif">{locale === 'en' ? h.en : (HEXAGRAMS_ZH[k]?.en ?? h.en)}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
      <Footer strings={footerStrings} />
    </>
  );
}
