/**
 * 多语言配置
 *
 * 支持语种：
 *   en      英语（默认，站点主语言）
 *   zh-Hant  繁體中文（台湾/香港，由简体经 OpenCC s2twp 转换，含台湾用语）
 *   zh-Hans  简体中文
 *
 * 语种通过 Cookie `NEXT_LOCALE` 持久化，服务端读取，无需 URL 前缀。
 * 换语种即时生效（整页刷新），不改变当前 URL。
 */

export const LOCALES = ['en', 'zh-Hant', 'zh-Hans'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_META: Record<Locale, { label: string; short: string; htmlLang: string; flag: string }> = {
  en: { label: 'English', short: 'EN', htmlLang: 'en', flag: 'EN' },
  'zh-Hant': { label: '繁體中文', short: '繁', htmlLang: 'zh-Hant', flag: '繁' },
  'zh-Hans': { label: '简体中文', short: '简', htmlLang: 'zh-Hans', flag: '简' },
};

export const LOCALE_COOKIE = 'NEXT_LOCALE';

export function isLocale(v: unknown): v is Locale {
  return typeof v === 'string' && (LOCALES as readonly string[]).includes(v);
}
