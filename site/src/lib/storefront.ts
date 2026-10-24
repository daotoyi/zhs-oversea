/**
 * 前台商品数据层 —— 以数据库（后台 admin 商品表）为优先，静态 lib/products 兜底。
 *
 * 目的：让后台「商品管理」的价格 / 标题 / 描述 / 上下架等编辑实时反映到前台。
 * - 数据库为空（还没人登录后台播种）时，自动回落到静态目录，保证前台永不空白。
 * - 任何数据库读取异常都被吞掉并回落静态，前台不会因 DB 故障而崩。
 *
 * 说明：购物车/结账的价格以本层（DB）为准；购物车展示价由 cart page 注入 productMap 覆盖。
 */

import { initDb, all, get } from '@/lib/db/loader';
import { getProducts, getProduct } from '@/lib/products';
import type { Product, ProductCategory } from '@/lib/types';

type DbRow = {
  slug: string;
  title: string;
  title_zh: string | null;
  tagline: string | null;
  description: string | null;
  category: string;
  price_usd: number;
  compare_at_usd: number | null;
  images: string;
  status: string;
  stock: number;
};

const SELECT =
  'slug, title, title_zh, tagline, description, category, price_usd, compare_at_usd, images, status, stock';

const VALID_CATEGORIES: ProductCategory[] = [
  'tea-ware',
  'incense-ritual',
  'writing-desk',
  'talisman-objects',
  'home-altar',
  'books',
];

function parseImages(json: string | null, fallback: string[]): string[] {
  if (!json) return fallback;
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) && arr.length > 0 ? (arr as string[]) : fallback;
  } catch {
    return fallback;
  }
}

function merge(base: Product, row?: DbRow): Product {
  if (!row) return base;
  const priceUsd = Number(row.price_usd) || base.priceUsd;
  const category = (VALID_CATEGORIES as string[]).includes(row.category)
    ? (row.category as ProductCategory)
    : base.category;
  const variants = base.variants.map((v, i) =>
    i === 0 ? { ...v, priceUsd, stock: Number(row.stock) || v.stock } : v
  );
  return {
    ...base,
    title: row.title || base.title,
    titleZh: row.title_zh || base.titleZh,
    tagline: row.tagline || base.tagline,
    description: row.description || base.description,
    category,
    priceUsd,
    compareAtUsd: row.compare_at_usd != null ? Number(row.compare_at_usd) : base.compareAtUsd,
    images: parseImages(row.images, base.images),
    status: (row.status as Product['status']) || base.status,
    variants,
  };
}

/** 前台商品列表：DB 优先，静态兜底 */
export async function getStoreProducts(): Promise<Product[]> {
  const base = getProducts();
  try {
    await initDb();
    const rows = all<DbRow>(`SELECT ${SELECT} FROM products`);
    const bySlug = new Map(rows.map((r) => [r.slug, r]));
    return base.map((p) => merge(p, bySlug.get(p.slug)));
  } catch {
    return base;
  }
}

/** 单个商品详情：DB 优先，静态兜底 */
export async function getStoreProduct(slug: string): Promise<Product | null> {
  const base = getProduct(slug);
  if (!base) return null;
  try {
    await initDb();
    const row = get<DbRow>(`SELECT ${SELECT} FROM products WHERE slug = ?`, [slug]);
    return merge(base, row ?? undefined);
  } catch {
    return base;
  }
}

/** 轻量价格表，供购物车客户端覆盖展示价（DB 优先，静态兜底） */
export type StoreProductLite = {
  priceUsd: number;
  title: string;
  titleZh: string;
  images: string[];
  stock: number;
};

export async function getStoreProductMap(): Promise<Record<string, StoreProductLite>> {
  const base = getProducts();
  const map: Record<string, StoreProductLite> = {};
  for (const p of base) {
    map[p.slug] = {
      priceUsd: p.priceUsd,
      title: p.title,
      titleZh: p.titleZh,
      images: p.images,
      stock: p.variants[0]?.stock ?? 0,
    };
  }
  try {
    await initDb();
    const rows = all<DbRow>(`SELECT ${SELECT} FROM products`);
    for (const r of rows) {
      const prev = map[r.slug];
      map[r.slug] = {
        priceUsd: Number(r.price_usd) || prev?.priceUsd || 0,
        title: r.title || prev?.title || '',
        titleZh: r.title_zh || prev?.titleZh || '',
        images: parseImages(r.images, prev?.images || []),
        stock: Number(r.stock) || prev?.stock || 0,
      };
    }
  } catch {
    /* 回落静态 */
  }
  return map;
}
