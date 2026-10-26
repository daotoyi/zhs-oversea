import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { getNavStrings, getFooterStrings, getUi } from '@/lib/i18n';
import { CHAPTERS } from '@/data/chapters';
import { CHAPTERS_ZH, zh } from '@/lib/i18n/zh-hans-content';
import { UI_ZH } from '@/lib/i18n/zh-hans';

export function generateStaticParams() {
  return Object.keys(CHAPTERS).map((n) => ({ n }));
}

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }): Promise<Metadata> {
  const { n } = await params;
  const { locale } = await getUi();
  const chapter = CHAPTERS[Number(n)];
  if (!chapter) return { title: 'Chapter not found' };
  const z = CHAPTERS_ZH[Number(n)];
  const title = locale === 'en' ? chapter.title : (z?.title ?? chapter.title);
  return {
    title:
      locale === 'en'
        ? `Dao De Jing Chapter ${n} — ${chapter.title}`
        : `《德道经》第${n}章 — ${title}`,
    description:
      locale === 'en'
        ? `Chapter ${n} of the Mawangdui silk Dao De Jing: ${chapter.zh}. English text, commentary and a weekly practice.`
        : `马王堆帛书《德道经》第${n}章：${chapter.zh}。原文、读法与本周功课。`,
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
  const h = UI_ZH.classicsPage;
  // 双语展示：英文取 CHAPTERS 原文，中文取 CHAPTERS_ZH（zh-Hant 自动转繁体），两语同时显示，
  // 参照六十四卦方案。不走 localizeChapter——它会把英文覆盖成中文。
  const zc = CHAPTERS_ZH[num];
  const zhText = zc?.text ? (zh(zc.text, locale) as string) : null;
  const zhNote = zc?.note ? (zh(zc.note, locale) as string) : null;
  const zhPractice = zc?.practice ? (zh(zc.practice, locale) as string) : null;
  const zhTheme = zc?.title ? (zh(zc.title, locale) as string) : null;

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
          {/* 标题双语：英文主题为主标题，中文主题紧随其下 */}
          <h1 className="serif" style={{ fontWeight: 300, fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.12, marginBottom: 10 }}>
            {base.title}
          </h1>
          <div className="cjk" style={{ fontSize: 20, color: 'var(--ink)', letterSpacing: '0.16em', marginBottom: 40 }}>
            {zhTheme ?? base.zh}
          </div>

          <section className="hex-sec" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
            <h2 className="hex-sec-label">{t('The Text', '原文')}</h2>
            {zhText && <p className="hex-classical cjk">{zhText}</p>}
            <p className="hex-en">{base.text}</p>
          </section>

          <section className="hex-sec">
            <h2 className="hex-sec-label">{t('Reading it', h.readingHeading)}</h2>
            <p style={{ fontSize: 15.5, lineHeight: 1.85, color: '#3A352E' }}>{base.note}</p>
            {zhNote && (
              <p className="cjk" style={{ fontSize: 14.5, lineHeight: 1.9, color: 'var(--ash)', marginTop: 10 }}>
                {zhNote}
              </p>
            )}
          </section>

          <div className="practice-box">
            <div className="eyebrow" style={{ marginBottom: 10 }}>
              {t('Practice for the week', h.practiceHeading)}
            </div>
            <p style={{ fontFamily: 'var(--serif)', fontSize: 19, lineHeight: 1.6 }}>{base.practice}</p>
            {zhPractice && (
              <p className="cjk" style={{ fontFamily: 'var(--serif)', fontSize: 16, lineHeight: 1.8, color: 'var(--ash)', marginTop: 10 }}>
                {zhPractice}
              </p>
            )}
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
