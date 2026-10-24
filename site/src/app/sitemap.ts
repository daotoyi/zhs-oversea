import type { MetadataRoute } from 'next';
import { getProducts } from '@/lib/products';
import { CHAPTERS } from '@/data/chapters';
import { HEXAGRAMS } from '@/data/hexagrams';
import { POSTS } from '@/data/posts';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zhenhesheng.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes = [
    { url: '/', priority: 1.0 },
    { url: '/objects', priority: 0.9 },
    { url: '/classics', priority: 0.9 },
    { url: '/classics/dao-de-jing', priority: 0.85 },
    { url: '/classics/yijing', priority: 0.8 },
    { url: '/classics/bazi', priority: 0.7 },
    { url: '/practice', priority: 0.8 },
    { url: '/journal', priority: 0.75 },
    { url: '/traceability', priority: 0.8 },
    { url: '/about', priority: 0.6 },
    { url: '/contact', priority: 0.5 },
    { url: '/policies/shipping', priority: 0.4 },
    { url: '/policies/returns', priority: 0.4 },
    { url: '/policies/privacy', priority: 0.3 },
    { url: '/policies/terms', priority: 0.3 },
    { url: '/policies/imprint', priority: 0.3 },
  ].map((r) => ({
    url: `${BASE}${r.url}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: r.priority,
  }));

  const productRoutes = getProducts().map((p) => ({
    url: `${BASE}/objects/${p.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const chapterRoutes = Object.keys(CHAPTERS).map((n) => ({
    url: `${BASE}/classics/dao-de-jing/${n}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const hexRoutes = Object.keys(HEXAGRAMS).map((s) => ({
    url: `${BASE}/classics/yijing/${s}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const postRoutes = Object.keys(POSTS).map((s) => ({
    url: `${BASE}/journal/${s}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...productRoutes, ...chapterRoutes, ...hexRoutes, ...postRoutes];
}
