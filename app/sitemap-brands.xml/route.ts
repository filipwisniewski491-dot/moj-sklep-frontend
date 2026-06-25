import { meiliClient } from '@/lib/meilisearch-client';
import { brandToSlug, modelToSlug } from '@/lib/brand-utils';

const SITE_URL = 'https://centrumrolnictwa.com';
const MIN_PRODUCTS = 3;        // próg anty-thin-content
const TOP_CATEGORY = 'czesci-do-ciagnikow'; // główna kategoria dla landing page marka/model

export const revalidate = 86400;

export async function GET() {
  const urls: string[] = [];
  const now = new Date().toISOString();

  try {
    const index = meiliClient.index('products');

    // 1) Pobierz wszystkie marki (facet) w kontekście głównej kategorii
    const brandsRes = await index.search('', {
      limit: 0,
      filter: `category_handles = "${TOP_CATEGORY}"`,
      facets: ['Pasuje do marki'],
    });
    const brandsDist = (brandsRes.facetDistribution?.['Pasuje do marki']) || {};

    // marki z >= MIN_PRODUCTS, deduplikacja po slugu (czysta wersja = najliczniejsza)
    const brandBest: Record<string, { name: string; count: number }> = {};
    for (const [name, count] of Object.entries(brandsDist)) {
      const cnt = count as number;
      if (cnt < MIN_PRODUCTS) continue;
      const slug = brandToSlug(name);
      if (!slug) continue;
      const ex = brandBest[slug];
      if (!ex || cnt > ex.count) brandBest[slug] = { name, count: cnt };
    }

    // 2) Dla każdej marki: URL marki + URL topowych modeli
    for (const [brandSlug, { name: brandName }] of Object.entries(brandBest)) {
      // strona marki: /kategoria/czesci-do-ciagnikow/{marka}
      urls.push(`  <url>
    <loc>${SITE_URL}/kategoria/${TOP_CATEGORY}/${encodeURIComponent(brandSlug)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);

      // modele tej marki (facet zawężony)
      const modelsRes = await index.search('', {
        limit: 0,
        filter: `category_handles = "${TOP_CATEGORY}" AND "Pasuje do marki" = "${brandName.replace(/"/g, '\\"')}"`,
        facets: ['Pasuje do modelu'],
      });
      const modelsDist = (modelsRes.facetDistribution?.['Pasuje do modelu']) || {};

      const modelBest: Record<string, number> = {};
      for (const [mName, mCount] of Object.entries(modelsDist)) {
        const c = mCount as number;
        if (c < MIN_PRODUCTS) continue;
        const mSlug = modelToSlug(mName);
        if (!mSlug) continue;
        if (!modelBest[mSlug] || c > modelBest[mSlug]) modelBest[mSlug] = c;
      }

      for (const mSlug of Object.keys(modelBest)) {
        urls.push(`  <url>
    <loc>${SITE_URL}/kategoria/${TOP_CATEGORY}/${encodeURIComponent(brandSlug)}/${encodeURIComponent(mSlug)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);
      }
    }
  } catch (e) {
    console.error('sitemap-brands error:', e);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}