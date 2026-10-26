import type { Metadata } from 'next';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { getNavStrings, getFooterStrings, getUi, localizePost } from '@/lib/i18n';
import { POSTS } from '@/data/posts';
import { UI_ZH } from '@/lib/i18n/zh-hans';

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getUi();
  return {
    title: locale === 'en' ? 'Journal' : '札记',
  description:
    'Reading the Way in ordinary life — manuscripts, materials, and the daily practice of a Beijing studio.',
  alternates: { canonical: '/journal' },
  }
}

export default async function JournalPage() {
  const { t } = await getUi();
  const navStrings = await getNavStrings();
  const footerStrings = await getFooterStrings();

  const slugs = Object.keys(POSTS);
  const entries = await Promise.all(slugs.map(async (slug) => ({ ...(await localizePost(POSTS[slug], slug)), slug })));
  const h = UI_ZH.journalPage;

  return (
    <>
      <Nav strings={navStrings} />
      <section className="sec" style={{ paddingTop: 64, paddingBottom: 48 }}>
        <div className="wrap">
          <div className="eyebrow" style={{ marginBottom: 18 }}>{t('The beauty of the Way · Journal', h.eyebrow)}</div>
          <h1 className="serif" style={{ fontWeight: 300, fontSize: 'clamp(2.2rem, 4.4vw, 3.4rem)', lineHeight: 1.1, marginBottom: 22 }}>
            {t('Reading the Way', '在寻常日子里')}
            <br />
            <em>{t('in ordinary life.', '读道。')}</em>
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ash)', maxWidth: 540, lineHeight: 1.8 }}>
            {t('On early manuscripts, materials, and the daily practice of a studio at it for fifteen years.', h.lead)}
          </p>
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
                  {e.category} · {t(`${e.minutes} min`, `${e.minutes} 分钟`)}
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
