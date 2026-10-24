/**
 * 商品种子 —— 首次启动时把静态目录（lib/products.ts）灌入 admin 商品表
 *
 * 说明：前台 storefront 现经 lib/storefront.ts 读本表（DB 优先、静态兜底），
 * 因此后台对价格/标题/描述/图片的编辑会实时反映到前台。
 * 静态目录退化为「种子 + 兜底」，不再是唯一真相来源。
 */

import { all, run, now } from '@/lib/db/loader';
import { getProducts } from '@/lib/products';

export function seedCatalogIfEmpty(): number {
  const row = all<{ n: number }>('SELECT COUNT(*) AS n FROM products')[0];
  if (row && row.n > 0) return 0;
  const products = getProducts();
  for (const p of products) {
    const v0 = p.variants[0];
    run(
      `INSERT INTO products (slug, title, title_zh, tagline, description, category, price_usd, compare_at_usd,
        images, status, stock, sort_order, meta, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.slug, p.title, p.titleZh ?? null, p.tagline ?? null, p.description ?? null, p.category,
        v0?.priceUsd ?? 0, null, JSON.stringify(p.images ?? []),
        p.status === 'active' ? 'active' : 'draft', v0?.stock ?? 0, 0,
        JSON.stringify({ source: 'static-catalog', weightGrams: p.weightGrams ?? v0?.weightGrams ?? null, hsCode: p.hsCode ?? null }),
        now(), now(),
      ]
    );
  }
  return products.length;
}
