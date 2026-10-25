/**
 * 商品品类名的唯一数据源
 *
 * 背景：品类名此前散落在 5 处各自硬编码（后台商品管理、后台仪表盘、
 * 前台器物页、首页、商品详情页），中英两套名各写一遍 —— 结果后台恒显中文，
 * 前台各处可能漂移，页面出现中英混排。
 *
 * 本模块把「品类 key → 显示名」集中成一处，并统一按语种取值：
 *   en      → 英文名
 *   zh-Hans → 简体中文
 *   zh-Hant → 繁体（经 OpenCC 转换，与全站约定一致）
 *
 * 品类 key 必须与 lib/types.ts 的 ProductCategory 完全一致，
 * 否则存进去的品类前台筛选（/objects?category=...）匹配不到，商品会从分类里消失。
 */

import { toTraditional } from './i18n/convert';
import { UI_ZH } from './i18n/zh-hans';
import type { Locale } from './i18n/config';

/** 全部品类 key（顺序即展示顺序） */
export const CATEGORY_KEYS = [
  'fortune-charms',
  'heavenly-stems',
  'three-harmonies',
  'raw-wood',
  'writing-desk',
  'books',
] as const;

export type CategoryKey = (typeof CATEGORY_KEYS)[number];

/** 英文名 */
export const CATEGORY_EN: Record<CategoryKey, string> = {
  'fortune-charms': 'Fortune charms',
  'heavenly-stems': 'Heavenly stems',
  'three-harmonies': 'Three harmonies',
  'raw-wood': 'Raw wood',
  'writing-desk': 'Writing & desk',
  books: 'Books',
};

/** 简体中文名 */
export const CATEGORY_ZH: Record<CategoryKey, string> = {
  'fortune-charms': UI_ZH.objectsPage.catFortune,
  'heavenly-stems': UI_ZH.objectsPage.catStems,
  'three-harmonies': UI_ZH.objectsPage.catHarmonies,
  'raw-wood': UI_ZH.objectsPage.catRawWood,
  'writing-desk': UI_ZH.objectsPage.catWriting,
  books: UI_ZH.objectsPage.catBooks,
};

/**
 * 历史品类（v0.0.27 之前的旧分类体系）。
 *
 * 这些品类对应的商品如今都是 archived 状态，但**仍留在库里、仍会在后台商品管理
 * 列表中显示**。若不提供译名，categoryLabel 会回退成英文 slug —— 中文环境下
 * 就会与其它中文品类名并排出现，形成中英混排。
 *
 * 故这里保留它们当年的中文名（与当年前台的品类标签一致）。
 */
export const LEGACY_CATEGORY_EN: Record<string, string> = {
  'tea-ware': 'Tea ware',
  'incense-ritual': 'Incense & ritual',
  'talisman-objects': 'Talisman objects',
  'home-altar': 'Home & altar',
  apparel: 'Apparel',
};

export const LEGACY_CATEGORY_ZH: Record<string, string> = {
  'tea-ware': '茶器',
  'incense-ritual': '香事',
  'talisman-objects': '礼器',
  'home-altar': '居家',
  apparel: '服饰',
};

export function isCategoryKey(v: unknown): v is CategoryKey {
  return typeof v === 'string' && (CATEGORY_KEYS as readonly string[]).includes(v);
}

/**
 * 品类显示名 —— 按语种。
 *
 * 未登记的 key 回退为 key 本身（英文）。**注意**：历史品类已在上面的
 * LEGACY_CATEGORY_* 中登记，故正常的归档商品不会走到这个回退分支。
 */
export function categoryLabel(category: string, locale: Locale): string {
  if (isCategoryKey(category)) {
    if (locale === 'en') return CATEGORY_EN[category];
    if (locale === 'zh-Hant') return toTraditional(CATEGORY_ZH[category]);
    return CATEGORY_ZH[category];
  }
  const legacyZh = LEGACY_CATEGORY_ZH[category];
  if (legacyZh) {
    return locale === 'en' ? LEGACY_CATEGORY_EN[category] : locale === 'zh-Hant' ? toTraditional(legacyZh) : legacyZh;
  }
  // 完全未知的 key：中文环境也退回中文呈现会误导（key 本身是英文），
  // 故统一以「原文 key」呈现，至少不会出现"中文里夹一个英文词"的混排观感。
  return category;
}

/** 品类下拉选项（[{ value, label }]），供后台表单使用 */
export function categoryOptions(locale: Locale): { value: CategoryKey; label: string }[] {
  return CATEGORY_KEYS.map((key) => ({ value: key, label: categoryLabel(key, locale) }));
}
