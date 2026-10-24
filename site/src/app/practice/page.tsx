import type { Metadata } from 'next';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { getNavStrings, getFooterStrings, getUi, localizeProduct } from '@/lib/i18n';
import { getStoreProducts } from '@/lib/storefront';
import { formatUsd } from '@/lib/shipping';
import { UI_ZH } from '@/lib/i18n/zh-hans';
import { toTraditional } from '@/lib/i18n/convert';

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getUi();
  return {
    title: locale === 'en' ? 'Practice — study sessions & membership' : '修习 — 讲论与会员',
  description:
    'The Sunday hexagram, the weekly study sessions in Beijing, and the membership that brings both to you.',
  alternates: { canonical: '/practice' },
  }
}

const MEMBER_EN = [
  'The Sunday hexagram, with commentary',
  'All 81 chapters in full English translation',
  'Chapter commentaries ahead of publication',
  'First access to limited objects',
  'Members’ price on every ritual object',
];

const SESSIONS_EN = [
  'Tuesday evenings, online — the silk <em>Dao De Jing</em>, with Liang Kun',
  'Sundays, online — Chinese characters and calligraphy, with Zhang Hong',
  'Wednesday and Saturday, in person at our Tongzhou studio',
  'Open to any level — you do not need to read any Chinese',
];

export default async function PracticePage() {
  const { locale, t } = await getUi();
  const navStrings = await getNavStrings();
  const footerStrings = await getFooterStrings();
  const objects = await Promise.all((await getStoreProducts()).slice(0, 3).map(localizeProduct));
  const h = UI_ZH.practicePage;
  const Z = (s: string) => (locale === 'en' ? s : toTraditional(s));

  const memberList = locale === 'en' ? MEMBER_EN : h.membershipList ?? MEMBER_EN;
  const sessionList = locale === 'en' ? SESSIONS_EN : h.sessionsList.map(toTraditional);
  const freeList = locale === 'en'
    ? ['One hexagram a week, with a short commentary', 'One object that carries the same idea', 'No card required']
    : h.freeList.map(toTraditional);

  return (
    <>
      <Nav strings={navStrings} />
      <section className="sec" style={{ paddingTop: 64 }}>
        <div className="wrap">
          <div className="eyebrow" style={{ marginBottom: 18 }}>{t('道之术 · Practice', h.eyebrow)}</div>
          <h1 className="serif" style={{ fontWeight: 300, fontSize: 'clamp(2.2rem, 4.4vw, 3.4rem)', lineHeight: 1.1, marginBottom: 22 }}>
            {t('A chapter a week,', '一周一章，')}
            <br />
            <em>{t('and a way to keep it.', '并且守得住。')}</em>
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ash)', maxWidth: 560, lineHeight: 1.8, marginBottom: 52 }}>
            {t(
              'Reading the <em>Dao De Jing</em> once and putting it down is the usual outcome. What follows is the part that keeps it: a weekly reading, a session you can attend, and objects chosen to make the practice easier to hold onto.',
              h.lead
            )}
          </p>

          <div className="plan-grid">
            <div className="plan-card">
              <div className="plan-price">
                <span className="serif">$19</span>
                <span className="plan-per">{t('/ month', h.membershipPer)}</span>
              </div>
              <h2 className="serif">{t('Membership', h.membershipTitle)}</h2>
              <ul>
                {memberList.map((x: string, i: number) => (
                  <li key={i} dangerouslySetInnerHTML={{ __html: Z(x) }} />
                ))}
              </ul>
              <p className="plan-note">{Z(h.membershipNote)}</p>
              <button className="btn btn-outline" style={{ width: '100%' }} type="button">
                {t('Join the membership', '加入会员')}
              </button>
              <p className="plan-foot">{Z(h.membershipFoot)}</p>
            </div>

            <div className="plan-card">
              <div className="plan-price">
                <span className="serif">{t('Free', '免费')}</span>
              </div>
              <h2 className="serif">{t('The Sunday hexagram', h.freeTitle)}</h2>
              <ul>
                {freeList.map((x: string, i: number) => (
                  <li key={i}>{Z(x)}</li>
                ))}
              </ul>
              <div className="sub-input" style={{ borderColor: 'var(--rule)', marginTop: 20 }}>
                <input type="email" placeholder="your@email.com" aria-label="Email address" />
                <button type="button">{t('Subscribe', '订阅')}</button>
              </div>
            </div>

            <div className="plan-card">
              <div className="plan-price">
                <span className="serif">$39</span>
                <span className="plan-per">{t('/ session', h.sessionsPer)}</span>
              </div>
              <h2 className="serif">{t('Study sessions', h.sessionsTitle)}</h2>
              <ul>
                {sessionList.map((x: string, i: number) => (
                  <li key={i} dangerouslySetInnerHTML={{ __html: Z(x) }} />
                ))}
              </ul>
              <p className="plan-foot">{Z(h.sessionsFoot)}</p>
            </div>
          </div>

          <div style={{ marginTop: 80 }}>
            <div className="eyebrow" style={{ marginBottom: 22 }}>
              {t('Objects for this practice', h.objectsEyebrow)}
            </div>
            <div className="obj-grid">
              {objects.map((p) => (
                <Link key={p.slug} className="obj-card" href={`/objects/${p.slug}`}>
                  <div className="obj-media">
                    <img src={p.images[0]} alt={p.loc.title} />
                    <span className="obj-price">
                      {t('from ', '起 ')}
                      {formatUsd(p.priceUsd)}
                    </span>
                  </div>
                  <div className="obj-body">
                    <div className="obj-cat">{p.titleZh}</div>
                    <h3 className="obj-name">{p.loc.title}</h3>
                    <p className="obj-desc">{p.loc.tagline}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
      <Footer strings={footerStrings} />
    </>
  );
}
