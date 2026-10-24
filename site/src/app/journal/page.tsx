import type { Metadata } from 'next';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Journal',
  description:
    'Reading the Way in ordinary life — manuscripts, materials, and the daily practice of a Beijing studio.',
  alternates: { canonical: '/journal' },
};

const ENTRIES = [
  {
    slug: 'silk-text-vs-received-version',
    category: 'Manuscripts',
    minutes: 6,
    title: 'Why the silk text is harder — and truer — than the popular version',
    excerpt:
      'The received Dao De Jing was edited into smoothness for two thousand years. That is exactly what makes it less useful.',
    image: '/products/calligraphy-zhixu.jpg',
  },
  {
    slug: 'wu-wei-for-working-people',
    category: 'Practice',
    minutes: 4,
    title: 'What “wu wei” actually asks of a working person',
    excerpt: 'Not passivity. A description of effort that does not waste itself.',
    image: '/products/lightning-wood.jpg',
  },
  {
    slug: 'cinnabar-mercury-safety-report',
    category: 'Materials',
    minutes: 5,
    title: 'Cinnabar, mercury, and how to read a safety report',
    excerpt:
      'Why we seal it in silver, why we do not sell it to wear, and what the assay numbers actually mean.',
    image: '/products/cinnabar-bracelet.jpg',
  },
  {
    slug: 'choosing-a-teapot-that-lasts',
    category: 'Materials',
    minutes: 7,
    title: 'Choosing a teapot that will last twenty years',
    excerpt:
      'Original ore versus a blend, and why an unglazed pot that seasons is worth more than a glazed one that does not.',
    image: '/products/sanhe-wood.jpg',
  },
  {
    slug: 'incense-as-measure-of-time',
    category: 'Practice',
    minutes: 3,
    title: 'Incense was the clock before the clock',
    excerpt: 'One stick, one sitting, one measure of attention.',
    image: '/products/tianguan.jpg',
  },
  {
    slug: 'writing-by-hand-at-work',
    category: 'Practice',
    minutes: 4,
    title: 'Keeping a hand-written practice while working full time',
    excerpt: 'Fifteen minutes a day, and why that is enough.',
    image: '/products/calligraphy-shangshan.jpg',
  },
];

export default function JournalPage() {
  return (
    <>
      <Nav />
      <section className="sec" style={{ paddingTop: 64, paddingBottom: 48 }}>
        <div className="wrap">
          <div className="eyebrow" style={{ marginBottom: 18 }}>
            Journal · 道之美
          </div>
          <h1
            className="serif"
            style={{ fontWeight: 300, fontSize: 'clamp(2.2rem, 4.4vw, 3.4rem)', lineHeight: 1.1, marginBottom: 22 }}
          >
            Reading the Way<br />
            <em>in ordinary life.</em>
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ash)', maxWidth: 540, lineHeight: 1.8 }}>
            On manuscripts, materials, and the daily practice of a studio that has been at this for
            fifteen years.
          </p>
        </div>
      </section>

      <section style={{ paddingBottom: 96 }}>
        <div className="wrap">
          <div className="journal-grid">
            {ENTRIES.map((e) => (
              <Link key={e.slug} href={`/journal/${e.slug}`} className="journal-card">
                <div className="journal-media">
                  <img src={e.image} alt="" />
                </div>
                <div className="journal-meta">
                  {e.category} · {e.minutes} min
                </div>
                <h3 className="serif">{e.title}</h3>
                <p>{e.excerpt}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
