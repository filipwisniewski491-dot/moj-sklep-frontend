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

  let dbCategoryData = { h1_dynamic: currentHandle.toUpperCase().replace(/-/g, ' '), name: currentHandle.replace(/-/g, ' '), top_seo_text: "", bottom_seo_text: "", faqs: [] };
  let breadcrumbs: any[] = [];
  let directSubcategories: string[] = [];
  let allowedHandles: string[] = [currentHandle];

  try {
    const headers: any = { "Content-Type": "application/json" };
    if (PUBLISHABLE_KEY) headers["x-publishable-api-key"] = PUBLISHABLE_KEY;

    const currentCategoryRes = await fetch(`${MEDUSA_URL}/store/product-categories?handle=${encodeURIComponent(currentHandle)}`, { headers, cache: 'no-store' });
    
    if (currentCategoryRes.ok) {
        const currentCategoryJson = await currentCategoryRes.json();
        const currentCategory = currentCategoryJson.product_categories?.[0];

        if (currentCategory) {
          const meta = currentCategory.metadata || {};
          dbCategoryData.name = currentCategory.name;
          dbCategoryData.h1_dynamic = meta.h1_dynamic || currentCategory.name.toUpperCase();
          dbCategoryData.top_seo_text = meta.top_seo_text || currentCategory.description || "";
          dbCategoryData.bottom_seo_text = meta.bottom_seo_text || null;
          dbCategoryData.faqs = meta.faqs || meta.faq || [];

          if (currentCategory.category_children && currentCategory.category_children.length > 0) {
            directSubcategories = currentCategory.category_children.map((child: any) => child.name).sort();
          }

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
    
    let tempPath = "";
    breadcrumbs = segments.map(s => {
      tempPath = tempPath ? `${tempPath}/${s}` : s;
      return { name: s.replace(/-/g, ' ').toUpperCase(), slug: s, path: tempPath };
    });

    const index = meiliClient.index('products');
    const filterArray: string[] = [];
    
    if (allowedHandles.length > 0) {
      const handlesValue = allowedHandles.map(h => JSON.stringify(h)).join(', ');
      filterArray.push(`category_handle IN [${handlesValue}]`);
    } else {
      filterArray.push(`category_handle = ${JSON.stringify(currentHandle)}`);
    }

    Object.entries(activeFilters).forEach(([key, val]) => {
      if (val) {
        filterArray.push(`'${key}' = ${JSON.stringify(val)}`);
      }
    });

    // Ustalanie sortowania dla Meilisearch
    const sortParam = searchParams.get('sort');
    let meiliSort = undefined;
    if (sortParam === 'price_asc') meiliSort = ['price:asc'];
    if (sortParam === 'price_desc') meiliSort = ['price:desc'];

    const searchResult = await index.search(searchQ, {
      limit: currentLimit,
      filter: filterArray.join(' AND '),
      sort: meiliSort,
      facets: ['Pasuje do marki', 'Pasuje do modelu', 'Typ produktu', 'Marka', 'Model', 'Producent', 'Kategoria']
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

    const meiliFacets = searchResult.facetDistribution || {};
    
    return NextResponse.json({ 
      category: dbCategoryData, 
      breadcrumbs, 
      subcategories: directSubcategories,
      filters: meiliFacets, 
      narrowedFilters: meiliFacets, 
      products: mappedProducts,
      totalCount: searchResult.estimatedTotalHits || mappedProducts.length, 
      faqs: dbCategoryData.faqs
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error("Błąd route Meilisearch:", error);
    return NextResponse.json({ 
      category: { h1_dynamic: `BŁĄD POŁĄCZENIA`, name: "Błąd serwera" }, 
      products: [], breadcrumbs: [], subcategories: [], filters: {}, narrowedFilters: {}, totalCount: 0, faqs: [] 
    }, { status: 500, headers: corsHeaders }); 
  }
}