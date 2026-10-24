import { getLocale, type Locale } from './server';
import { UI_ZH } from './zh-hans';
import { zh, PRODUCTS_ZH, CHAPTERS_ZH, HEXAGRAMS_ZH, POSTS_ZH } from './zh-hans-content';
import { toTraditional } from './convert';
import type { Product } from '../types';
import type { Chapter, Hexagram, JournalPost } from '../content-types';

/* ══════════════════════════════════════════════════
   界面文案
   ══════════════════════════════════════════════════ */

export type Ui = typeof UI_ZH;

/**
 * 取界面文案。
 * 英文站以英文原文为准，中文时整体替换为中文文案。
 */
export async function getUi(): Promise<{ locale: Locale; ui: Ui; t: <T>(en: T, hans: T) => T }> {
  const locale = await getLocale();
  return {
    locale,
    ui: UI_ZH,
    t: <T,>(en: T, hans: T): T => (locale === 'en' ? en : (zh(hans, locale) as T)),
  };
}

/* ══════════════════════════════════════════════════
   导航
   ══════════════════════════════════════════════════ */

export async function getNavStrings() {
  const { t } = await getUi();
  return {
    topbar: t(
      'Free US shipping over $60 · Duties included at checkout · 30-day returns · Consecration certificates on every ritual object',
      UI_ZH.topbar
    ),
    brandSub: t('Dao Culture & Living', UI_ZH.nav.brandSub),
    bag: t('Cart', UI_ZH.nav.bag),
    search: t('Search', UI_ZH.common.search),
    contact: t('Contact', UI_ZH.common.contact),
    menu: [
      { href: '/classics', label: t('Classics', UI_ZH.nav.classics) },
      { href: '/objects', label: t('Objects', UI_ZH.nav.objects) },
      { href: '/practice', label: t('Practice', UI_ZH.nav.practice) },
      { href: '/traceability', label: t('Traceability', UI_ZH.nav.traceability) },
      { href: '/journal', label: t('Journal', UI_ZH.nav.journal) },
      { href: '/about', label: t('About', UI_ZH.nav.about) },
    ],
  };
}

/* ══════════════════════════════════════════════════
   商品
   ══════════════════════════════════════════════════ */

export type LocalizedProduct = Product & {
  /** 按当前语种本地化后的字段 */
  loc: {
    title: string;
    tagline: string;
    description: string;
    materials: string[];
    craft: string;
    variantLabels: Record<string, string>;
  };
};

export async function localizeProduct(product: Product): Promise<LocalizedProduct> {
  const locale = await getLocale();
  const z = PRODUCTS_ZH[product.slug];

  const pick = (en: string, hans?: string) => {
    if (!z) return en;
    const v = zh(hans, locale);
    return (v as string | undefined) ?? en;
  };

  const variantLabels: Record<string, string> = {};
  product.variants.forEach((v: { id: string }) => {
    variantLabels[v.id] = pick((v as unknown as { label: string }).label, z?.variants?.[v.id]);
  });

  return {
    ...product,
    loc: {
      title: pick(product.title, z?.title),
      tagline: pick(product.tagline, z?.tagline),
      description: pick(product.description, z?.description),
      materials: z?.materials ? (zh(z.materials, locale) as string[]) : product.materials,
      craft: pick(product.maker.craft, z?.craft),
      variantLabels,
    },
  };
}

/* ══════════════════════════════════════════════════
   经典内容
   ══════════════════════════════════════════════════ */

export async function localizeChapter(chapter: Chapter, n: number): Promise<Chapter> {
  const locale = await getLocale();
  const z = CHAPTERS_ZH[n];
  if (!z) return chapter;
  return {
    ...chapter,
    title: (zh(z.title, locale) as string) ?? chapter.title,
    text: (zh(z.text, locale) as string) ?? chapter.text,
    note: (zh(z.note, locale) as string) ?? chapter.note,
    practice: (zh(z.practice, locale) as string) ?? chapter.practice,
  };
}

export async function localizeHexagram(hex: Hexagram, slug: string): Promise<Hexagram> {
  const locale = await getLocale();
  const z = HEXAGRAMS_ZH[slug];
  if (!z) return hex;
  return {
    ...hex,
    en: (zh(z.en, locale) as string) ?? hex.en,
    reading: (zh(z.reading, locale) as string) ?? hex.reading,
  };
}

export async function localizePost(post: JournalPost, slug: string): Promise<JournalPost> {
  const locale = await getLocale();
  const z = POSTS_ZH[slug];
  if (!z) return post;
  return {
    ...post,
    title: (zh(z.title, locale) as string) ?? post.title,
    body: (zh(z.body, locale) as string[]) ?? post.body,
  };
}

/* ══════════════════════════════════════════════════
   页脚
   ══════════════════════════════════════════════════ */

export async function getFooterStrings() {
  const { t } = await getUi();
  return {
    about: t(
      'A Beijing studio working with the Mawangdui silk manuscript tradition. Objects, texts and practice — carried to wherever someone wants to begin.',
      UI_ZH.footer.about
    ),
    cnLink: t('中文站 zhenhesheng.cn →', UI_ZH.footer.cnLink),
    shopH: t('Shop', UI_ZH.footer.shopH),
    learnH: t('Learn', UI_ZH.footer.learnH),
    supportH: t('Support', UI_ZH.footer.supportH),
    shipping: t('Shipping & duties', UI_ZH.footer.shipping),
    returns: t('Returns', UI_ZH.footer.returns),
    trace: t('Traceability standards', UI_ZH.footer.trace),
    privacyTerms: t('Privacy & terms', UI_ZH.footer.privacyTerms),
    imprint: t('Imprint & legal notice', UI_ZH.footer.imprint),
    copyright: t('© 2026 Zhen He Sheng · Beijing, China · Registered in Hong Kong SAR', UI_ZH.footer.copyright),
    daoDeJing: t('The Dao De Jing', UI_ZH.footer.daoDeJing),
    hexagrams: t('Sixty-four hexagrams', UI_ZH.footer.hexagrams),
    fourPillars: t('Four Pillars', UI_ZH.footer.fourPillars),
    sessions: t('Weekly study sessions', UI_ZH.footer.sessions),
    journal: t('Journal', UI_ZH.footer.journal),
    tea: t('Tea ware', UI_ZH.footer.tea),
    incense: t('Incense & ritual', UI_ZH.footer.incense),
    writing: t('Writing & desk', UI_ZH.footer.writing),
    books: t('Books', UI_ZH.footer.books),
    allObjects: t('All objects', UI_ZH.common.allObjects),
    contact: t('Contact', UI_ZH.common.contact),
  };
}

/* ══════════════════════════════════════════════════
   信任条
   ══════════════════════════════════════════════════ */

export async function getTrustItems() {
  const { locale } = await getUi();
  const icons = ['☯', '◈', '▤', '↺'];
  if (locale === 'en') {
    return [
      { title: 'Traced consecration', desc: 'Every ritual object ships with a certificate number and the name of its lineage.', icon: icons[0] },
      { title: 'Certified materials', desc: 'ISO 17025 lab reports for heavy metals. CITES status declared on every wooden piece.', icon: icons[1] },
      { title: 'Free US shipping over $60', desc: 'Shipped from Beijing, 7–15 days. Duties and taxes settled at checkout.', icon: icons[2] },
      { title: '30-day returns', desc: 'Unworn, unused, and in its original packaging — no questions asked.', icon: icons[3] },
    ];
  }
  return UI_ZH.trust.map((x, i) => ({ title: toTraditional(x.title), desc: toTraditional(x.desc), icon: icons[i] }));
}
