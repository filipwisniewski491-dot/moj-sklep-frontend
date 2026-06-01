import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; 
export const revalidate = 0; 

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://49.12.69.146:9000";
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

const corsHeaders = {
  'Cache-Control': 'no-store, max-age=0',
  'Content-Type': 'application/json'
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fullPath = searchParams.get('fullPath'); 
  const currentLimit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 24;

  const activeFilters = Object.fromEntries(searchParams.entries());
  const sort = activeFilters.sort || null;
  const minPrice = activeFilters.minPrice ? parseFloat(activeFilters.minPrice) : null;
  const maxPrice = activeFilters.maxPrice ? parseFloat(activeFilters.maxPrice) : null;
  const searchQ = activeFilters.q || "";

  ['fullPath', 'limit', 'sort', 'minPrice', 'maxPrice', 'q'].forEach(k => delete activeFilters[k]);

  if (!fullPath) return NextResponse.json({ error: "Brak ścieżki" }, { status: 400 });

  const segments = fullPath.split('/').filter(Boolean);
  const currentSlug = segments[segments.length - 1]; 

  let dbCategoryData = { 
    h1_dynamic: currentSlug.toUpperCase().replace(/-/g, ' '), 
    name: currentSlug.replace(/-/g, ' '), 
    top_seo_text: "", 
    bottom_seo_text: "", 
    faqs: [] 
  };
  
  let breadcrumbs: any[] = [];
  let directSubcategories: string[] = [];
  let allCategoryIdsForProducts: string[] = [];

  try {
    const headers: any = { "Content-Type": "application/json" };
    if (PUBLISHABLE_KEY) headers["x-publishable-api-key"] = PUBLISHABLE_KEY;

    // 1. PĘTLA POBIERAJĄCA WSZYSTKIE 1087 KATEGORII (Omijamy blokadę Medusy)
    let allCategories: any[] = [];
    let offset = 0;
    const fetchLimit = 250;
    let hasMore = true;

    while (hasMore) {
      const allCatsRes = await fetch(`${MEDUSA_URL}/store/product-categories?limit=${fetchLimit}&offset=${offset}&fields=+metadata`, { 
        headers, cache: 'no-store' 
      });
      
      if (!allCatsRes.ok) break;

      const allCatsJson = await allCatsRes.json();
      const batch = allCatsJson.product_categories || [];
      allCategories = allCategories.concat(batch);

      // Jeśli paczka ma mniej niż limit, to znaczy, że dobrnęliśmy do końca
      if (batch.length < fetchLimit) {
        hasMore = false;
      } else {
        offset += fetchLimit;
      }
    }

    // 2. SZUKAMY OBECNEJ KATEGORII
    const currentCategory = allCategories.find((c: any) => c.handle === currentSlug);

    if (currentCategory) {
      allCategoryIdsForProducts.push(currentCategory.id);
      
      const meta = currentCategory.metadata || {};
      dbCategoryData.name = currentCategory.name;
      dbCategoryData.h1_dynamic = meta.h1_dynamic || currentCategory.name.toUpperCase();
      dbCategoryData.top_seo_text = meta.top_seo_text || "";
      dbCategoryData.bottom_seo_text = meta.bottom_seo_text || null;
      dbCategoryData.faqs = meta.faqs || meta.faq || [];

      // 3. WYCIĄGAMY BEZPOŚREDNIE DZIECI (np. L3 dla strony L2)
      const children = allCategories.filter((c: any) => c.parent_category_id === currentCategory.id);
      directSubcategories = children.map((c: any) => c.name).sort();

      // 4. REKURENCJA: Zbieramy ID wszystkich wnuków, żeby L1 miało swoje produkty
      const findDescendants = (parentId: string) => {
        const subCats = allCategories.filter((c: any) => c.parent_category_id === parentId);
        subCats.forEach((child: any) => {
          allCategoryIdsForProducts.push(child.id);
          findDescendants(child.id);
        });
      };
      findDescendants(currentCategory.id);
    }

    let tempPath = "";
    breadcrumbs = segments.map(s => {
      tempPath = tempPath ? `${tempPath}/${s}` : s;
      return { name: s.replace(/-/g, ' ').toUpperCase(), slug: s, path: tempPath };
    });

    // 5. POBIERANIE PRODUKTÓW
    let productsEndpoint = `${MEDUSA_URL}/store/products?limit=250&fields=*variants,*categories,+metadata,+images`;
    
    // Pakujemy znalezione podkategorie do zapytania (Max 120, by uniknąć błędu za długiego linku URI)
    if (allCategoryIdsForProducts.length > 0) {
      const safeIds = allCategoryIdsForProducts.slice(0, 120);
      safeIds.forEach(id => {
        productsEndpoint += `&category_id[]=${id}`;
      });
    }
    
    if (searchQ) productsEndpoint += `&q=${encodeURIComponent(searchQ)}`;

    const prodRes = await fetch(productsEndpoint, { headers, cache: 'no-store' });
    
    if (!prodRes.ok) throw new Error(`Medusa Products Error: ${prodRes.status}`);

    const prodJson = await prodRes.json();
    const allProducts = prodJson.products || [];

    const globalFilters: Record<string, Record<string, number>> = {};
    const narrowedFilters: Record<string, Record<string, number>> = {};

    let filteredProducts = allProducts.filter((p: any) => {
      const specs = p.metadata?.technical_specs || p.metadata?.attributes || {};
      const mainVariant = p.variants?.[0];
      const price = mainVariant?.calculated_price?.calculated_amount || 0; 
      
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

    const totalCount = filteredProducts.length;
    const paginatedProducts = filteredProducts.slice(0, currentLimit);

    const mappedProducts = paginatedProducts.map((p: any) => {
      const meta = p.metadata || {};
      const mainVariant = p.variants?.[0];
      
      const externalImages: string[] = meta.external_images || [];
      const finalImages = externalImages.length > 0 
        ? [{ url: externalImages[0] }] 
        : (p.images?.map((img: any) => ({ url: img.url })) || (p.thumbnail ? [{ url: p.thumbnail }] : []));
      
      return {
        id: p.id,
        sku: mainVariant?.sku || meta.sku || 'BRAK',
        name: p.title || 'Produkt',
        price: mainVariant?.calculated_price?.calculated_amount || 0,
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