import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { CartClient } from '@/components/CartClient';
import { getNavStrings, getFooterStrings, getUi } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n/server';
import { UI_ZH } from '@/lib/i18n/zh-hans';
import { toTraditional } from '@/lib/i18n/convert';

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getUi();
  return {
    title: locale === 'en' ? 'Your cart' : '购物车',
  description: 'Your Zhen He Sheng order.',
  robots: { index: false, follow: false },
  }
}

export default async function CartPage() {
  const { t } = await getUi();
  const navStrings = await getNavStrings();
  const footerStrings = await getFooterStrings();
  const locale = await getLocale();

  return (
    <>
      <Nav strings={navStrings} />
      <section className="sec" style={{ paddingTop: 56 }}>
        <div className="wrap">
          <div className="eyebrow" style={{ marginBottom: 16 }}>
            {t('Your cart', UI_ZH.common.yourBag)}
          </div>
          <h1 className="serif" style={{ fontWeight: 300, fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.1, marginBottom: 40 }}>
            {t('Order', '结账')}
          </h1>
          <CartClient locale={locale} />
        </div>
      </section>
      <Footer strings={footerStrings} />
    </>
  );
}
