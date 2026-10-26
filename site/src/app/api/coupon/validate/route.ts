import { NextResponse } from 'next/server';
import { computeDiscount } from '@/lib/discount';
import { getStoreProduct } from '@/lib/storefront';

export const runtime = 'nodejs';

type Item = { slug: string; variantId: string; quantity: number };

/**
 * 优惠券 / 节日折扣试算（购物车「应用」按钮调用）
 * 返回折扣预览，不落库、不计使用次数。
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { items?: Item[]; couponCode?: string };
    const items = body.items ?? [];
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ valid: false, error: 'Empty cart' }, { status: 400 });
    }

    // 以数据库商品为准取价格与品类
    const lines = [];
    for (const it of items) {
      const product = await getStoreProduct(it.slug);
      if (!product) {
        return NextResponse.json({ valid: false, error: `Unknown product: ${it.slug}` }, { status: 400 });
      }
      const variant = product.variants.find((v) => v.id === it.variantId);
      if (!variant) {
        return NextResponse.json({ valid: false, error: `Unknown variant: ${it.slug}` }, { status: 400 });
      }
      lines.push({
        slug: product.slug,
        category: product.category,
        variantPriceUsd: variant.priceUsd,
        quantity: Math.max(1, it.quantity | 0),
      });
    }

    const result = await computeDiscount(lines, body.couponCode);
    if (result.error) {
      return NextResponse.json({ valid: false, error: result.error, discountUsd: 0 });
    }
    return NextResponse.json({
      valid: true,
      code: result.couponCode,
      discountUsd: result.totalDiscount,
      saleDiscountUsd: result.saleDiscount,
      couponDiscountUsd: result.couponDiscount,
      freeship: result.freeship,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Validation failed';
    return NextResponse.json({ valid: false, error: message }, { status: 400 });
  }
}
