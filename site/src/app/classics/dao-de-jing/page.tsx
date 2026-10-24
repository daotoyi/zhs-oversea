import type { Metadata } from 'next';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { getNavStrings, getFooterStrings, getUi } from '@/lib/i18n';
import { CHAPTERS } from '@/data/chapters';
import { UI_ZH } from '@/lib/i18n/zh-hans';
import { toTraditional } from '@/lib/i18n/convert';

export const metadata: Metadata = {
  title: 'The Dao De Jing — 81 chapters',
  description:
    'The Mawangdui silk manuscript of the Dao De Jing, translated into English chapter by chapter, with commentary and a weekly practice.',
  alternates: { canonical: '/classics/dao-de-jing' },
};

export default async function DaoDeJingIndex() {
  const { locale, t } = await getUi();
  const navStrings = await getNavStrings();
  const footerStrings = await getFooterStrings();

  const TRANSLATED = Object.keys(CHAPTERS).map(Number).sort((a, b) => a - b);
  const h = UI_ZH.classicsPage;
  const Z = (s: string) => (locale === 'en' ? s : toTraditional(s));

  return (
    <>
      <Nav strings={navStrings} />
      <section className="sec" style={{ paddingTop: 56 }}>
        <div className="wrap">
          <Link href="/classics" className="eyebrow" style={{ display: 'inline-block', marginBottom: 28 }}>
            {t('← The Classics', h.backToClassics)}
          </Link>
          <h1 className="serif" style={{ fontWeight: 300, fontSize: 'clamp(2rem, 4.4vw, 3.2rem)', lineHeight: 1.1, marginBottom: 18 }}>
            {t('The Dao De Jing', '《德道经》')}
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ash)', maxWidth: 560, lineHeight: 1.8, marginBottom: 48 }}>
            {t(
              `Eighty-one chapters from the Mawangdui silk manuscript. ${TRANSLATED.length} chapters are published so far; the rest follow monthly. Each carries the text, a reading, and a practice for the week.`,
              `八十一章，皆自马王堆帛书出。已刊 ${TRANSLATED.length} 章，其余按月续出。每章含原文、读法与本周功课。`
            )}
          </p>

          <div className="chapter-grid">
            {Array.from({ length: 81 }, (_, i) => i + 1).map((n) => {
              const live = TRANSLATED.includes(n);
              return live ? (
                <Link key={n} href={`/classics/dao-de-jing/${n}`} className="chapter-cell">
                  <span className="chapter-n">{String(n).padStart(2, '0')}</span>
                  <span className="chapter-title serif">{t(`Read chapter ${n}`, `读第${n}章`)}</span>
                </Link>
              ) : (
                <div key={n} className="chapter-cell disabled">
                  <span className="chapter-n">{String(n).padStart(2, '0')}</span>
                  <span className="chapter-title serif" style={{ opacity: 0.35 }}>
                    {t('Forthcoming', h.forthcoming)}
                  </span>
                </div>
              );
            })}
          </div>
          <p style={{ marginTop: 24, fontSize: 12.5, color: 'var(--ash)' }}>{Z(h.monthlyNote)}</p>
        </div>
      </section>
      <Footer strings={footerStrings} />
    </>
  );
}
