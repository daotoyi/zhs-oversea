'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart';
import { formatUsd } from '@/lib/shipping';
import type { LocalizedProduct } from '@/lib/i18n';

export function AddToCart({
  product,
  strings,
}: {
  product: LocalizedProduct;
  strings: {
    addToCart: string;
    buyNow: string;
    soldOut: string;
    shipHintLight: string;
    shipHintHeavy: string;
    variantLabel: string;
  };
}) {
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? '');
  const [quantity, setQuantity] = useState(1);
  const [buying, setBuying] = useState(false);
  const addLine = useCart((s) => s.addLine);
  const router = useRouter();

  const variant = product.variants.find((v: { id: string }) => v.id === variantId) ?? product.variants[0];
  const soldOut = variant?.stock === 0;
  const label = (id: string) => product.loc.variantLabels[id] ?? product.variants.find((v: { id: string }) => v.id === id)?.label ?? id;

  return (
    <div className="pdp-buy">
      {product.variants.length > 1 && (
        <div className="pdp-variants">
          {product.variants.map((v: { id: string; label: string; priceUsd: number; stock: number }) => (
            <button
              key={v.id}
              type="button"
              className={`variant${variantId === v.id ? ' on' : ''}`}
              onClick={() => setVariantId(v.id)}
            >
              {label(v.id)}
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
          disabled={soldOut || buying}
          onClick={() => addLine({ slug: product.slug, variantId: variant.id, quantity })}
        >
          {soldOut ? strings.soldOut : `${strings.addToCart} — ${formatUsd(variant.priceUsd * quantity)}`}
        </button>
        <button
          type="button"
          className="btn btn-outline pdp-buy-now"
          disabled={soldOut || buying}
          onClick={() => {
            // 立即购买：先把当前规格加进购物车（不弹抽屉），再直接跳结算界面
            setBuying(true);
            addLine({ slug: product.slug, variantId: variant.id, quantity }, { openDrawer: false });
            router.push('/cart');
          }}
        >
          {strings.buyNow}
        </button>
      </div>

      <p className="pdp-ship-hint">
        {variant && variant.weightGrams >= 500 ? strings.shipHintHeavy : strings.shipHintLight}
      </p>
    </div>
  );
}
