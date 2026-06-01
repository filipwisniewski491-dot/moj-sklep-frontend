import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const revalidate = 60; // Odświeżanie cache co 60 sekund

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://49.12.69.146:9000";
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

const corsHeaders = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=3600',
  'Content-Type': 'application/json'
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fullPath = searchParams.get('fullPath'); 
  const currentLimit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 24;

  // 1. Odbiór aktywnych filtrów z URL
  const activeFilters = Object.fromEntries(searchParams.entries());
  const sort = activeFilters.sort || null;
  const minPrice = activeFilters.minPrice ? parseFloat(activeFilters.minPrice) : null;
  const maxPrice = activeFilters.maxPrice ? parseFloat(activeFilters.maxPrice) : null;
  const searchQ = activeFilters.q || "";

  // Usuwamy parametry systemowe, żeby zostały tylko te techniczne (np. "Pasuje do marki")
  ['fullPath', 'limit', 'sort', 'minPrice', 'maxPrice', 'q'].forEach(k => delete activeFilters[k]);

  if (!fullPath) return NextResponse.json({ error: "Brak ścieżki" }, { status: 400 });

  const segments = fullPath.split('/').filter(Boolean);
  const currentSlug = segments[segments.length - 1]; 

  // Inicjalizacja domyślnego obiektu kategorii (Zgodność z Twoim UI)
  let dbCategoryData = { 
    h1_dynamic: currentSlug.toUpperCase().replace(/-/g, ' '), 
    name: currentSlug.replace(/-/g, ' '), 
    top_seo_text: "", 
    bottom_seo_text: "", 
    faqs: [] 
  };
  
  let breadcrumbs: any[] = [];
  let directSubcategories: string[] = [];
  let categoryId = null;

  try {
    const headers = {
      "Content-Type": "application/json",
      ...(PUBLISHABLE_KEY ? { "x-publishable-api-key": PUBLISHABLE_KEY } : {})
    };

    // 2. Pobieranie danych Kategorii z Medusa 2.0
    const catRes = await fetch(`${MEDUSA_URL}/store/product-categories?handle=${currentSlug}`, { 
      headers, next: { revalidate: 3600 } 
    });

    if (catRes.ok) {
      const catJson = await catRes.json();
      if (catJson.product_categories && catJson.product_categories.length > 0) {
        const category = catJson.product_categories[0];
        categoryId = category.id;
        
        // Wyciąganie danych SEO z metadanych Medusy
        const meta = category.metadata || {};
        dbCategoryData.name = category.name;
        dbCategoryData.h1_dynamic = meta.h1_dynamic || category.name.toUpperCase();
        dbCategoryData.top_seo_text = meta.top_seo_text || "";
        dbCategoryData.bottom_seo_text = meta.bottom_seo_text || null;
        dbCategoryData.faqs = meta.faqs || meta.faq || [];

        // Generowanie subkategorii (jeśli Medusa zwraca dzieci)
        if (category.category_children) {
          directSubcategories = category.category_children.map((c: any) => c.name).sort();
        }
      }
    }

    // Budowanie Breadcrumbs
    let tempPath = "";
    breadcrumbs = segments.map(s => {
      tempPath = tempPath ? `${tempPath}/${s}` : s;
      return { name: s.replace(/-/g, ' ').toUpperCase(), slug: s, path: tempPath };
    });

    // 3. Pobieranie Produktów z Medusy (Faza filtrowania)
    // Z uwagi na brak zew. silnika search, pobieramy paczkę produktów dla tej kategorii i budujemy filtry w pamięci
    let productsEndpoint = `${MEDUSA_URL}/store/products?limit=250&fields=*variants,*categories`;
    if (categoryId) productsEndpoint += `&category_id[]=${categoryId}`;
    if (searchQ) productsEndpoint += `&q=${encodeURIComponent(searchQ)}`;

    const prodRes = await fetch(productsEndpoint, { headers, next: { revalidate: 60 } });
    
    if (!prodRes.ok) {
      throw new Error(`Medusa Products Error: ${prodRes.status}`);
    }

    const prodJson = await prodRes.json();
    const allProducts = prodJson.products || [];

    // 4. Budowanie silnika fasetowego w locie (Filtry atrybutów)
    const globalFilters: Record<string, Record<string, number>> = {};
    const narrowedFilters: Record<string, Record<string, number>> = {};

    let filteredProducts = allProducts.filter((p: any) => {
      const specs = p.metadata?.technical_specs || p.metadata?.attributes || {};
      const mainVariant = p.variants?.[0];
      const price = mainVariant?.calculated_price?.calculated_amount || 0; // Drafty mają 0
      
      // Zliczanie do filtrów globalnych
      Object.entries(specs).forEach(([key, val]) => {
        const strVal = String(val);
        if (!globalFilters[key]) globalFilters[key] = {};
        globalFilters[key][strVal] = (globalFilters[key][strVal] || 0) + 1;
      });

      // Filtrowanie cenowe
      if (minPrice !== null && price < minPrice) return false;
      if (maxPrice !== null && price > maxPrice) return false;

      // Filtrowanie po atrybutach technicznych z URL
      let matchesAllSpecs = true;
      for (const [activeKey, activeVal] of Object.entries(activeFilters)) {
        if (String(specs[activeKey]) !== String(activeVal)) {
          matchesAllSpecs = false;
          break;
        }
      }

      // Jeśli produkt przeszedł filtry, zlicz go do "Zawężonych filtrów"
      if (matchesAllSpecs) {
        Object.entries(specs).forEach(([key, val]) => {
          const strVal = String(val);
          if (!narrowedFilters[key]) narrowedFilters[key] = {};
          narrowedFilters[key][strVal] = (narrowedFilters[key][strVal] || 0) + 1;
        });
      }

      return matchesAllSpecs;
    });

    // Sortowanie wyników
    if (sort === 'price_asc') filteredProducts.sort((a: any, b: any) => (a.variants?.[0]?.calculated_price?.calculated_amount || 0) - (b.variants?.[0]?.calculated_price?.calculated_amount || 0));
    if (sort === 'price_desc') filteredProducts.sort((a: any, b: any) => (b.variants?.[0]?.calculated_price?.calculated_amount || 0) - (a.variants?.[0]?.calculated_price?.calculated_amount || 0));
    if (sort === 'name_asc') filteredProducts.sort((a: any, b: any) => a.title.localeCompare(b.title));

    const totalCount = filteredProducts.length;
    // Paginacja / Limit dla Frontendu
    const paginatedProducts = filteredProducts.slice(0, currentLimit);

    // 5. Mapowanie do struktury wymaganej przez CategoryClient.tsx
    const mappedProducts = paginatedProducts.map((p: any) => {
      const meta = p.metadata || {};
      const mainVariant = p.variants?.[0];
      
      // Obsługa zdjęć (Bunny.net vs natywne Medusy)
      let externalImages: string[] = meta.external_images || [];
      
      return {
        id: p.id,
        sku: mainVariant?.sku || meta.sku || 'BRAK',
        name: p.title || 'Produkt',
        price: mainVariant?.calculated_price?.calculated_amount || 0,
        slug: p.handle,
        external_images: externalImages,
        images: p.images?.map((img: any) => ({ url: img.url })) || (p.thumbnail ? [{ url: p.thumbnail }] : [])
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
      totalCount: totalCount, 
      faqs: dbCategoryData.faqs
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error("[Search Route Error]:", error);
    return NextResponse.json({ 
      category: { h1_dynamic: `BŁĄD POŁĄCZENIA: ${error.message}`, name: "ERROR" }, 
      products: [], breadcrumbs, subcategories: [], filters: {}, narrowedFilters: {}, totalCount: 0, faqs: [] 
    }, { headers: corsHeaders }); 
  }
}