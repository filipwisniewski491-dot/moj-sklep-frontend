import { meiliClient } from '@/lib/meilisearch-client';

const SITE_URL = 'https://centrumrolnictwa.com';
const PRODUCTS_PER_FILE = 45000;
const MEILI_PAGE = 1000; // ile produktów na jedno zapytanie do Meili

export const revalidate = 86400;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolved = await params;
  // params.id to np. "0.xml" - wyciągamy numer
  const fileIndex = parseInt(String(resolved.id).replace('.xml', ''), 10) || 0;
  const startOffset = fileIndex * PRODUCTS_PER_FILE;

  const handles: { handle: string }[] = [];

  try {
    const index = meiliClient.index('products');
    // pobieramy produkty dla tego pliku: od startOffset, max PRODUCTS_PER_FILE
    let fetched = 0;
    while (fetched < PRODUCTS_PER_FILE) {
      const offset = startOffset + fetched;
      const res = await index.search('', {
        limit: MEILI_PAGE,
        offset: offset,
        attributesToRetrieve: ['handle'],
      });
      const hits = res.hits || [];
      if (hits.length === 0) break;
      for (const h of hits as any[]) {
        if (h.handle) handles.push({ handle: h.handle });
      }
      fetched += hits.length;
      if (hits.length < MEILI_PAGE) break; // koniec produktów
    }
  } catch (e) {
    console.error(`sitemap-products/${fileIndex} error:`, e);
  }

  const now = new Date().toISOString();
  const urls = handles.map(p => `  <url>
    <loc>${SITE_URL}/produkt/${encodeURIComponent(p.handle)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}