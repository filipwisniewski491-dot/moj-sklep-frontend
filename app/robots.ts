import { MetadataRoute } from 'next';

const SITE_URL = 'https://centrumrolnictwa.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // blokuj indeksowanie URL-i z filtrami technicznymi (unikamy duplikatów)
        disallow: [
          '/*?sort=',
          '/*?view=',
          '/*?page=',
          '/*?minPrice=',
          '/*?maxPrice=',
          '/*?q=',
          '/koszyk',
          '/checkout',
          '/konto',
          '/api/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}