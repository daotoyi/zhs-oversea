import type { Metadata } from 'next';
import Link from 'next/link';
import { getStoreProducts } from '@/lib/storefront';
import { formatUsd } from '@/lib/shipping';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { TrustBar } from '@/components/TrustBar';
import { FavoriteHeart } from '@/components/account/FavoriteHeart';
import { accountLabels } from '@/lib/account/ui';
import { viewerFavoriteSlugs } from '@/lib/account/viewer';
import { getNavStrings, getFooterStrings, getTrustItems, getUi, localizeProduct } from '@/lib/i18n';
import { UI_ZH } from '@/lib/i18n/zh-hans';
import { toTraditional } from '@/lib/i18n/convert';

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getUi();
  return {
    title: locale === 'en' ? 'Objects — Dao Culture & Living' : '器物 — 道之器',
  description:
    'Tea ware, incense, writing desk and ritual objects. Made by named hands, in named workshops, with the material declared.',
  alternates: { canonical: '/objects' },
  }
}

const CATEGORY_EN: Record<string, string> = {
  'fortune-charms': 'Fortune charms',
  'heavenly-stems': 'Heavenly stems',
  'three-harmonies': 'Three harmonies',
  'raw-wood': 'Raw wood',
  'writing-desk': 'Writing & desk',
  books: 'Books',
};

const CATEGORY_ZH: Record<string, string> = {
  'fortune-charms': UI_ZH.objectsPage.catFortune,
  'heavenly-stems': UI_ZH.objectsPage.catStems,
  'three-harmonies': UI_ZH.objectsPage.catHarmonies,
  'raw-wood': UI_ZH.objectsPage.catRawWood,
  'writing-desk': UI_ZH.objectsPage.catWriting,
  books: UI_ZH.objectsPage.catBooks,
};

const FILTERS_EN = [
  { key: 'all', label: 'All' },
  { key: 'fortune-charms', label: 'Fortune charms' },
  { key: 'heavenly-stems', label: 'Heavenly stems' },
  { key: 'three-harmonies', label: 'Three harmonies' },
  { key: 'raw-wood', label: 'Raw wood' },
  { key: 'writing-desk', label: 'Writing & desk' },
  { key: 'books', label: 'Books' },
];

const FILTERS_ZH = [
  { key: 'all', label: UI_ZH.objectsPage.filterAll },
  { key: 'fortune-charms', label: UI_ZH.objectsPage.catFortune },
  { key: 'heavenly-stems', label: UI_ZH.objectsPage.catStems },
  { key: 'three-harmonies', label: UI_ZH.objectsPage.catHarmonies },
  { key: 'raw-wood', label: UI_ZH.objectsPage.catRawWood },
  { key: 'writing-desk', label: UI_ZH.objectsPage.catWriting },
  { key: 'books', label: UI_ZH.objectsPage.catBooks },
];

export default async function ObjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const { locale, t } = await getUi();
  const navStrings = await getNavStrings();
  const footerStrings = await getFooterStrings();
  const trust = await getTrustItems();
  const acctLabels = accountLabels(locale);
  const favSlugs = await viewerFavoriteSlugs();

  const all = await Promise.all((await getStoreProducts()).map(localizeProduct));
  const products = category && category !== 'all' ? all.filter((p) => p.category === category) : all;
  // 品类标签按语种：英文用英名；zh-Hant 转繁体；zh-Hans 保持简体（与全站 t()/zh() 约定一致）
  const filters = locale === 'en'
    ? FILTERS_EN
    : FILTERS_ZH.map((f) => ({ ...f, label: locale === 'zh-Hant' ? toTraditional(f.label) : f.label }));
  const catLabel = (cat: string) =>
    locale === 'en'
      ? CATEGORY_EN[cat]
      : locale === 'zh-Hant'
        ? toTraditional(CATEGORY_ZH[cat])
        : CATEGORY_ZH[cat];
  const h = UI_ZH.objectsPage;

  return (
    <>
      <Nav strings={navStrings} />
      <section className="sec" style={{ paddingTop: 72, paddingBottom: 40 }}>
        <div className="wrap">
          <div className="eyebrow" style={{ marginBottom: 18 }}>
            {t('道之器 · Objects', h.eyebrow)}
          </div>
          <h1
            className="serif"
            style={{ fontWeight: 300, fontSize: 'clamp(2.2rem, 4.4vw, 3.4rem)', lineHeight: 1.1, marginBottom: 20 }}
          >
            {t('Objects for the ', '日课')}
            <em>{t('daily practice.', '之器。')}</em>
          </h1>
          <p style={{ fontSize: 14.5, color: 'var(--ash)', maxWidth: 520, lineHeight: 1.75 }}>
            {t(
              'Made by named hands, in named workshops, with the material declared. Every product page carries the traceability record — origin, assay, CITES status, consecration certificate.',
              h.lead
            )}
          </p>
        </div>
      </section>

      <div className="wrap" style={{ paddingBottom: 64 }}>
        <nav className="filter-bar" aria-label="Product categories">
          {filters.map((f) => (
            <Link
              key={f.key}
              href={f.key === 'all' ? '/objects' : `/objects?category=${f.key}`}
              className={`filter-chip${(category ?? 'all') === f.key ? ' on' : ''}`}
            >
              {f.label}
            </Link>
          ))}
        </nav>

        <div className="obj-grid">
          {products.map((p) => (
            <Link key={p.slug} className="obj-card" href={`/objects/${p.slug}`}>
              <div className="obj-media">
                <img src={p.images[0]} alt={p.loc.title} />
                <span className="obj-price">
                  {t('from ', '起 ')}
                  {formatUsd(p.priceUsd)}
                </span>
                <FavoriteHeart slug={p.slug} initial={favSlugs.has(p.slug)} labels={acctLabels} />
                {p.cites.status === 'regulated' && <span className="obj-flag">CITES</span>}
                {p.prop65Warning && <span className="obj-flag prop65">Prop 65</span>}
              </div>
              <div className="obj-body">
                <div className="obj-cat">{catLabel(p.category)}</div>
                <h3 className="obj-name">{p.loc.title}</h3>
                <p className="obj-zh">{p.titleZh}</p>
                <p className="obj-desc">{p.loc.tagline}</p>
              </div>
            </Link>
          ))}
        </div>

        {products.length === 0 && (
          <p style={{ padding: '60px 0', color: 'var(--ash)' }}>{t('No objects in this category yet.', h.empty)}</p>
        )}
      </div>

      <TrustBar items={trust} />
      <Footer strings={footerStrings} />
    </>
  );
}
