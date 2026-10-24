/**
 * 商品种子 —— 首次启动时把静态目录（lib/products.ts）灌入 admin 商品表
 *
 * 说明：前台 storefront 当前仍用静态目录，admin 商品表是其独立镜像。
 * 这样「商品管理」一上来就有真实数据可编辑；要把改动反映到前台，
 * 需将前台改为读 DB（独立重构，不在本次范围）。
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
