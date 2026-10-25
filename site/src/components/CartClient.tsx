'use client';

import Link from 'next/link';
import { useState, type CSSProperties } from 'react';
import { useCart } from '@/lib/cart';
import { getProduct } from '@/lib/products';
import { formatUsd } from '@/lib/shipping';
import type { Locale } from '@/lib/i18n/config';
import type { StoreProductLite } from '@/lib/storefront';
import { toTraditional } from '@/lib/i18n/convert';
import { UI_ZH } from '@/lib/i18n/zh-hans';
import { CardCheckoutModal } from '@/components/CardCheckoutModal';

const C = UI_ZH.common;

type S = {
  empty: string;
  browse: string;
  summary: string;
  subtotal: string;
  shipping: string;
  delivery: string;
  remove: string;
  away: (amount: string) => string;
  duty: string;
  checkout: string;
  opening: string;
  light: string;
  heavy: string;
  coupon: string;
  apply: string;
  couponPlaceholder: string;
  couponApplied: (amount: string) => string;
  couponInvalid: string;
  paymentMethod: string;
};

const STRINGS: Record<Locale, S> = {
  en: {
    empty: 'Your cart is empty. The collection is a good place to start.',
    browse: 'Browse the objects',
    summary: 'Summary',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    delivery: 'Estimated delivery',
    remove: 'Remove',
    away: (a) => `You’re ${a} away from free US shipping.`,
    duty: 'Duties and US sales tax are calculated at checkout.',
    checkout: 'Checkout',
    opening: 'Opening secure checkout…',
    light: '7–12 business days',
    heavy: '10–18 business days',
    coupon: 'Coupon',
    apply: 'Apply',
    couponPlaceholder: 'Enter coupon code',
    couponApplied: (a) => `Coupon applied — you save ${a}.`,
    couponInvalid: 'This code is invalid or not applicable.',
    paymentMethod: 'Payment method',
  },
  'zh-Hans': {
    empty: C.emptyBag,
    browse: C.browseObjects,
    summary: C.summary,
    subtotal: C.subtotal,
    shipping: C.shipping,
    delivery: C.estimatedDelivery,
    remove: C.remove,
    away: (a: string) => C.awayFromFreeShipping.replace('{amount}', a),
    duty: C.dutiesAtCheckout,
    checkout: C.checkout,
    opening: UI_ZH.cartPage.openingCheckout,
    light: '7–12 个工作日',
    heavy: '10–18 个工作日',
    coupon: '优惠券',
    apply: '应用',
    couponPlaceholder: '输入优惠码',
    couponApplied: (a: string) => `已应用优惠券，立减 ${a}。`,
    couponInvalid: '优惠码无效或不可用。',
    paymentMethod: '支付方式',
  },
  'zh-Hant': {} as S,
};
STRINGS['zh-Hant'] = Object.fromEntries(
  Object.entries(STRINGS['zh-Hans']).map(([k, v]) => [
    k,
    typeof v === 'function' ? (a: string) => toTraditional(v(a)) : toTraditional(v),
  ])
) as S;

