'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '@/lib/cart';
import { getProduct } from '@/lib/products';
import { formatUsd } from '@/lib/shipping';

export function CartClient() {
  const lines = useCart((s) => s.lines);
  const setQuantity = useCart((s) => s.setQuantity);
  const removeLine = useCart((s) => s.removeLine);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolved = lines
    .map((line) => {
      const product = getProduct(line.slug);
      if (!product) return null;
      const variant = product.variants.find((v) => v.id === line.variantId);
      if (!variant) return null;
      return { line, product, variant };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const subtotal = resolved.reduce((sum, r) => sum + r.variant.priceUsd * r.line.quantity, 0);
  const totalWeight = resolved.reduce((sum, r) => sum + r.variant.weightGrams * r.line.quantity, 0);
  const shipping = subtotal >= 6000 ? 0 : 1200;
  const remaining = Math.max(0, 6000 - subtotal);

  async function checkout() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: lines.map((l) => ({ slug: l.slug, variantId: l.variantId, quantity: l.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? 'Checkout could not be started');
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setBusy(false);
    }
  }

  if (resolved.length === 0) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: 'var(--ash)', marginBottom: 26 }}>
          Your bag is empty. The collection is a good place to start.
        </p>
        <Link className="btn btn-outline" href="/objects">
          Browse the objects
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
                Remove
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
        <h2 className="serif">Summary</h2>
        <dl>
          <div>
            <dt>Subtotal</dt>
            <dd>{formatUsd(subtotal)}</dd>
          </div>
          <div>
            <dt>Shipping</dt>
            <dd>{shipping === 0 ? 'Free' : formatUsd(shipping)}</dd>
          </div>
          <div>
            <dt>Estimated delivery</dt>
            <dd>{totalWeight >= 2000 ? '10–18 business days' : '7–12 business days'}</dd>
          </div>
        </dl>
        <div className="cart-note">Duties and US sales tax are calculated at checkout.</div>

        {remaining > 0 && (
          <div className="cart-progress">
            <div className="cart-progress-bar">
              <span style={{ width: `${Math.min(100, (subtotal / 6000) * 100)}%` }} />
            </div>
            <p>You&rsquo;re {formatUsd(remaining)} away from free US shipping.</p>
          </div>
        )}

        {error && <div className="cart-error">{error}</div>}

        <button className="btn btn-solid" style={{ width: '100%' }} onClick={checkout} disabled={busy}>
          {busy ? 'Opening secure checkout…' : 'Checkout'}
        </button>
        <div className="pay-row" style={{ justifyContent: 'center', marginTop: 16 }}>
          <span className="pay-badge">VISA</span>
          <span className="pay-badge">MASTERCARD</span>
          <span className="pay-badge">AMEX</span>
          <span className="pay-badge">APPLE PAY</span>
          <span className="pay-badge">PAYPAL</span>
        </div>
      </aside>
    </div>
  );
}
