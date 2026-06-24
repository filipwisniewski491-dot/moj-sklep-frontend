import { NextResponse } from 'next/server';
import { Meilisearch } from 'meilisearch';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; 

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://178.104.130.90:9000";
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

const meiliClient = new Meilisearch({
  host: process.env.NEXT_PUBLIC_MEILISEARCH_HOST || '',
  apiKey: process.env.NEXT_PUBLIC_MEILISEARCH_API_KEY || '',
});

const corsHeaders = {
  'Cache-Control': 'no-store, max-age=0',
  'Content-Type': 'application/json'
};

// 🔥 OPTYMALIZACJA PRĘDKOŚCI - Tylko te filtry będą liczone w locie!
const OPTIMIZED_FACETS = [
  'Pasuje do marki', 'Pasuje do modelu', 'Typ produktu', 'Producent', 
  'Rodzaj', 'Waga [kg]', 'Napięcie [V]', 'Strona zabudowy', 
  'Ilość zębów', 'Wymiary', 'Średnica wewnętrzna [mm]', 'Średnica zewnętrzna [mm]', 'Zastosowanie'
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const searchQ = searchParams.get('q') || "";
  const fullPath = searchParams.get('fullPath'); 

  if (searchQ && !fullPath) {
    try {
      const index = meiliClient.index('products');
      const searchResult = await index.search(searchQ, { limit: 6 });
      return NextResponse.json({ hits: searchResult.hits }, { headers: corsHeaders });
    } catch (error) {
      return NextResponse.json({ hits: [] }, { status: 500, headers: corsHeaders });
    }
  }

  if (!fullPath) {
    return NextResponse.json({ error: "Brak ścieżki" }, { status: 400, headers: corsHeaders });
  }

  const currentLimit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 250;
  const activeFilters = Object.fromEntries(searchParams.entries());
  
  ['fullPath', 'limit', 'sort', 'minPrice', 'maxPrice', 'q', 'page', 'view'].forEach(k => delete activeFilters[k]);

  const segments = fullPath.split('/').filter(Boolean);
  const currentHandle = segments[segments.length - 1]; 

  let allowedHandles: string[] = [currentHandle];

  try {
    const headers: any = { "Content-Type": "application/json" };
    if (PUBLISHABLE_KEY) headers["x-publishable-api-key"] = PUBLISHABLE_KEY;

    const currentCategoryRes = await fetch(`${MEDUSA_URL}/store/product-categories?handle=${encodeURIComponent(currentHandle)}`, { headers, next: { revalidate: 3600 } });
    
    if (currentCategoryRes.ok) {
        const currentCategoryJson = await currentCategoryRes.json();
        const currentCategory = currentCategoryJson.product_categories?.[0];

        if (currentCategory) {
          const collectHandles = (cat: any) => {
            if (!cat) return;
            if (!allowedHandles.includes(cat.handle)) allowedHandles.push(cat.handle);
            if (cat.category_children && Array.isArray(cat.category_children)) {
              cat.category_children.forEach(collectHandles);
            }
          };
          collectHandles(currentCategory);
        }
    }

    const index = meiliClient.index('products');
    
    const categoryFilterStr = allowedHandles.length > 0 
      ? `category_handles IN [${allowedHandles.map(h => JSON.stringify(h)).join(', ')}]`
      : `category_handles = ${JSON.stringify(currentHandle)}`;

    const baseFacetsResult = await index.search(searchQ, {
      limit: 0,
      filter: categoryFilterStr,
      facets: OPTIMIZED_FACETS // 🔥 ZAMIAST ['*']
    });

    const filterArray: string[] = [categoryFilterStr];
    Object.entries(activeFilters).forEach(([key, val]) => {
      const values = String(val).split(',').map(v => v.trim()).filter(Boolean);
      if (values.length > 0) {
        const orConditions = values.map(v => `'${key}' = ${JSON.stringify(v)}`);
        filterArray.push(`(${orConditions.join(' OR ')})`);
      }
    });

    const sortParam = searchParams.get('sort');
    let meiliSort = undefined;
    if (sortParam === 'price_asc') meiliSort = ['price:asc'];
    if (sortParam === 'price_desc') meiliSort = ['price:desc'];

    const searchResult = await index.search(searchQ, {
      limit: currentLimit,
      filter: filterArray.join(' AND '),
      sort: meiliSort,
      facets: OPTIMIZED_FACETS // 🔥 ZAMIAST ['*']
    });

    const mappedProducts = searchResult.hits.map((p: any) => ({
      id: p.id,
      sku: p.id,
      name: p.title,
      price: p.price || 0,
      slug: p.handle,
      category_text: p.Kategoria || '',
      images: p.thumbnail ? [{ url: p.thumbnail }] : []
    }));

    return NextResponse.json({ 
      narrowedFilters: searchResult.facetDistribution || {}, 
      products: mappedProducts,
      totalCount: searchResult.estimatedTotalHits || mappedProducts.length, 
      filters: baseFacetsResult.facetDistribution || {}
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error("Błąd route Meilisearch:", error);
    return NextResponse.json({ products: [], filters: {}, narrowedFilters: {}, totalCount: 0 }, { status: 500, headers: corsHeaders }); 
  }
}