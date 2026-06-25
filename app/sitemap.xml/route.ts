import { meiliClient } from '@/lib/meilisearch-client';

const SITE_URL = 'https://centrumrolnictwa.com';
const PRODUCTS_PER_FILE = 45000;

// cache 24h - Google nie sprawdza częściej, a generowanie jest kosztowne
export const revalidate = 86400;

export async function GET() {
  // policz produkty żeby wiedzieć ile plików produktów potrzeba
  let productCount = 0;
  try {
    const index = meiliClient.index('products');
    const res = await index.search('', { limit: 0, hitsPerPage: 1 } as any);
    productCount = (res as any).totalHits ?? res.estimatedTotalHits ?? 0;
  } catch (e) {
    console.error('sitemap index - blad liczenia produktow:', e);
  }

  const productFiles = Math.max(1, Math.ceil(productCount / PRODUCTS_PER_FILE));
  const now = new Date().toISOString();

  const sitemaps: string[] = [
    `${SITE_URL}/sitemap-categories.xml`,
    `${SITE_URL}/sitemap-brands.xml`,
  ];
  for (let i = 0; i < productFiles; i++) {
    sitemaps.push(`${SITE_URL}/sitemap-products/${i}.xml`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(loc => `  <sitemap>
    <loc>${loc}</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}