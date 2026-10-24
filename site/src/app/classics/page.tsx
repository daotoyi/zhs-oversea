import type { Metadata } from 'next';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'The Classics',
  description:
    'The Mawangdui silk Dao De Jing in 81 chapters, the sixty-four hexagrams of the Yijing, and the Four Pillars of Destiny.',
  alternates: { canonical: '/classics' },
};

const CHAPTERS = [
  { n: 1, zh: '道可道', title: 'The Way That Can Be Spoken' },
  { n: 2, zh: '天下皆知美之为美', title: 'Everyone Knows Beauty' },
  { n: 3, zh: '道冲而用之或不盈', title: 'The Vessel That Is Never Full' },
  { n: 8, zh: '上善若水', title: 'The Highest Good Is Like Water' },
  { n: 12, zh: '道法自然', title: 'The Way of the Sage in the World' },
  { n: 16, zh: '致虚极也', title: 'Reaching the Utmost Emptiness' },
  { n: 25, zh: '人法地', title: 'Man Takes His Law from the Earth' },
  { n: 33, zh: '知人者智', title: 'Knowing Others Is Wisdom' },
  { n: 41, zh: '上善若水', title: 'The Best Person Is Like Water' },
  { n: 64, zh: '慎终如始', title: 'Be Careful to the End as at the Beginning' },
];

const HEXAGRAMS = [
  ['☰', '乾', 'The Creative', 'Qian'],
  ['☷', '坤', 'The Receptive', 'Kun'],
  ['☵', '坎', 'The Abysmal', 'Kan'],
  ['☲', '離', 'The Clinging', 'Li'],
  ['☴', '巽', 'The Gentle', 'Xun'],
  ['☶', '艮', 'The Reedy', 'Gen'],
  ['☳', '震', 'The Thunder', 'Zhen'],
  ['☵', '兑', 'The Joyous', 'Dui'],
];

export default function ClassicsPage() {
  return (
    <>
      <Nav />
      <section className="sec" style={{ paddingTop: 64 }}>
        <div className="wrap">
          <div className="eyebrow" style={{ marginBottom: 18 }}>
            Classics · 道之法
          </div>
          <h1
            className="serif"
            style={{ fontWeight: 300, fontSize: 'clamp(2.2rem, 4.4vw, 3.4rem)', lineHeight: 1.1, marginBottom: 22 }}
          >
            The text, chapter<br />
            <em>by chapter.</em>
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ash)', maxWidth: 560, lineHeight: 1.8, marginBottom: 56 }}>
            Eighty-one chapters from the Mawangdui silk manuscript, translated into English and read
            against the life that follows them. Each chapter carries the objects that hold the same
            idea.
          </p>

          {/* ── 德道经 ── */}
          <div className="cls-block">
            <div className="cls-head">
              <h2 className="serif">The Dao De Jing</h2>
              <span className="cls-meta">帛书德道经 · 81 chapters</span>
            </div>
            <div className="chapter-grid">
              {CHAPTERS.map((c) => (
                <Link key={c.n} href={`/classics/dao-de-jing/${c.n}`} className="chapter-cell">
                  <span className="chapter-n">{String(c.n).padStart(2, '0')}</span>
                  <span className="chapter-title serif">{c.title}</span>
                  <span className="chapter-zh cjk">{c.zh}</span>
                </Link>
              ))}
            </div>
            <p style={{ marginTop: 20 }}>
              <Link className="link-more" href="/classics/dao-de-jing">
                All 81 chapters →
              </Link>
            </p>
          </div>

          {/* ── 易经 ── */}
          <div className="cls-block">
            <div className="cls-head">
              <h2 className="serif">The Sixty-Four Hexagrams</h2>
              <span className="cls-meta">周易六十四卦 · Yijing</span>
            </div>
            <div className="hex-grid">
              {HEXAGRAMS.map(([symbol, zh, en, pinyin]) => (
                <Link key={pinyin} href={`/classics/yijing/${pinyin.toLowerCase()}`} className="hex-cell">
                  <span className="hex-symbol">{symbol}</span>
                  <span className="hex-zh cjk">{zh}</span>
                  <span className="hex-en serif">{en}</span>
                </Link>
              ))}
            </div>
            <p style={{ marginTop: 20 }}>
              <Link className="link-more" href="/classics/yijing">
                All 64 hexagrams →
              </Link>
            </p>
          </div>

          {/* ── 八字 ── */}
          <div className="cls-block">
            <div className="cls-head">
              <h2 className="serif">The Four Pillars</h2>
              <span className="cls-meta">四柱八字 · BaZi</span>
            </div>
            <p style={{ fontSize: 14, color: 'var(--ash)', lineHeight: 1.8, maxWidth: 560, marginBottom: 20 }}>
              A forty-part introduction to the system: the ten heavenly stems and twelve earthly
              branches, how a chart is built from a birth date and hour, and what the ten gods mean
              when they appear. Written for readers who have never seen a chart before.
            </p>
            <Link className="link-more" href="/classics/bazi">
              Start reading →
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
