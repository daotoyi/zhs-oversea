import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { getNavStrings, getFooterStrings, getUi } from '@/lib/i18n';
import { UI_ZH } from '@/lib/i18n/zh-hans';
import { toTraditional } from '@/lib/i18n/convert';

export const dynamic = 'force-dynamic';

/**
 * PayPal 回跳页 —— 订单落库主路径
 *
 * 买家在 PayPal 付完跳回 ?token=<orderId>，
 * 这里：capture 真正收款 → 核实 COMPLETED → 取 pending 快照 → persistOrder 落库。
 * 幂等：同 token 已落库直接展示，不重复。
 */

export default async function PayPalReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const { locale, t } = await getUi();
  const navStrings = await getNavStrings();
  const footerStrings = await getFooterStrings();
  const h = UI_ZH.checkoutSuccess;
  const Z = (s: string) => (locale === 'en' ? s : toTraditional(s));

  if (!token) {
    return renderError('Missing payment reference.', '缺少支付凭证。', navStrings, footerStrings);
  }

  try {
    const { initDb } = await import('@/lib/db/loader');
    const { findOrderByProviderRef, getPendingOrder, completePendingOrder } = await import('@/lib/admin/dao');
    const { capturePayPalOrder, extractShippingAddress, extractPayer } = await import('@/lib/paypal');
    const { persistOrder } = await import('@/lib/orders');
    await initDb();

    // 幂等：已经落过库，直接展示
    const existing = findOrderByProviderRef('paypal', token);
    if (existing) {
      return renderSuccess(existing.id, existing.total, existing.currency, existing.email, navStrings, footerStrings, t, h, Z);
    }

    const pending = getPendingOrder(token);
    if (!pending) {
      return renderError('This PayPal order is unknown or expired.', '该 PayPal 订单不存在或已过期。', navStrings, footerStrings);
    }

    // 捕获资金并核实
    const captured = await capturePayPalOrder(token);
    const paid =
      captured?.status === 'COMPLETED' ||
      captured?.purchase_units?.[0]?.payments?.captures?.[0]?.status === 'COMPLETED';
    if (!paid) {
      return renderError('Payment was not completed.', '支付未完成，请返回购物车重试。', navStrings, footerStrings);
    }

    const address = extractShippingAddress(captured);
    const payer = extractPayer(captured);
    const { cart } = JSON.parse(pending.payload) as {
      cart: import('@/lib/checkout/core').ResolvedCart;
    };

    const orderId = await persistOrder({
      provider: 'paypal',
      providerRef: token,
      email: payer.email ?? '',
      customerName: payer.name,
      items: cart.lines.map((l) => ({
        sku: l.sku,
        slug: l.slug,
        name: l.title,
        quantity: l.quantity,
        unitAmountUsd: l.unitAmountUsd,
      })),
      subtotal: cart.subtotalUsd,
      discount: cart.discountUsd,
      shipping: cart.shippingUsd,
      tax: 0,
      total: cart.totalUsd,
      currency: cart.currency,
      status: 'paid',
      couponCode: cart.couponCode,
      address,
      memberId: cart.member?.id ?? null,
    });
    completePendingOrder(token, orderId);

    return renderSuccess(orderId, cart.totalUsd, cart.currency, payer.email, navStrings, footerStrings, t, h, Z);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    console.error('[paypal-return] failed:', message);
    return renderError(
      'We could not confirm your payment. If you were charged, contact us with the PayPal order ID.',
      '无法确认支付。如已扣款，请凭 PayPal 订单号联系我们。',
      navStrings,
      footerStrings
    );
  }
}

function renderSuccess(
  orderId: string,
  total: number,
  currency: string,
  email: string | null,
  navStrings: any,
  footerStrings: any,
  t: any,
  h: any,
  Z: (s: string) => string
) {
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
          <p style={{ fontSize: 14, color: 'var(--ash)', lineHeight: 1.8, marginBottom: 8 }}>
            Order: <strong>{orderId}</strong>
          </p>
          <p style={{ fontSize: 14, color: 'var(--ash)', lineHeight: 1.8, marginBottom: 8 }}>
            {t('Total', '金额')}: {(total / 100).toFixed(2)} {currency.toUpperCase()}
          </p>
          {email && (
            <p style={{ fontSize: 14, color: 'var(--ash)', lineHeight: 1.8, marginBottom: 40 }}>{Z('确认邮件已发送至 ')}{email}</p>
          )}
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

function renderError(enMsg: string, zhMsg: string, navStrings: any, footerStrings: any) {
  return (
    <>
      <Nav strings={navStrings} />
      <section className="sec" style={{ paddingTop: 96, paddingBottom: 120 }}>
        <div className="wrap" style={{ maxWidth: 620, textAlign: 'center' }}>
          <h1 className="serif" style={{ fontWeight: 300, fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', marginBottom: 20 }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ash)', lineHeight: 1.8, marginBottom: 40 }}>{zhMsg}</p>
          <Link className="btn btn-solid" href="/cart">
            返回购物车
          </Link>
        </div>
      </section>
      <Footer strings={footerStrings} />
    </>
  );
}
