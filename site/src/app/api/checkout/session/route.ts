import { NextResponse } from 'next/server';
import { requireStripe, SITE_URL } from '@/lib/stripe';
import { resolveCart } from '@/lib/checkout/core';

export const runtime = 'nodejs';

/**
 * 创建 Stripe Checkout Session（实物文创）
 *
 * 价格权威：全部来自 resolveCart（服务端取价 + 折扣 + 运费 + 会员），
 * 绝不信任客户端金额。详见 lib/checkout/core.ts。
 */

type LineItem = {
  slug: string;
  variantId: string;
  quantity: number;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { items?: LineItem[]; couponCode?: string };
    const cart = await resolveCart(body.items ?? [], body.couponCode);

    const stripe = requireStripe();

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      // DDP：关税与销售税在结账时一次算清，买家到货不再付费
      automatic_tax: { enabled: true },
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['US'],
      },
      phone_number_collection: { enabled: false },
      consent_collection: {
        terms_of_service: 'required',
        promotions: 'auto',
      },
      custom_text: {
        shipping_address: {
          message: 'Duties and import taxes are included — no charges on delivery.',
        },
        submit: {
          message: 'Free US shipping on orders over $60.',
        },
      },
      line_items: cart.lines.map((l) => ({
        quantity: l.quantity,
        price_data: {
          currency: 'usd',
          unit_amount: Math.max(1, l.unitAmountUsd),
          product_data: {
            name: l.title,
            description: l.titleZh,
            images: [l.image],
            metadata: {
              sku: l.sku,
              slug: l.slug,
              hsCode: l.hsCode,
              weightGrams: String(l.weightGrams),
              cites: l.citesStatus,
              citesPermitNo: l.citesPermitNo,
              assayNo: l.assayNo,
            },
          },
        },
      })),
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: cart.shippingUsd, currency: 'usd' },
            display_name: cart.shippingFree
              ? 'Free US shipping'
              : `${cart.shippingLabel} — $${(cart.shippingUsd / 100).toFixed(0)}`,
            delivery_estimate: {
              minimum: { unit: 'business_day', value: cart.shippingMinDays },
              maximum: { unit: 'business_day', value: cart.shippingMaxDays },
            },
          },
        },
      ],
      metadata: {
        source: 'zhenhesheng-com',
        shippingRateId: cart.shippingRateId,
        freeShipping: String(cart.shippingFree),
        discountUsd: String(cart.discountUsd),
        saleDiscountUsd: String(cart.saleDiscountUsd),
        couponDiscountUsd: String(cart.couponDiscountUsd),
        couponCode: cart.couponCode ?? '',
        // 会员归属：webhook 据此把订单挂到账户并发放积分
        userId: cart.member?.id ?? '',
        userEmail: cart.member?.email ?? '',
      },
      success_url: `${SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/cart?cancelled=1`,
    });

    return NextResponse.json({ url: session.url, id: session.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Checkout failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
