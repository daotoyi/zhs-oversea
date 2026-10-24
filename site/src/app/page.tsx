import Link from 'next/link';
import { getProducts } from '@/lib/products';
import { formatUsd } from '@/lib/shipping';
import { Footer } from '@/components/Footer';
import { Nav } from '@/components/Nav';
import { TrustBar } from '@/components/TrustBar';
import { getNavStrings, getFooterStrings, getUi, localizeProduct } from '@/lib/i18n';
import { UI_ZH } from '@/lib/i18n/zh-hans';
import { toTraditional } from '@/lib/i18n/convert';

const CATEGORY_EN: Record<string, string> = {
  'tea-ware': 'Tea ware',
  'incense-ritual': 'Incense & ritual',
  'writing-desk': 'Writing & desk',
  'talisman-objects': 'Talisman objects',
  'home-altar': 'Home & altar',
  books: 'Books',
};

const CATEGORY_ZH: Record<string, string> = {
  'tea-ware': UI_ZH.objectsPage.catTea,
  'incense-ritual': UI_ZH.objectsPage.catIncense,
  'writing-desk': UI_ZH.objectsPage.catWriting,
  'talisman-objects': UI_ZH.objectsPage.catTalisman,
  'home-altar': UI_ZH.objectsPage.catHome,
  books: UI_ZH.objectsPage.catBooks,
};

