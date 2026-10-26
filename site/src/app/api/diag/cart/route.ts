import { NextResponse } from 'next/server';
import { resolveCart } from '@/lib/checkout/core';

export const runtime = 'nodejs';

/**
 * 自检用：把服务端结账计算（取价 / 折扣 / 运费 / 总额）原样吐出来。
 *
 * 只在 `ENABLE_DIAG=1` 时工作，生产环境（不设该变量）一律 404 —— 免得成为
 * 一个公开的「价格探测」入口。用途见 scripts/e2e-coupons.sh：
 * 免运费券是否真的把运费归零，靠这个路由断言，而不是靠客户端 UI 猜测。
 */
export async function POST(request: Request) {
  if (process.env.ENABLE_DIAG !== '1') {
    return new NextResponse('Not found', { status: 404 });
  }
  try {
    const body = (await request.json()) as {
      items?: { slug: string; variantId: string; quantity: number }[];
      couponCode?: string;
    };
    const cart = await resolveCart(body.items ?? [], body.couponCode);
    return NextResponse.json({
      subtotalUsd: cart.subtotalUsd,
      discountUsd: cart.discountUsd,
      couponDiscountUsd: cart.couponDiscountUsd,
      shippingUsd: cart.shippingUsd,
      shippingFree: cart.shippingFree,
      totalUsd: cart.totalUsd,
      couponCode: cart.couponCode,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'failed' }, { status: 400 });
  }
}
