import { NextResponse } from 'next/server';
import { requireStripe, SITE_URL } from '@/lib/stripe';
import { calculateShipping } from '@/lib/shipping';
import { getStoreProduct } from '@/lib/storefront';
import { computeDiscount } from '@/lib/discount';

export const runtime = 'nodejs';

/**
 * 创建 Stripe Checkout Session（实物文创）
 *
 * 关键点：
 * 1. 价格一律以 USD 从数据库商品取（后台编辑实时生效），绝不信任客户端金额
 * 2. 优惠券 + 节日折扣在结账时校验并分摊到各行单价
 * 3. shipping_options 传入运费档位，满 $60 用一个 0 元档实现免运
 * 4. automatic_tax 开启 Stripe Tax，美国各州销售税自动计算
 * 5. consent_collection 收集电商数据披露同意（FTC 要求）
 * 6. 折扣金额与优惠码写入 session metadata，供 webhook 落库订单 + 记优惠券使用
 */

type LineItem = {
  slug: string;
  variantId: string;
  quantity: number;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { items?: LineItem[]; couponCode?: string };
    const items = body.items ?? [];

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Empty cart' }, { status: 400 });
    }
    if (items.length > 50) {
      return NextResponse.json({ error: 'Too many line items' }, { status: 400 });
    }

    // 以数据库商品为准取价格/品类/库存，并应用折扣
    const resolved = [];
    const discountLines = [];
    for (const item of items) {
      const product = await getStoreProduct(item.slug);
      if (!product) {
        throw new Error(`Unknown product: ${item.slug}`);
      }
      const variant = product.variants.find((v) => v.id === item.variantId);
      if (!variant) {
        throw new Error(`Unknown variant: ${item.slug}/${item.variantId}`);
      }
      const quantity = Math.max(1, item.quantity | 0);
      if (variant.stock < quantity) {
        throw new Error(`Insufficient stock: ${item.slug}`);
      }
      resolved.push({ product, variant, quantity });
      discountLines.push({
        slug: product.slug,
        category: product.category,
        variantPriceUsd: variant.priceUsd,
        quantity,
      });
    }

    const disc = await computeDiscount(discountLines, body.couponCode);
    if (disc.error) {
      return NextResponse.json({ error: disc.error }, { status: 400 });
    }

    const stripe = requireStripe();
    const shipping = calculateShipping(
      resolved.map((r) => ({
        product: r.product,
        variantId: r.variant.id,
        quantity: r.quantity,
      }))
    );

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
      line_items: resolved.map(({ product, variant, quantity }, i) => ({
        quantity,
        price_data: {
          currency: 'usd',
          unit_amount: Math.max(1, disc.lineUnitAmounts[i]),
          product_data: {
            name: product.title,
            description: product.titleZh,
            images: [`${SITE_URL}${product.images[0]}`],
            metadata: {
              sku: variant.sku,
              slug: product.slug,
              hsCode: product.hsCode,
              weightGrams: String(variant.weightGrams),
              cites: product.cites.status,
              citesPermitNo: product.cites.permitNo ?? '',
              assayNo: product.assay?.reportNo ?? '',
            },
          },
        },
      })),
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: shipping.priceUsd, currency: 'usd' },
            display_name: shipping.free
              ? 'Free US shipping'
              : `${shipping.label} — $${(shipping.priceUsd / 100).toFixed(0)}`,
            delivery_estimate: {
              minimum: { unit: 'business_day', value: shipping.minDays },
              maximum: { unit: 'business_day', value: shipping.maxDays },
            },
          },
        },
      ],
      metadata: {
        source: 'zhenhesheng-com',
        shippingRateId: shipping.rateId,
        freeShipping: String(shipping.free),
        discountUsd: String(disc.totalDiscount),
        saleDiscountUsd: String(disc.saleDiscount),
        couponDiscountUsd: String(disc.couponDiscount),
        couponCode: disc.couponCode ?? '',
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
