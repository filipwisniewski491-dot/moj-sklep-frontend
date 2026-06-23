// app/api/search/route.ts
import { NextResponse } from 'next/server';
import { Meilisearch } from 'meilisearch';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; 

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://178.104.130.90:9000";
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

// 🚀 Inicjalizacja klienta Meilisearch po stronie serwera (bezpieczny tunel)
const meiliClient = new Meilisearch({
  host: process.env.NEXT_PUBLIC_MEILISEARCH_HOST || '',
  apiKey: process.env.NEXT_PUBLIC_MEILISEARCH_API_KEY || '',
});

const corsHeaders = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
  'Content-Type': 'application/json'
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const searchQ = searchParams.get('q') || "";
  const fullPath = searchParams.get('fullPath'); 

  // =========================================================================
  // 1. ZWROTNICA: Pasek wyszukiwarki (Live Search -> MeiliSearch)
  // Jeśli zapytanie ma tylko parametr 'q' i brak 'fullPath', to znaczy 
  // że to podpowiedzi z górnego paska.
  // =========================================================================
  if (searchQ && !fullPath) {
    try {
      const index = meiliClient.index('products');
      const searchResult = await index.search(searchQ, { 
        limit: 6 
      });
      return NextResponse.json({ hits: searchResult.hits }, { headers: corsHeaders });
    } catch (error) {
      console.error("Błąd tunelu Meilisearch:", error);
      return NextResponse.json({ hits: [] }, { status: 500, headers: corsHeaders });
    }
  }

  // =========================================================================
  // 2. ZWROTNICA: Strony Kategorii (Twój oryginalny kod -> Medusa)
  // =========================================================================
  const currentLimit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 24;
  const activeFilters = Object.fromEntries(searchParams.entries());
  const sort = activeFilters.sort || null;
  const minPrice = activeFilters.minPrice ? parseFloat(activeFilters.minPrice) : null;
  const maxPrice = activeFilters.maxPrice ? parseFloat(activeFilters.maxPrice) : null;

  // Czyścimy parametry systemowe, by zostawić tylko atrybuty do filtrowania
  ['fullPath', 'limit', 'sort', 'minPrice', 'maxPrice', 'q'].forEach(k => delete activeFilters[k]);

  if (!fullPath) {
    return NextResponse.json({ error: "Brak ścieżki (fullPath)" }, { status: 400, headers: corsHeaders });
  }

  const segments = fullPath.split('/').filter(Boolean);
  const currentHandle = segments[segments.length - 1]; 

  let dbCategoryData = { 
    h1_dynamic: currentHandle.toUpperCase().replace(/-/g, ' '), 
    name: currentHandle.replace(/-/g, ' '), 
    top_seo_text: "", 
    bottom_seo_text: "", 
    faqs: [] 
  };
  
  let breadcrumbs: any[] = [];
  let directSubcategories: string[] = [];

  try {
    const headers: any = { "Content-Type": "application/json" };
    if (PUBLISHABLE_KEY) headers["x-publishable-api-key"] = PUBLISHABLE_KEY;

    // Odpytujemy TYLKO tą jedną kategorię
    const currentCategoryRes = await fetch(`${MEDUSA_URL}/store/product-categories?handle=${encodeURIComponent(currentHandle)}`, { headers, cache: 'no-store' });
    const currentCategoryJson = await currentCategoryRes.json();
    const currentCategory = currentCategoryJson.product_categories?.[0];

    let categoryIdQuery = "";

    if (currentCategory) {
      categoryIdQuery = `&category_id[]=${currentCategory.id}`;
      
      const meta = currentCategory.metadata || {};
      dbCategoryData.name = currentCategory.name;
      dbCategoryData.h1_dynamic = meta.h1_dynamic || currentCategory.name.toUpperCase();
      dbCategoryData.top_seo_text = meta.top_seo_text || currentCategory.description || "";
      dbCategoryData.bottom_seo_text = meta.bottom_seo_text || null;
      dbCategoryData.faqs = meta.faqs || meta.faq || [];

      if (currentCategory.category_children && currentCategory.category_children.length > 0) {
        directSubcategories = currentCategory.category_children.map((child: any) => child.name).sort();
      }
    }

    let tempPath = "";
    breadcrumbs = segments.map(s => {
      tempPath = tempPath ? `${tempPath}/${s}` : s;
      return { name: s.replace(/-/g, ' ').toUpperCase(), slug: s, path: tempPath };
    });

    let productsEndpoint = `${MEDUSA_URL}/store/products?limit=${currentLimit}&fields=*variants,*categories,+metadata,+images${categoryIdQuery}`;
    
    if (searchQ) {
       productsEndpoint += `&q=${encodeURIComponent(searchQ)}`;
    }

    const prodRes = await fetch(productsEndpoint, { headers, cache: 'no-store' });
    if (!prodRes.ok) throw new Error(`Błąd pobierania produktów z Medusy: Kod ${prodRes.status}`);

    const prodJson = await prodRes.json();
    let filteredProducts = prodJson.products || [];

    const globalFilters: Record<string, Record<string, number>> = {};
    const narrowedFilters: Record<string, Record<string, number>> = {};

    filteredProducts = filteredProducts.filter((p: any) => {
      const specs = p.metadata?.technical_specs || p.metadata?.attributes || {};
      const mainVariant = p.variants?.[0];
      const price = mainVariant?.calculated_price?.calculated_amount ? (mainVariant.calculated_price.calculated_amount / 100) : 0; 
      
      Object.entries(specs).forEach(([key, val]) => {
        const strVal = String(val);
        if (!globalFilters[key]) globalFilters[key] = {};
        globalFilters[key][strVal] = (globalFilters[key][strVal] || 0) + 1;
      });

      if (minPrice !== null && price < minPrice) return false;
      if (maxPrice !== null && price > maxPrice) return false;

      let matchesAllSpecs = true;
      for (const [activeKey, activeVal] of Object.entries(activeFilters)) {
        if (String(specs[activeKey]) !== String(activeVal)) {
          matchesAllSpecs = false;
          break;
        }
      }

      if (matchesAllSpecs) {
        Object.entries(specs).forEach(([key, val]) => {
          const strVal = String(val);
          if (!narrowedFilters[key]) narrowedFilters[key] = {};
          narrowedFilters[key][strVal] = (narrowedFilters[key][strVal] || 0) + 1;
        });
      }

      return matchesAllSpecs;
    });

    if (sort === 'price_asc') filteredProducts.sort((a: any, b: any) => (a.variants?.[0]?.calculated_price?.calculated_amount || 0) - (b.variants?.[0]?.calculated_price?.calculated_amount || 0));
    if (sort === 'price_desc') filteredProducts.sort((a: any, b: any) => (b.variants?.[0]?.calculated_price?.calculated_amount || 0) - (a.variants?.[0]?.calculated_price?.calculated_amount || 0));
    if (sort === 'name_asc') filteredProducts.sort((a: any, b: any) => a.title.localeCompare(b.title));

    const mappedProducts = filteredProducts.map((p: any) => {
      const meta = p.metadata || {};
      const mainVariant = p.variants?.[0];
      
      const externalImages: string[] = meta.external_images || [];
      const finalImages = externalImages.length > 0 
        ? [{ url: externalImages[0] }] 
        : (p.images?.map((img: any) => ({ url: img.url })) || (p.thumbnail ? [{ url: p.thumbnail }] : []));
      
      return {
        id: p.id,
        sku: mainVariant?.sku || meta.sku || 'BRAK',
        name: p.title || 'Produkt Nienazwany',
        price: mainVariant?.calculated_price?.calculated_amount ? (mainVariant.calculated_price.calculated_amount / 100) : 0,
        slug: p.handle,
        external_images: externalImages,
        images: finalImages
      };
    });

    return NextResponse.json({ 
      category: dbCategoryData, 
      breadcrumbs, 
      subcategories: directSubcategories,
      filters: globalFilters, 
      narrowedFilters,
      depth: breadcrumbs.length, 
      products: mappedProducts,
      totalCount: prodJson.count || filteredProducts.length, 
      faqs: dbCategoryData.faqs
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error("[Search Route Error API Medusa]:", error);
    return NextResponse.json({ 
      category: { h1_dynamic: `BŁĄD POŁĄCZENIA Z BAZĄ`, name: "Błąd serwera" }, 
      products: [], breadcrumbs, subcategories: [], filters: {}, narrowedFilters: {}, totalCount: 0, faqs: [] 
    }, { status: 500, headers: corsHeaders }); 
  }
}