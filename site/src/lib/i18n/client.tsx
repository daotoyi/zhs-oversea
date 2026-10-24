'use client';

import { createContext, useContext, useState, useTransition } from 'react';
import { LOCALE_COOKIE, LOCALE_META, LOCALES, isLocale, type Locale } from './config';

type LocaleContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  pending: boolean;
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'en',
  setLocale: () => {},
  pending: false,
});

/**
 * 语种 Provider（客户端）
 *
 * 初始值由服务端 layout 通过 cookie 读出后注入，避免首屏闪烁。
 * 切换语种：写 Cookie → router.refresh() 重取服务端数据。
 */
export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(
    isLocale(initialLocale) ? initialLocale : 'en'
  );
  const [pending, startTransition] = useTransition();

  function setLocale(next: Locale) {
    if (next === locale) return;
    // 有效期一年，全站共享
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`;
    setLocaleState(next);
    startTransition(() => {
      window.location.reload();
    });
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, pending }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}

export { LOCALES, LOCALE_META, LOCALE_COOKIE, isLocale };
export type { Locale };
