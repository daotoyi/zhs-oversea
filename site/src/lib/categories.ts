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

export function isCategoryKey(v: unknown): v is CategoryKey {
  return typeof v === 'string' && (CATEGORY_KEYS as readonly string[]).includes(v);
}

/**
 * 品类显示名 —— 按语种。
 * 未登记的 key 回退为 key 本身（英文），保证不会渲染成空白。
 */
export function categoryLabel(category: string, locale: Locale): string {
  const key = isCategoryKey(category) ? category : null;
  if (!key) return category;
  if (locale === 'en') return CATEGORY_EN[key];
  if (locale === 'zh-Hant') return toTraditional(CATEGORY_ZH[key]);
  return CATEGORY_ZH[key];
}

/** 品类下拉选项（[{ value, label }]），供后台表单使用 */
export function categoryOptions(locale: Locale): { value: CategoryKey; label: string }[] {
  return CATEGORY_KEYS.map((key) => ({ value: key, label: categoryLabel(key, locale) }));
}