export default async function HomePage() {
  const { locale, t } = await getUi();
  const navStrings = await getNavStrings();
  const footerStrings = await getFooterStrings();
  const products = await Promise.all(getProducts().slice(0, 6).map(localizeProduct));
  const h = UI_ZH.home;

  const catLabel = (cat: string) =>
    locale === 'en' ? CATEGORY_EN[cat] : toTraditional(CATEGORY_ZH[cat]);

  const hexRows: [string, string, string][] = [
    ['☰', 'The Creative', '乾'],
    ['☷', 'The Receptive', '坤'],
    ['☵', 'The Abysmal', '坎'],
    ['☲', 'The Clinging', '離'],
    ['☴', 'The Gentle', '巽'],
    ['☶', 'The Reedy', '艮'],
  ];
  const hexRowsZh: [string, string, string][] = [
    ['☰', '乾 · 健', '乾'],
    ['☷', '坤 · 顺', '坤'],
    ['☵', '坎 · 陷', '坎'],
    ['☲', '離 · 麗', '離'],
    ['☴', '巽 · 逊', '巽'],
    ['☶', '艮 · 止', '艮'],
  ];
  const rows = locale === 'en' ? hexRows : hexRowsZh;

  const trust =
    locale === 'en'
      ? [
          { title: 'Traced consecration', desc: 'Every ritual object ships with a certificate number and the name of its lineage.' },
          { title: 'Certified materials', desc: 'ISO 17025 lab reports for heavy metals. CITES status declared on every wooden piece.' },
          { title: 'Free US shipping over $60', desc: 'Shipped from Beijing, 7–15 days. Duties and taxes settled at checkout.' },
          { title: '30-day returns', desc: 'Unworn, unused, and in its original packaging — no questions asked.' },
        ]
      : UI_ZH.trust.map((x) => ({ title: toTraditional(x.title), desc: toTraditional(x.desc) }));

  const traceCells =
    locale === 'en'
      ? [
          { k: 'Laboratory', v: 'SGS', s: 'ISO/IEC 17025 · heavy metals, EN migration' },
          { k: 'Report number', v: 'SGS-24-1187', s: 'Viewable on the product page before purchase' },
          { k: 'Consecration', v: 'Cert. LHM-0436', s: 'Issued by the Longhu Mountain line' },
          { k: 'CITES status', v: 'Declared', s: 'Appendix II species carry export certificates' },
        ]
      : UI_ZH.home.traceCells.map((c) => ({ k: toTraditional(c.k), v: toTraditional(c.v), s: toTraditional(c.s) }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Zhen He Sheng',
    alternateName: '真和盛',
    url: 'https://zhenhesheng.com',
    description:
      'A Beijing studio working with the Mawangdui silk manuscript tradition. Objects, texts and practice.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'CN',
      addressLocality: 'Beijing',
    },
    sameAs: ['https://zhenhesheng.cn'],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Nav strings={navStrings} />

      {/* ── Hero ── */}
      <header className="hero">
        <div className="hero-bg">
          <img src="/products/lightning-wood.jpg" alt="Lightning-struck jujube wood ritual object" />
        </div>
        <div className="hero-veil" />
        <div className="hero-in">
          <div className="hero-copy">
            <div className="hero-eyebrow">{t('Beijing · the lineage of Longhu Mountain', h.heroEyebrow)}</div>
            <h1>
              {t('Ancient Dao wisdom,', '古老智慧，')}
              <br />
              <em>{t('made tangible.', '落于器物。')}</em>
            </h1>
            <p className="hero-sub">{t(
              'Eighty-one chapters of the <em>Dao De Jing</em> in plain English. Hand-thrown tea ware, ritual incense, and desk objects — each traced to its maker, its material, and its consecration.',
              h.heroSub
            )}</p>
            <div className="hero-cta">
              <Link className="btn btn-solid" href="/objects">
                {t('Explore the collection', h.ctaExplore)}
              </Link>
              <Link className="btn btn-ghost-light" href="/classics">
                {t('Read the Dao De Jing', h.ctaRead)}
              </Link>
            </div>
          </div>
        </div>
        <div className="hero-note">
          <b>{t('Chapter 8', h.heroNoteLabel)}</b>
          {t(
            '“The highest goodness is like water. Water benefits all things and does not contend.”',
            '「上善若水。水善利万物而不争，处众人之所恶，故几于道矣。」'
          )}
        </div>
      </header>

      <section className="trust">
        <div className="wrap trust-grid">
          {trust.map((x) => (
            <div className="trust-item" key={x.title}>
              <div className="trust-ico">{locale === 'en' ? ['☯', '◈', '▤', '↺'][trust.indexOf(x)] : ['☯', '◈', '▤', '↺'][trust.indexOf(x)]}</div>
              <h4>{x.title}</h4>
              <p>{x.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 道之源 ── */}
      <section className="sec origins">
        <div className="wrap origins-grid">
          <div className="origins-media">
            <img src="/products/calligraphy-shangshan.jpg" alt="Calligraphy of the Dao De Jing opening" />
            <div className="origins-tag">
              <span>{t('The source', '本源')}</span>
              <p>
                {t('Not the popular ', '不是通行的')}
                <em>{t('Dao De Jing', '《道德经》')}</em>
                {t('. The ', '，而是')}
                <strong>{t('Mawangdui silk manuscript', '马王堆帛书本')}</strong>
                {t(' — the text Laozi actually wrote down.', '——老子真正写下来的那个本子。')}
              </p>
            </div>
          </div>
          <div className="origins-body">
            <div className="eyebrow">{t('Origins · 道之源', h.originsEyebrow)}</div>
            <h2>
              {t('From a silk manuscript', '一部从墓中取出的')}
              <br />
              {t('found in a tomb.', '丝帛古本。')}
            </h2>
            <p className="lead">{t(
              'In 1973, workers excavating a tomb in Changsha opened a sealed silk scroll untouched for two thousand years. Eighty-one chapters. No rhyme, no polish — the raw text.',
              h.originsP1
            )}</p>
            <p className="lead">{t(
              'Our line of study begins there. Every chapter we teach is read from that manuscript rather than the later, smoother editions the West has read for two centuries.',
              h.originsP2
            )}</p>
            <div className="zh">道 法 自 然 · 天 人 合 一</div>
            <ul className="origins-list">
              {(locale === 'en'
                ? [
                    { k: 'Origin', v: 'Mawangdui silk text, read line by line against the received editions' },
                    { k: 'Lineage', v: 'Longhu Mountain — ancestral home of Daoism, recognised through successive dynasties' },
                    { k: 'Teachers', v: 'Weekly study sessions in Beijing, open to any level' },
                    { k: 'Practice', v: 'Tea, incense, calligraphy and divination as lived disciplines' },
                  ]
                : h.originsItems.map((x) => ({ k: toTraditional(x.k), v: toTraditional(x.v) }))
              ).map((x) => (
                <li key={x.k}>
                  <b>{x.k}</b>
                  <span>{x.v}</span>
                </li>
              ))}
            </ul>
            <Link className="link-more" href="/about">
              {t('Our lineage →', h.originsLink)}
            </Link>
          </div>
        </div>
      </section>

      {/* ── 道之器 ── */}
      <section className="sec" id="objects">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <div className="eyebrow">{t('Objects · 道之器', h.objectsEyebrow)}</div>
              <h2>
                {t('Objects for the', '日课')}
                <br />
                <em>{t('daily practice.', '之器。')}</em>
              </h2>
            </div>
            <div>
              <p className="lead">{t(
                'Tea ware, incense, writing desk and ritual objects — made by named hands, in named workshops, with the material declared. Nothing here is anonymous.',
                h.objectsLead
              )}</p>
              <div style={{ marginTop: 18 }}>
                <Link className="link-more" href="/objects">
                  {t(`View all ${getProducts().length} objects →`, '查看全部器物 →')}
                </Link>
              </div>
            </div>
          </div>

          <div className="obj-grid">
            {products.map((p: (typeof products)[number]) => (
              <Link key={p.slug} className="obj-card" href={`/objects/${p.slug}`}>
                <div className="obj-media">
                  <img src={p.images[0]} alt={p.loc.title} />
                  <span className="obj-price">
                    {t('from ', '起 ')}
                    {formatUsd(p.priceUsd)}
                  </span>
                </div>
                <div className="obj-body">
                  <div className="obj-cat">{catLabel(p.category)}</div>
                  <h3 className="obj-name">{p.loc.title}</h3>
                  <p className="obj-zh">{locale === 'en' ? p.titleZh : p.loc.title === p.title ? p.titleZh : ''}</p>
                  <p className="obj-desc">{p.loc.tagline}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 道之术 ── */}
      <section className="sec practice" id="practice">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <div className="eyebrow">{t('Practice · 道之术', h.practiceEyebrow)}</div>
              <h2>
                {t('Read a chapter.', '读一章，')}
                <br />
                {t('Then live the week.', '过一周。')}
              </h2>
            </div>
            <p className="lead">{t(
              'Every chapter of the <em>Dao De Jing</em> is a prompt, not a lecture. We pair the text with a weekly practice and a set of objects that make it easier to keep.',
              h.practiceLead
            )}</p>
          </div>

          <div className="practice-grid">
            <div className="chapter-card">
              <div className="num">{t('Chapter 12', '第十二章')}</div>
              <h3>{t('The Way of the Sage in the World', '道法自然')}</h3>
              <div className="zh">道 法 自 然</div>
              <blockquote>
                {t(
                  '“The sage manages affairs without doing. He acts without assuming credit for his deeds. He is content with the way things are, without ever being attached to it.”',
                  '「圣人无为而无以为。成功而弗居。不欲见贤也。」'
                )}
              </blockquote>
              <p className="trans">
                {t(
                  'Note the translation is deliberately awkward in places. That is the silk text’s own rhythm: it was written to be read aloud, two thousand years before anyone decided Daoism should sound elegant.',
                  '注意译文有些地方故意生硬——那是帛书自身的节奏：它写出来是念给人听的，比「道家该听起来优雅」这种念头早两千年。'
                )}
              </p>
              <div className="chapter-foot">
                <span>{t('Objects for this chapter · 3', h.chapterFootObjects)}</span>
                <Link href="/classics/dao-de-jing/12">{t('Read chapter 12 →', h.chapterFootRead)}</Link>
              </div>
            </div>

            <div className="practice-side">
              <div>
                <div className="eyebrow" style={{ marginBottom: 14 }}>
                  {t('Also in the Classics', h.alsoInClassics)}
                </div>
                <div className="hex-list">
                  {rows.map(([symbol, name, zhc]) => (
                    <div className="hex-row" key={zhc}>
                      <b>
                        {symbol} {name}
                      </b>
                      <span className="zh">{zhc}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="sub-card">
                <h4>{t('One hexagram, every Sunday.', h.subTitle)}</h4>
                <p>{t(
                  'The classical reading for the week, with a short commentary and one object that carries the same idea. Free, no card required.',
                  h.subDesc
                )}</p>
                <div className="sub-input">
                  <input type="email" placeholder="your@email.com" aria-label="Email address" />
                  <button type="button">{t('Subscribe', h.subButton)}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 溯源 ── */}
      <section className="sec trace" id="traceability">
        <div className="wrap trace-grid">
          <div>
            <div className="eyebrow">{t('Traceability', h.traceEyebrow)}</div>
            <h2>
              {t('How to know', '怎么知道')}
              <br />
              {t('what you’re holding.', '手里这件是什么。')}
            </h2>
            <p className="lead">{t(
              'Most sellers of Daoist objects online will not tell you where the material came from, what the metal contains, or who consecrated it. We publish it on every product page — because this is how you tell handwork from manufacturing.',
              h.traceP1
            )}</p>
            <ul>
              {(locale === 'en'
                ? [
                    'Workshop and maker named, with region of origin',
                    'Material declared in full — species, alloy, finish',
                    'ISO 17025 laboratory report number, viewable',
                    'CITES appendix status stated plainly on wooden and resin pieces',
                    'Consecration certificate number, validatable by lineage',
                  ]
                : h.traceList.map(toTraditional)
              ).map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <Link className="link-more" href="/traceability">
              {t('Read our standards →', h.traceLink)}
            </Link>
          </div>
          <div className="trace-list">
            {traceCells.map((c) => (
              <div className="trace-cell" key={c.k}>
                <div className="k">{c.k}</div>
                <div className="v">
                  {c.v}
                  <small>{c.s}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer strings={footerStrings} />
    </>
  );
}
