import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALE_META, isLocale, type Locale } from './config';

export { LOCALE_META, isLocale, type Locale };

/**
 * 服务端取当前语种（在 Server Component / Route Handler 中调用）
 *
 * 语种存于 Cookie `NEXT_LOCALE`，默认英文。
 * 为什么用 Cookie 而非 URL 前缀：
 *   - 换语种即时生效，URL 不变，用户不会因切语种而丢失当前页面
 *   - 现有静态导出与 SSG 结构无需重构
 *   - 后续若要上 URL 前缀做 SEO，可在 middleware 层再叠加
 */
export async function getLocale(): Promise<Locale> {
  try {
    const store = await cookies();
    const raw = store.get(LOCALE_COOKIE)?.value;
    if (isLocale(raw)) return raw;
  } catch {
    // cookies() 在静态渲染阶段可能不可用，回落默认语种
  }
  return DEFAULT_LOCALE;
}

/** 当前语种的 html lang 值 */
export async function getHtmlLang(): Promise<string> {
  const locale = await getLocale();
  return LOCALE_META[locale].htmlLang;
}