export function CartClient({
  locale,
  productMap,
}: {
  locale: Locale;
  productMap?: Record<string, StoreProductLite>;
}) {
  const lines = useCart((s) => s.lines);
  const setQuantity = useCart((s) => s.setQuantity);
  const removeLine = useCart((s) => s.removeLine);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coupon, setCoupon] = useState('');
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponAppliedCode, setCouponAppliedCode] = useState<string | null>(null);
  const [provider, setProvider] = useState<'stripe' | 'paypal'>('stripe');
  const [cardOpen, setCardOpen] = useState(false);
  const clear = useCart((st) => st.clear);
  const s = STRINGS[locale];

  const payBaseStyle: CSSProperties = {
    flex: 1,
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid var(--line)',
    background: 'transparent',
    color: 'var(--ink)',
    fontSize: 14,
    cursor: 'pointer',
  };
  const payActiveStyle: CSSProperties = {
    ...payBaseStyle,
    borderColor: 'var(--ink)',
    background: 'var(--ink)',
    color: 'var(--paper)',
  };

  const resolved = lines
    .map((line) => {
      const base = getProduct(line.slug);
      if (!base) return null;
      const override = productMap?.[line.slug];
      const product = override
        ? {
            ...base,
            priceUsd: override.priceUsd,
            title: override.title,
            titleZh: override.titleZh,
            images: override.images,
            variants: base.variants.map((v, i) =>
              i === 0 ? { ...v, priceUsd: override.priceUsd, stock: override.stock } : v
            ),
          }
        : base;
      const variant = product.variants.find((v) => v.id === line.variantId);
      if (!variant) return null;
      return { line, product, variant };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const subtotal = resolved.reduce((sum, r) => sum + r.variant.priceUsd * r.line.quantity, 0);
  const totalWeight = resolved.reduce((sum, r) => sum + r.variant.weightGrams * r.line.quantity, 0);
  const shipping = subtotal >= 6000 ? 0 : 1200;
  const remaining = Math.max(0, 6000 - subtotal);

  async function applyCoupon() {
    setCouponMsg(null);
    setCouponDiscount(0);
    setCouponAppliedCode(null);
    const code = coupon.trim();
    if (!code) return;
    try {
      const res = await fetch('/api/coupon/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: lines.map((l) => ({ slug: l.slug, variantId: l.variantId, quantity: l.quantity })),
          couponCode: code,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setCouponMsg(s.couponInvalid);
        return;
      }
      setCouponDiscount(data.discountUsd ?? 0);
      setCouponAppliedCode(data.code ?? code);
      setCouponMsg(s.couponApplied(formatUsd(data.discountUsd ?? 0)));
    } catch {
      setCouponMsg(s.couponInvalid);
    }
  }

  async function checkout() {
    setError(null);
    // 信用卡 / Stripe：暂未接入 Stripe，点击后进入信用卡结算界面（演示）
    if (provider === 'stripe') {
      setCardOpen(true);
      return;
    }
    setBusy(true);
    try {
      const endpoint = '/api/checkout/paypal';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: lines.map((l) => ({ slug: l.slug, variantId: l.variantId, quantity: l.quantity })),
          couponCode: couponAppliedCode ?? undefined,
        }),
      });
      const data = await res.json();
      const redirectUrl = data.approveUrl ?? data.url;
      if (!res.ok || !redirectUrl) {
        throw new Error(data.error ?? 'Checkout could not be started');
      }
      window.location.href = redirectUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setBusy(false);
    }
  }

  if (resolved.length === 0) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: 'var(--ash)', marginBottom: 26 }}>{s.empty}</p>
        <Link className="btn btn-outline" href="/objects">
          {s.browse}
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-layout">
      <div className="cart-lines">
        {resolved.map(({ line, product, variant }) => (
          <div key={`${line.slug}-${line.variantId}`} className="cart-line">
            <Link href={`/objects/${product.slug}`} className="cart-thumb">
              <img src={product.images[0]} alt={product.title} />
            </Link>
            <div className="cart-line-info">
              <Link href={`/objects/${product.slug}`} className="cart-line-title">
                {product.title}
              </Link>
              <div className="cart-line-zh">{product.titleZh}</div>
              <div className="cart-line-variant">{variant.label}</div>
              <button className="cart-remove" onClick={() => removeLine(line.slug, line.variantId)}>
                {s.remove}
              </button>
            </div>
            <div className="cart-line-right">
              <div className="qty">
                <button onClick={() => setQuantity(line.slug, line.variantId, line.quantity - 1)}>−</button>
                <span>{line.quantity}</span>
                <button onClick={() => setQuantity(line.slug, line.variantId, line.quantity + 1)}>+</button>
              </div>
              <div className="cart-line-price">{formatUsd(variant.priceUsd * line.quantity)}</div>
            </div>
          </div>
        ))}
      </div>

      <aside className="cart-summary">
        <h2 className="serif">{s.summary}</h2>

        <div className="cart-coupon">
          <input
            type="text"
            placeholder={s.couponPlaceholder}
            value={coupon}
            onChange={(e) => setCoupon(e.target.value)}
            aria-label={s.coupon}
          />
          <button className="btn btn-outline" onClick={applyCoupon} type="button">
            {s.apply}
          </button>
        </div>
        {couponMsg && <div className={couponAppliedCode ? 'cart-coupon-ok' : 'cart-error'}>{couponMsg}</div>}

        <dl>
          <div>
            <dt>{s.subtotal}</dt>
            <dd>{formatUsd(subtotal)}</dd>
          </div>
          {couponDiscount > 0 && (
            <div>
              <dt>{s.coupon}</dt>
              <dd className="cart-discount">−{formatUsd(couponDiscount)}</dd>
            </div>
          )}
          <div>
            <dt>{s.shipping}</dt>
            <dd>{shipping === 0 ? C.free : formatUsd(shipping)}</dd>
          </div>
          <div>
            <dt>{s.delivery}</dt>
            <dd>{totalWeight >= 2000 ? s.heavy : s.light}</dd>
          </div>
        </dl>
        <div className="cart-note">{s.duty}</div>

        {remaining > 0 && (
          <div className="cart-progress">
            <div className="cart-progress-bar">
              <span style={{ width: `${Math.min(100, (subtotal / 6000) * 100)}%` }} />
            </div>
            <p>{s.away(formatUsd(remaining))}</p>
          </div>
        )}

        {error && <div className="cart-error">{error}</div>}

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--ash)', marginBottom: 8 }}>{s.paymentMethod}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => setProvider('stripe')} style={provider === 'stripe' ? payActiveStyle : payBaseStyle}>
              信用卡 / Stripe
            </button>
            <button type="button" onClick={() => setProvider('paypal')} style={provider === 'paypal' ? payActiveStyle : payBaseStyle}>
              PayPal
            </button>
          </div>
        </div>

        <button className="btn btn-solid" style={{ width: '100%' }} onClick={checkout} disabled={busy}>
          {busy ? s.opening : s.checkout}
        </button>
        <div className="pay-row" style={{ justifyContent: 'center', marginTop: 16 }}>
          <span className="pay-badge">VISA</span>
          <span className="pay-badge">MASTERCARD</span>
          <span className="pay-badge">AMEX</span>
          <span className="pay-badge">APPLE PAY</span>
          <span className="pay-badge">PAYPAL</span>
        </div>
      </aside>

      {cardOpen && (
        <CardCheckoutModal
          locale={locale}
          subtotalCents={subtotal}
          shippingCents={shipping}
          discountCents={couponDiscount}
          onClose={() => setCardOpen(false)}
          onPaid={() => {
            clear();
            setCardOpen(false);
          }}
        />
      )}
    </div>
  );
}
