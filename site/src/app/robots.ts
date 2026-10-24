import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/cart', '/checkout/'],
      },
    ],
    sitemap: 'https://zhenhesheng.com/sitemap.xml',
    host: 'https://zhenhesheng.com',
  };
}
