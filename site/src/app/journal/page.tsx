import type { Metadata } from 'next';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { getNavStrings, getFooterStrings, getUi, localizePost } from '@/lib/i18n';
import { POSTS } from '@/data/posts';
import { UI_ZH } from '@/lib/i18n/zh-hans';
import { toTraditional } from '@/lib/i18n/convert';

export const metadata: Metadata = {
  title: 'Journal',
  description:
    'Reading the Way in ordinary life — manuscripts, materials, and the daily practice of a Beijing studio.',
  alternates: { canonical: '/journal' },
};

export default async function JournalPage() {
  const { locale, t } = await getUi();
  const navStrings = await getNavStrings();
  const footerStrings = await getFooterStrings();

  const slugs = Object.keys(POSTS);
  const entries = await Promise.all(slugs.map(async (slug) => ({ ...(await localizePost(POSTS[slug], slug)), slug })));
  const h = UI_ZH.journalPage;
  const Z = (s: string) => (locale === 'en' ? s : toTraditional(s));

  return (
    <>
      <Nav strings={navStrings} />
      <section className="sec" style={{ paddingTop: 64, paddingBottom: 48 }}>
        <div className="wrap">
          <div className="eyebrow" style={{ marginBottom: 18 }}>{t('道之美 · Journal', h.eyebrow)}</div>
          <h1 className="serif" style={{ fontWeight: 300, fontSize: 'clamp(2.2rem, 4.4vw, 3.4rem)', lineHeight: 1.1, marginBottom: 22 }}>
            {t('Reading the Way', '在寻常日子里')}
            <br />
            <em>{t('in ordinary life.', '读道。')}</em>
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ash)', maxWidth: 540, lineHeight: 1.8 }}>{Z(h.lead)}</p>
        </div>
      </section>

      <section style={{ paddingBottom: 96 }}>
        <div className="wrap">
          <div className="journal-grid">
            {entries.map((e) => (
              <Link key={e.slug} href={`/journal/${e.slug}`} className="journal-card">
                <div className="journal-media">
                  <img src={e.image} alt="" />
                </div>
                <div className="journal-meta">
                  {locale === 'en' ? e.category : toTraditional(e.category)} · {e.minutes} min
                </div>
                <h3 className="serif">{e.title}</h3>
                <p>{e.body[0]}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer strings={footerStrings} />
    </>
  );
}
