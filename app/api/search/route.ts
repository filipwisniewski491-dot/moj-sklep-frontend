import { NextResponse } from 'next/server';
import { Meilisearch } from 'meilisearch';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; 

const meiliClient = new MeiliSearch({
  host: process.env.NEXT_PUBLIC_MEILISEARCH_HOST || '',
  apiKey: process.env.NEXT_PUBLIC_MEILISEARCH_API_KEY || '',
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fullPath = searchParams.get('fullPath');
  const searchQ = searchParams.get('q') || "";

  if (!fullPath) return NextResponse.json({ error: "Brak ścieżki" }, { status: 400 });

  const segments = fullPath.split('/').filter(Boolean);
  const currentHandle = segments[segments.length - 1];

  // 1. Zbieramy filtry z URL
  const filterArray = [`category_handles = "${currentHandle}"`];
  
  // 2. Obsługa wszystkich dynamicznych filtrów (marka, model itd.)
  searchParams.forEach((val, key) => {
    if (!['fullPath', 'limit', 'sort', 'minPrice', 'maxPrice', 'q', 'page', 'view'].includes(key)) {
      const values = val.split(',').map(v => v.trim());
      if (values.length > 1) {
        // Multi-select: (Marka = 'Ursus' OR Marka = 'Zetor')
        filterArray.push(`(${values.map(v => `'${key}' = "${v}"`).join(' OR ')})`);
      } else {
        filterArray.push(`'${key}' = "${val}"`);
      }
    }
  });

  try {
    const index = meiliClient.index('products');
    const searchResult = await index.search(searchQ, {
      limit: parseInt(searchParams.get('limit') || '250'),
      filter: filterArray.join(' AND '),
      facets: ['*']
    });

    return NextResponse.json({ 
      products: searchResult.hits,
      filters: searchResult.facetDistribution,
      totalCount: searchResult.estimatedTotalHits
    });
  } catch (e) {
    return NextResponse.json({ products: [], totalCount: 0 });
  }
}