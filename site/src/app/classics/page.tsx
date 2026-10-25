import type { Metadata } from 'next';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { getNavStrings, getFooterStrings, getUi } from '@/lib/i18n';
import { CHAPTERS } from '@/data/chapters';
import { CHAPTERS_ZH } from '@/lib/i18n/zh-hans-content';
import { HEXAGRAMS } from '@/data/hexagrams';
import { HEXAGRAMS_ZH } from '@/lib/i18n/zh-hans-content';
import { UI_ZH } from '@/lib/i18n/zh-hans';
import { toTraditional } from '@/lib/i18n/convert';

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getUi();
  return {
    title: locale === 'en' ? 'The Classics' : '经典',
    description:
      locale === 'en'
        ? 'The Mawangdui silk Dao De Jing in 81 chapters, the sixty-four hexagrams of the Yijing, and the Four Pillars of Destiny.'
        : '马王堆帛书《德道经》八十一章、《周易》六十四卦，与四柱八字。',
    alternates: { canonical: '/classics' },
  };
}

export default async function ClassicsPage() {
  const { locale, t } = await getUi();
  const navStrings = await getNavStrings();
  const footerStrings = await getFooterStrings();

  const chapterCount = Object.keys(CHAPTERS).length;
  // 易经预览与道德经预览同规格：取前 8 卦，数据全部来自 HEXAGRAMS 单一来源
  const hexKeys = Object.keys(HEXAGRAMS).slice(0, 8);
  const h = UI_ZH.classicsPage;
  const Z = (s: string) => (locale === 'en' ? s : toTraditional(s));

  const chapters = Object.keys(CHAPTERS).map(Number).sort((a, b) => a - b).slice(0, 10);
  const chapterData = chapters.map((n) => ({ n, ...CHAPTERS[n] }));

  const hexCells = hexKeys.map((k) => {
    const hx = HEXAGRAMS[k];
    const z = HEXAGRAMS_ZH[k];
    return {
      slug: k,
      sym: hx.symbol,
      zh: hx.zh,
      en: locale === 'en' ? hx.en : (z?.en ?? hx.en),
    };
  });

  const parts = [
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
  const partsZh: Record<string, [string, string]> = {
    '1': ['一张盘到底是什么', '四柱'], '2': ['十天干', '十天干'], '3': ['十二地支', '十二地支'],
    '4': ['为何是四柱而非三柱', '四柱之由'], '5': ['五行及其生克', '五行生克'], '6': ['先读日元', '日元'],
    '7': ['十神', '十神'], '8': ['旺衰，以及旺衰不是什么', '旺衰'], '9': ['大运', '大运'],
    '10': ['这套系统不能告诉你什么', '所不能'],
  };

  return (
    <>
      <Nav strings={navStrings} />
      <section className="sec" style={{ paddingTop: 64 }}>
        <div className="wrap">
          <div className="eyebrow" style={{ marginBottom: 18 }}>
            {t('道之法 · Classics', h.eyebrow)}
          </div>
          <h1 className="serif" style={{ fontWeight: 300, fontSize: 'clamp(2.2rem, 4.4vw, 3.4rem)', lineHeight: 1.1, marginBottom: 22 }}>
            {t('The text, chapter', '一章一章')}
            <br />
            <em>{t('by chapter.', '地读。')}</em>
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ash)', maxWidth: 560, lineHeight: 1.8, marginBottom: 56 }}>
            {t(
              'Eighty-one chapters from the Mawangdui silk manuscript, translated into English and read against the life that follows them. Each chapter carries the objects that hold the same idea.',
              h.lead
            )}
          </p>

          {/* 德道经 */}
          <div className="cls-block">
            <div className="cls-head">
              <h2 className="serif">{t('The Dao De Jing', '《德道经》')}</h2>
              <span className="cls-meta">{Z(h.daoDeJingMeta)}</span>
            </div>
            <div className="chapter-grid">
              {chapterData.map((c) => (
                <Link key={c.n} href={`/classics/dao-de-jing/${c.n}`} className="chapter-cell">
                  <span className="chapter-n">{String(c.n).padStart(2, '0')}</span>
                  <span className="chapter-title serif">{locale === 'en' ? c.title : CHAPTERS_ZH[c.n].title}</span>
                  <span className="chapter-zh cjk">{c.zh}</span>
                </Link>
              ))}
            </div>
            <p style={{ marginTop: 20 }}>
              <Link className="link-more" href="/classics/dao-de-jing">
                {t(`All 81 chapters →`, h.allChapters)}
              </Link>
            </p>
          </div>

          {/* 易经 */}
          <div className="cls-block">
            <div className="cls-head">
              <h2 className="serif">{t('The Sixty-Four Hexagrams', '《周易》六十四卦')}</h2>
              <span className="cls-meta">{Z(h.yijingMeta)}</span>
            </div>
            <div className="hex-grid">
              {hexCells.map((x) => (
                <Link key={x.slug} href={`/classics/yijing/${x.slug}`} className="hex-cell">
                  <span className="hex-symbol">{x.sym}</span>
                  <span className="hex-zh cjk">{x.zh}</span>
                  <span className="hex-en serif">{x.en}</span>
                </Link>
              ))}
            </div>
            <p style={{ marginTop: 20 }}>
              <Link className="link-more" href="/classics/yijing">
                {t('All 64 hexagrams →', h.allHexagrams)}
              </Link>
            </p>
          </div>

          {/* 八字 */}
          <div className="cls-block">
            <div className="cls-head">
              <h2 className="serif">{t('The Four Pillars', '四柱八字')}</h2>
              <span className="cls-meta">{Z(h.baziMeta)}</span>
            </div>
            <p style={{ fontSize: 14, color: 'var(--ash)', lineHeight: 1.8, maxWidth: 560, marginBottom: 20 }}>
              {t(
                'A forty-part introduction to the system: the ten heavenly stems and twelve earthly branches, how a chart is built from a birth date and hour, and what the ten gods mean when they appear. Written for readers who have never seen a chart before.',
                h.baziLead
              )}
            </p>
            <div className="chapter-grid" style={{ marginBottom: 20 }}>
              {parts.map((p) => (
                <div key={p.n} className="chapter-cell">
                  <span className="chapter-n">{String(p.n).padStart(2, '0')}</span>
                  <span className="chapter-title serif">{locale === 'en' ? p.title : Z(partsZh[String(p.n)][0])}</span>
                  <span className="chapter-zh cjk">{locale === 'en' ? p.zh : Z(partsZh[String(p.n)][1])}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 13.5, color: 'var(--ash)', lineHeight: 1.8, maxWidth: 560, marginBottom: 20 }}>
              {t(
                'We publish the system as a subject of study. We do not sell readings, and we do not claim that a chart determines what a person will do.',
                h.baziNote
              )}
            </p>
            <Link className="link-more" href="/classics/bazi">
              {t('Start reading →', h.baziStart)}
            </Link>
          </div>
        </div>
      </section>
      <Footer strings={footerStrings} />
    </>
  );
}
