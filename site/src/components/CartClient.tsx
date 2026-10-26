'use client';

import Link from 'next/link';
import { useState, useEffect, type CSSProperties } from 'react';
import { useCart, lineKey } from '@/lib/cart';
import { getProduct } from '@/lib/products';
import { formatUsd, shippingPriceCents } from '@/lib/shipping';
import { FREE_SHIPPING_THRESHOLD_USD } from '@/lib/types';
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
  couponFreeShip: string;
  couponInvalid: string;
  paymentMethod: string;
  pruned: (count: number) => string;
  selectAll: string;
  selectedCount: (n: number) => string;
  checkoutSelected: (n: number) => string;
  noneSelected: string;
  itemUnit: string;
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
    couponFreeShip: 'Free-shipping coupon applied — shipping is on us.',
    couponInvalid: 'This code is invalid or not applicable.',
    paymentMethod: 'Payment method',
    pruned: (n) =>
      `Removed ${n} item${n === 1 ? '' : 's'} no longer available from your bag.`,
    selectAll: 'Select all',
    selectedCount: (n) => `${n} selected`,
    checkoutSelected: (n) => `Checkout ${n} item${n === 1 ? '' : 's'}`,
    noneSelected: 'Select at least one item to check out.',
    itemUnit: 'each',
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
    couponFreeShip: '已应用免运费券，本单运费全免。',
    couponInvalid: '优惠码无效或不可用。',
    paymentMethod: '支付方式',
    pruned: (n: number) => `已自动移除 ${n} 件失效商品（已下架或链接过期）。`,
    selectAll: '全选',
    selectedCount: (n: number) => `已选 ${n} 件`,
    checkoutSelected: (n: number) => `结算选中商品（${n}）`,
    noneSelected: '请至少勾选一件商品再结算。',
    itemUnit: '单价',
  },
  'zh-Hant': {} as S,
};
STRINGS['zh-Hant'] = Object.fromEntries(
  Object.entries(STRINGS['zh-Hans']).map(([k, v]) => [
    k,
    typeof v === 'function'
      ? (...args: unknown[]) => toTraditional((v as (...a: unknown[]) => string)(...args))
      : toTraditional(v as string),
  ])
) as unknown as S;

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
  const [couponFreeship, setCouponFreeship] = useState(false);
  const [couponAppliedCode, setCouponAppliedCode] = useState<string | null>(null);
  // 默认走 PayPal（真能收钱）；信用卡 / Stripe 演示入口已隐藏，待接入真实收单后再开放
  const [provider, setProvider] = useState<'stripe' | 'paypal'>('paypal');
  const [cardOpen, setCardOpen] = useState(false);
  const sanitizeLines = useCart((st) => st.sanitizeLines);
  const markPending = useCart((st) => st.markPending);
  const settlePending = useCart((st) => st.settlePending);
  const cancelPending = useCart((st) => st.cancelPending);
  const [prunedCount, setPrunedCount] = useState(0);
  // 勾选结算：记「未选中」的行键，默认全部选中（新增商品也自动选中）
  const [unselected, setUnselected] = useState<string[]>([]);
  const s = STRINGS[locale];

  // 从 PayPal 取消回跳时作废待结算标记，避免下次成功付款误清别的东西
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (new URLSearchParams(window.location.search).get('cancelled') === '1') cancelPending();
  }, [cancelPending]);

  // 清理幽灵行：商品已下架/目录更换后，localStorage 里的旧行无法解析，
  // 若不清理，角标数量会包含它们而本页过滤掉它们 —— 两边就对不上。
  useEffect(() => {
    if (lines.length === 0) return;
    const stale = lines.filter((line) => {
      const base = getProduct(line.slug);
      if (!base) return true;
      return !base.variants.some((v) => v.id === line.variantId);
    });
    if (stale.length === 0) return;
    sanitizeLines((l) => !stale.some((x) => x.slug === l.slug && x.variantId === l.variantId));
    setPrunedCount((n) => n + stale.length);
  }, [lines, sanitizeLines]);

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

  // ── 勾选结算 ──────────────────────────────────────────────
  // 只结算勾选的行：金额、运费、优惠券全部按「选中项」重算，
  // 与服务端 resolveCart(items) 收到的 items 完全一致，不会出现「页面价 ≠ 实付价」。
  const isSel = (r: (typeof resolved)[number]) => !unselected.includes(lineKey(r.line.slug, r.line.variantId));
  const selectedRows = resolved.filter(isSel);
  const allSelected = resolved.length > 0 && selectedRows.length === resolved.length;
  const selectedSubtotal = selectedRows.reduce((sum, r) => sum + r.variant.priceUsd * r.line.quantity, 0);
  const selectedWeight = selectedRows.reduce((sum, r) => sum + r.variant.weightGrams * r.line.quantity, 0);
  const selectedCount = selectedRows.length;

  // 免运费券把运费清零（与服务端 lib/checkout/core.ts 同规则、同一算法）
  const shippingBase = shippingPriceCents(selectedSubtotal, selectedWeight);
  const shipping = couponFreeship ? 0 : shippingBase;
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD_USD - selectedSubtotal);

  function toggleRow(key: string) {
    setUnselected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
    // 选择变了，已计算的券额可能不再成立，让用户重新应用（避免显示与实际不符）
    setCouponDiscount(0);
    setCouponFreeship(false);
    setCouponAppliedCode(null);
    setCouponMsg(null);
  }

  function toggleAll() {
    setUnselected(allSelected ? resolved.map((r) => lineKey(r.line.slug, r.line.variantId)) : []);
    setCouponDiscount(0);
    setCouponFreeship(false);
    setCouponAppliedCode(null);
    setCouponMsg(null);
  }

  async function applyCoupon() {
    setCouponMsg(null);
    setCouponDiscount(0);
    setCouponFreeship(false);
    setCouponAppliedCode(null);
    const code = coupon.trim();
    if (!code) return;
    try {
      const res = await fetch('/api/coupon/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: selectedRows.map((r) => ({
            slug: r.line.slug,
            variantId: r.line.variantId,
            quantity: r.line.quantity,
          })),
          couponCode: code,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setCouponMsg(s.couponInvalid);
        return;
      }
      const isFreeship = Boolean(data.freeship);
      setCouponDiscount(data.discountUsd ?? 0);
      setCouponFreeship(isFreeship);
      setCouponAppliedCode(data.code ?? code);
      setCouponMsg(isFreeship ? s.couponFreeShip : s.couponApplied(formatUsd(data.discountUsd ?? 0)));
    } catch {
      setCouponMsg(s.couponInvalid);
    }
  }

  async function checkout() {
    setError(null);
    if (selectedCount === 0) {
      setError(s.noneSelected);
      return;
    }
    // 记下本单买的是哪几行 —— 支付成功页只清这些，没勾选的留车里
    markPending(selectedRows.map((r) => lineKey(r.line.slug, r.line.variantId)));
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
          items: selectedRows.map((r) => ({
            slug: r.line.slug,
            variantId: r.line.variantId,
            quantity: r.line.quantity,
          })),
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
        {prunedCount > 0 && (
          <p style={{ fontSize: 13, color: 'var(--ash)', marginBottom: 14 }}>{s.pruned(prunedCount)}</p>
        )}
        <p style={{ fontSize: 14, color: 'var(--ash)', marginBottom: 26 }}>{s.empty}</p>
        <Link className="btn btn-outline" href="/objects">
          {s.browse}
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-layout">
      {prunedCount > 0 && (
        <div className="cart-error" style={{ marginBottom: 14 }}>
          {s.pruned(prunedCount)}
        </div>
      )}
      <div className="cart-lines">
        <div className="cart-selbar">
          <label className="cart-check">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} />
            <span>{s.selectAll}</span>
          </label>
          <span className="cart-selbar-count">{s.selectedCount(selectedCount)}</span>
        </div>
        {resolved.map(({ line, product, variant }) => {
          const key = lineKey(line.slug, line.variantId);
          const checked = !unselected.includes(key);
          return (
            <div
              key={key}
              className="cart-line"
              style={{ opacity: checked ? 1 : 0.55, transition: 'opacity .15s' }}
            >
              <label className="cart-check cart-check-line" title={s.selectAll}>
                <input type="checkbox" checked={checked} onChange={() => toggleRow(key)} />
              </label>
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
          );
        })}
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
            <dt>
              {s.subtotal}
              {selectedCount < resolved.length && (
                <span style={{ fontSize: 11, color: 'var(--ash)', marginLeft: 6 }}>{s.selectedCount(selectedCount)}</span>
              )}
            </dt>
            <dd>{formatUsd(selectedSubtotal)}</dd>
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
            <dd>{selectedWeight >= 2000 ? s.heavy : s.light}</dd>
          </div>
        </dl>
        <div className="cart-note">{s.duty}</div>

        {remaining > 0 && !couponFreeship && (
          <div className="cart-progress">
            <div className="cart-progress-bar">
              <span style={{ width: `${Math.min(100, (selectedSubtotal / FREE_SHIPPING_THRESHOLD_USD) * 100)}%` }} />
            </div>
            <p>{s.away(formatUsd(remaining))}</p>
          </div>
        )}

        {error && <div className="cart-error">{error}</div>}

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--ash)', marginBottom: 8 }}>{s.paymentMethod}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => setProvider('paypal')} style={provider === 'paypal' ? payActiveStyle : payBaseStyle}>
              PayPal
            </button>
          </div>
        </div>

        <button
          className="btn btn-solid"
          style={{ width: '100%' }}
          onClick={checkout}
          disabled={busy || selectedCount === 0}
          title={selectedCount === 0 ? s.noneSelected : undefined}
        >
          {busy ? s.opening : selectedCount === resolved.length ? s.checkout : s.checkoutSelected(selectedCount)}
        </button>
        <div className="pay-row" style={{ justifyContent: 'center', marginTop: 16 }}>
          <span className="pay-badge">PAYPAL</span>
        </div>
      </aside>

      {cardOpen && (
        <CardCheckoutModal
          locale={locale}
          subtotalCents={selectedSubtotal}
          shippingCents={shipping}
          discountCents={couponDiscount}
          onClose={() => setCardOpen(false)}
          onPaid={() => {
            // 只清掉本单买走的行，未勾选的仍留在购物车
            settlePending();
            setCardOpen(false);
          }}
        />
      )}
    </div>
  );
}
