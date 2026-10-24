import type { Metadata } from 'next';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { getNavStrings, getFooterStrings, getUi } from '@/lib/i18n';
import { UI_ZH } from '@/lib/i18n/zh-hans';
import { toTraditional } from '@/lib/i18n/convert';

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getUi();
  return {
    title: locale === 'en' ? 'Order confirmed' : '订单已确认',
  robots: { index: false, follow: false },
  }
}

export default async function CheckoutSuccessPage() {
  const { locale, t } = await getUi();
  const navStrings = await getNavStrings();
  const footerStrings = await getFooterStrings();
  const h = UI_ZH.checkoutSuccess;
  const Z = (s: string) => (locale === 'en' ? s : toTraditional(s));

  return (
    <>
      <Nav strings={navStrings} />
      <section className="sec" style={{ paddingTop: 96, paddingBottom: 120 }}>
        <div className="wrap" style={{ maxWidth: 620, textAlign: 'center' }}>
          <div className="brand-mark" style={{ margin: '0 auto 28px', width: 44, height: 44, fontSize: 20 }}>
            ☯
          </div>
          <h1 className="serif" style={{ fontWeight: 300, fontSize: 'clamp(1.9rem, 4vw, 2.8rem)', lineHeight: 1.15, marginBottom: 20 }}>
            {t('Thank you — it’s on its way.', h.title)}
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ash)', lineHeight: 1.8, marginBottom: 16 }}>
            {t(
              'A confirmation is in your inbox with the order details and tracking. Parcels leave Beijing within two business days and take 7–15 business days to reach the United States.',
              h.p1
            )}
          </p>
          <p style={{ fontSize: 14, color: 'var(--ash)', lineHeight: 1.8, marginBottom: 40 }}>{Z(h.p2)}</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link className="btn btn-outline" href="/objects">
              {t('Back to the collection', h.backToObjects)}
            </Link>
            <Link className="btn btn-solid" href="/classics">
              {t('Read the Dao De Jing', h.readDao)}
            </Link>
          </div>
        </div>
      </section>
      <Footer strings={footerStrings} />
    </>
  );
}
