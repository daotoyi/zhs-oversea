import { Converter } from 'opencc-js';
/** opencc-js 的主类型从 opencc-js 顶层导出 */
type ConverterFunction = (text: string) => string;
import type { Locale } from './config';

/**
 * 繁简转换 —— 简体 → 繁體（台湾正体 + 台湾用语）
 *
 * 用 OpenCC 的 s2twp（Simplified → Traditional Chinese (Taiwan, with phrases)），
 * 它会处理台湾特有词汇，例如：
 *   软件 → 軟體、信息 → 資訊、网络 → 網路、里面 → 裡面、发展 → 發展
 *
 * 转换结果按字符串 memoize，避免重复转换同一段内容。
 */

const cache = new Map<string, string>();
let converter: ConverterFunction | null = null;

function getConverter(): ConverterFunction {
  if (!converter) {
    converter = Converter({ from: 'cn', to: 'twp' });
  }
  return converter;
}

export function toTraditional(text: string): string {
  if (!text) return text;
  const cached = cache.get(text);
  if (cached !== undefined) return cached;

  const converted = getConverter()(text);
  cache.set(text, converted);
  return converted;
}

/** 数组批量转换 */
export function toTraditionalArray(items: string[]): string[] {
  return items.map(toTraditional);
}

/**
 * 按语种取中文文案。
 * 简体直接返回；繁體经 OpenCC 转换；英文返回 undefined（由调用方用英文原文）。
 */
export function localizeZh(hans: string | undefined, locale: Locale): string | undefined {
  if (hans === undefined) return undefined;
  if (locale === 'zh-Hant') return toTraditional(hans);
  return hans;
}
