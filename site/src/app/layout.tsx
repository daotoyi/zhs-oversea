import type { Metadata } from 'next';
import './globals.css';
import { LocaleProvider } from '@/lib/i18n/client';
import { getLocale } from '@/lib/i18n/server';
import { LOCALE_META } from '@/lib/i18n/config';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zhenhesheng.com'),
  title: {
    default: 'Zhen He Sheng — Dao Culture & Living',
    template: '%s | Zhen He Sheng',
  },
  description:
    'The Mawangdui silk manuscript Dao De Jing in English. Hand-thrown tea ware, ritual incense and writing desk objects, each traced to its maker, its material and its consecration.',
  keywords: [
    'dao de jing',
    'tao te ching',
    'mawangdui',
    'i ching',
    'daoist objects',
    'taoist incense',
    'yixing teapot',
    'chinese calligraphy',
    'chen dynasty manuscript',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Zhen He Sheng',
    title: 'Zhen He Sheng — Dao Culture & Living',
    description:
      'Ancient Dao wisdom, made tangible. Eighty-one chapters of the Dao De Jing in plain English, and objects for the daily practice.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zhen He Sheng — Dao Culture & Living',
    description: 'Ancient Dao wisdom, made tangible.',
  },
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/',
      'zh-Hans-CN': 'https://zhenhesheng.cn',
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};

export const viewport = {
  themeColor: '#F7F4ED',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();

  return (
    <html lang={LOCALE_META[locale].htmlLang}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Inter:wght@400;500&family=Noto+Serif+SC:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
        <link rel="alternate" hrefLang="zh-Hans-CN" href="https://zhenhesheng.cn" />
        <link rel="alternate" hrefLang="x-default" href="https://zhenhesheng.com" />
      </head>
      <body>
        <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
