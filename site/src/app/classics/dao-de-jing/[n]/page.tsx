import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { getNavStrings, getFooterStrings, getUi, localizeChapter } from '@/lib/i18n';
import { CHAPTERS } from '@/data/chapters';
import { UI_ZH } from '@/lib/i18n/zh-hans';
import { toTraditional } from '@/lib/i18n/convert';

export function generateStaticParams() {
  return Object.keys(CHAPTERS).map((n) => ({ n }));
}

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }): Promise<Metadata> {
  const { n } = await params;
  const chapter = CHAPTERS[Number(n)];
  if (!chapter) return { title: 'Chapter not found' };
  return {
    title: `Dao De Jing Chapter ${n} — ${chapter.title}`,
    description: `Chapter ${n} of the Mawangdui silk Dao De Jing: ${chapter.zh}. English text, commentary and a weekly practice.`,
    alternates: { canonical: `/classics/dao-de-jing/${n}` },
  };
}

export default async function ChapterPage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const num = Number(n);
  const base = CHAPTERS[num];
  if (!base) notFound();

  const { locale, t } = await getUi();
  const navStrings = await getNavStrings();
  const footerStrings = await getFooterStrings();
  const chapter = await localizeChapter(base, num);
  const h = UI_ZH.classicsPage;
  const Z = (s: string) => (locale === 'en' ? s : toTraditional(s));

  const numbers = Object.keys(CHAPTERS).map(Number).sort((a, b) => a - b);
  const idx = numbers.indexOf(num);
  const prev = idx > 0 ? numbers[idx - 1] : null;
  const next = idx >= 0 && idx < numbers.length - 1 ? numbers[idx + 1] : null;

  return (
    <>
      <Nav strings={navStrings} />
      <article className="sec" style={{ paddingTop: 56 }}>
        <div className="wrap" style={{ maxWidth: 760 }}>
          <Link href="/classics/dao-de-jing" className="eyebrow" style={{ display: 'inline-block', marginBottom: 28 }}>
            {t('← The Dao De Jing', h.backToDaoDeJing)}
          </Link>
          <div className="eyebrow" style={{ color: 'var(--cinnabar)', marginBottom: 14 }}>
            {t(`Chapter ${num}`, `第${num}章`)}
          </div>
          <h1 className="serif" style={{ fontWeight: 300, fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.12, marginBottom: 10 }}>
            {chapter.title}
          </h1>
          <div className="cjk" style={{ fontSize: 16, color: 'var(--ash)', letterSpacing: '0.16em', marginBottom: 40 }}>
            {chapter.zh}
          </div>

          <blockquote className="chapter-quote">{chapter.text}</blockquote>

          <h2 className="serif" style={{ fontWeight: 400, fontSize: 24, margin: '40px 0 14px' }}>
            {t('Reading it', h.readingHeading)}
          </h2>
          <p style={{ fontSize: 15.5, lineHeight: 1.85, color: '#3A352E' }}>{chapter.note}</p>

          <div className="practice-box">
            <div className="eyebrow" style={{ marginBottom: 10 }}>
              {t('Practice for the week', h.practiceHeading)}
            </div>
            <p style={{ fontFamily: 'var(--serif)', fontSize: 19, lineHeight: 1.6 }}>{chapter.practice}</p>
          </div>

          <div className="chapter-nav">
            {prev ? (
              <Link href={`/classics/dao-de-jing/${prev}`}>{t(`← Chapter ${prev}`, `← 第${prev}章`)}</Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link href={`/classics/dao-de-jing/${next}`}>{t(`Chapter ${next} →`, `第${next}章 →`)}</Link>
            ) : (
              <span />
            )}
          </div>
        </div>
      </article>
      <Footer strings={footerStrings} />
    </>
  );
}
