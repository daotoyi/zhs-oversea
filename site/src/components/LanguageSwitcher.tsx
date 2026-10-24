'use client';

import { useEffect, useRef, useState } from 'react';
import { LOCALES, LOCALE_META, useLocale } from '@/lib/i18n/client';
import { UI_ZH } from '@/lib/i18n/zh-hans';
import { toTraditional } from '@/lib/i18n/convert';

const SWITCHER_ZH = {
  en: { label: 'English', short: 'EN', aria: 'Switch language, current English' },
  'zh-Hant': { label: '繁體中文', short: '繁', aria: '切換語言，目前為繁體中文' },
  'zh-Hans': { label: '简体中文', short: '简', aria: '切换语言，当前为简体中文' },
};

/**
 * 语言切换器 —— 位于页头右上角
 *
 * 交互：点击展开三选一 → 选中即整页刷新生效（服务端读 Cookie 重取数据）
 * 键盘：Esc 关闭；点击组件外关闭；Tab 可遍历
 */
export function LanguageSwitcher() {
  const { locale, setLocale, pending } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const current = SWITCHER_ZH[locale];
  const currentLabel = locale === 'en' ? UI_ZH.nav.brandSub : null; // 占位不用

  return (
    <div className="lang-switch" ref={ref}>
      <button
        type="button"
        className="lang-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={current.aria}
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
      >
        <span className="lang-globe" aria-hidden="true">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3c2.6 2.6 2.6 15.4 0 18M12 3c-2.6 2.6-2.6 15.4 0 18" />
          </svg>
        </span>
        <span className="lang-current">{current.short}</span>
        <span className={`lang-caret${open ? ' up' : ''}`} aria-hidden="true">
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M2.5 4.5L6 8l3.5-3.5" />
          </svg>
        </span>
      </button>

      {open && (
        <ul className="lang-menu" role="listbox" aria-label="Language">
          {LOCALES.map((code) => {
            const item = SWITCHER_ZH[code];
            const active = code === locale;
            return (
              <li key={code} role="option" aria-selected={active}>
                <button
                  type="button"
                  className={`lang-option${active ? ' on' : ''}`}
                  onClick={() => {
                    setLocale(code);
                    setOpen(false);
                  }}
                  lang={LOCALE_META[code].htmlLang}
                >
                  <span className="lang-option-short">{item.short}</span>
                  <span className="lang-option-label">{item.label}</span>
                  {active && (
                    <span className="lang-check" aria-hidden="true">
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M2 6.5L4.5 9L10 3" />
                      </svg>
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
