'use client';

import { useState } from 'react';
import { useCart } from '@/lib/cart';
import { formatUsd } from '@/lib/shipping';
import type { Product } from '@/lib/types';

export function AddToCart({ product }: { product: Product }) {
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? '');
  const [quantity, setQuantity] = useState(1);
  const addLine = useCart((s) => s.addLine);

  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  const soldOut = variant?.stock === 0;

  return (
    <div className="pdp-buy">
      {product.variants.length > 1 && (
        <div className="pdp-variants">
          {product.variants.map((v) => (
            <button
              key={v.id}
              type="button"
              className={`variant${variantId === v.id ? ' on' : ''}`}
              onClick={() => setVariantId(v.id)}
            >
              {v.label}
              <span>{formatUsd(v.priceUsd)}</span>
            </button>
          ))}
        </div>
      )}

      <div className="pdp-buy-row">
        <div className="qty">
          <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease">
            −
          </button>
          <span>{quantity}</span>
          <button type="button" onClick={() => setQuantity(Math.min(20, quantity + 1))} aria-label="Increase">
            +
          </button>
        </div>
        <button
          type="button"
          className="btn btn-solid pdp-add"
          disabled={soldOut}
          onClick={() => addLine({ slug: product.slug, variantId: variant.id, quantity })}
        >
          {soldOut ? 'Currently unavailable' : `Add to cart — ${formatUsd(variant.priceUsd * quantity)}`}
        </button>
      </div>

      <p className="pdp-ship-hint">
        {variant && variant.weightGrams >= 500
          ? 'Heavier piece — 8–14 business days to the US, insured.'
          : 'Ships from Beijing — 7–12 business days to the US, insured.'}
      </p>
    </div>
  );
}
