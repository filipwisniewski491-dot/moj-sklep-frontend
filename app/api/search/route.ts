import { NextResponse } from 'next/server';

// 1. TWARDE WYMUSZENIE ŚRODOWISKA NODE.JS (Zdejmuje blokadę IP na Vercelu)
export const runtime = 'nodejs';

// 2. WŁĄCZAMY CACHE NA 1 GODZINĘ (Błyskawiczne ładowanie kolejnych wejść)
export const revalidate = 3600; 

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://178.105.201.145:1337";
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;
const MEILI_URL = process.env.MEILI_URL || "http://178.105.201.145:7700";
const MEILI_KEY = process.env.MEILI_MASTER_KEY;

const getAttr = (obj: any, key: string) => obj?.[key] ?? obj?.attributes?.[key] ?? null;

// NAGŁÓWKI CACHE CDN - Wymuszają zapis na serwerach Vercela na całym świecie
const corsHeaders = {
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
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

  let dbCategoryData = { h1_dynamic: currentSlug.toUpperCase(), name: currentSlug, top_seo_text: "", bottom_seo_text: "", faqs: [] };
  let allTargetCategories = new Set<string>();
  let directSubcategories = new Set<string>();
  let breadcrumbs: any[] = [];

  try {
    const segQuery = segments.map((s, i) => `filters[slug][$in][${i}]=${s}`).join('&');
    
    // ZRÓWNOLEGLENIE ZAPYTAŃ DO STRAPI
    const [breadRes, catRes] = await Promise.all([
      fetch(`${STRAPI_URL}/api/categories?${segQuery}&pagination[pageSize]=50`, { headers: { 'Authorization': `Bearer ${STRAPI_TOKEN}` }, next: { revalidate: 3600 } }),
      fetch(`${STRAPI_URL}/api/categories?filters[slug][$eq]=${currentSlug}&populate=*`, { headers: { 'Authorization': `Bearer ${STRAPI_TOKEN}` }, next: { revalidate: 3600 } })
    ]);
    
    if (breadRes.ok) {
        const breadData = await breadRes.json();
        const nameMap = new Map();
        if (breadData.data) {
            breadData.data.forEach((c: any) => nameMap.set(getAttr(c, 'slug'), getAttr(c, 'name')));
        }
        let tempPath = "";
        breadcrumbs = segments.map(s => {
            tempPath = tempPath ? `${tempPath}/${s}` : s;
            return { name: (nameMap.get(s) || s.replace(/-/g, ' ')).toUpperCase(), slug: s, path: tempPath };
        });
    }

    if (catRes.ok) {
        const catJson = await catRes.json();
        if (catJson.data && catJson.data.length > 0) {
            const mainCat = catJson.data[0];
            dbCategoryData.name = getAttr(mainCat, 'name') || currentSlug;
            dbCategoryData.h1_dynamic = getAttr(mainCat, 'h1_dynamic') || dbCategoryData.name.toUpperCase();
            dbCategoryData.top_seo_text = getAttr(mainCat, 'top_seo_text') || "";
            dbCategoryData.bottom_seo_text = getAttr(mainCat, 'bottom_seo_text') || null;
            dbCategoryData.faqs = getAttr(mainCat, 'faqs') || [];
            allTargetCategories.add(dbCategoryData.name);
            
            const realPath = getAttr(mainCat, 'category_path');
            if (realPath) {
                const subRes = await fetch(`${STRAPI_URL}/api/categories?filters[category_path][$startsWith]=${realPath}&pagination[pageSize]=1000`, { headers: { 'Authorization': `Bearer ${STRAPI_TOKEN}` }, next: { revalidate: 3600 } });
                if (subRes.ok) {
                    const subJson = await subRes.json();
                    if (subJson.data) {
                        subJson.data.forEach((c: any) => {
                            const childName = getAttr(c, 'name');
                            const childPath = getAttr(c, 'category_path');
                            if (childName) allTargetCategories.add(childName);
                            if (childPath && childPath !== realPath) {
                                const depthDiff = childPath.split('/').length - realPath.split('/').length;
                                if (depthDiff === 1) directSubcategories.add(childName);
                            }
                        });
                    }
                }
            }
        }
    }
  } catch (e: any) { 
      return NextResponse.json({ 
        category: { h1_dynamic: `BŁĄD STRAPI: ${e.message}`, name: "ERROR" }, products: [], breadcrumbs: [], subcategories: [], filters: {}, totalCount: 0, faqs: [] 
      }, { headers: corsHeaders }); 
  }

  if (breadcrumbs.length === 0) {
      let tempP = "";
      breadcrumbs = segments.map(s => { tempP = tempP ? `${tempP}/${s}` : s; return { name: s.replace(/-/g, ' '), slug: s, path: tempP }; });
  }

  if (allTargetCategories.size === 0) allTargetCategories.add(dbCategoryData.name);

  try {
      // OPTYMALIZACJA: Błyskawiczny operator IN dla MeiliSearch
      const categoriesArray = Array.from(allTargetCategories).map(c => `"${c.replace(/"/g, '\\"')}"`);
      const baseCategoryFilter = `category IN [${categoriesArray.join(", ")}]`;
      
      let activeFilterArray = [baseCategoryFilter];
      Object.entries(activeFilters).forEach(([key, val]) => activeFilterArray.push(`"${key}" = "${val}"`));
      if (minPrice !== null) activeFilterArray.push(`price >= ${minPrice}`);
      if (maxPrice !== null) activeFilterArray.push(`price <= ${maxPrice}`);

      let meiliSort = undefined;
      if (sort === 'price_asc') meiliSort = ['price:asc'];
      if (sort === 'price_desc') meiliSort = ['price:desc'];
      if (sort === 'name_asc') meiliSort = ['title:asc'];

      if (!MEILI_KEY) throw new Error("Brak klucza MEILI_MASTER_KEY na Vercelu!");

      const [productsRes, facetsRes] = await Promise.all([
        fetch(`${MEILI_URL}/indexes/products/search`, {
          method: 'POST', headers: { 'Authorization': `Bearer ${MEILI_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: searchQ, filter: activeFilterArray, limit: currentLimit, sort: meiliSort }), 
          next: { revalidate: 60 } 
        }),
        fetch(`${MEILI_URL}/indexes/products/search`, {
          method: 'POST', headers: { 'Authorization': `Bearer ${MEILI_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: searchQ, filter: [baseCategoryFilter], limit: 0, facets: ["*"] }), 
          next: { revalidate: 3600 } 
        })
      ]);

      if (!productsRes.ok) {
          const errTxt = await productsRes.text();
          throw new Error(`Meili Error: ${productsRes.status} - ${errTxt}`);
      }

      const meiliData = await productsRes.json();
      const facetsData = await facetsRes.json();
      const globalFilters = facetsData.facetDistribution || {};

      const mappedProducts = meiliData.hits?.map((hit: any) => {
        let externalImages: string[] = [];
        if (hit.image) {
            if (typeof hit.image === 'string') {
                try { externalImages = hit.image.startsWith('[') ? JSON.parse(hit.image) : [hit.image]; } 
                catch (e) { externalImages = [hit.image]; }
            } else if (Array.isArray(hit.image)) {
                externalImages = hit.image;
            }
        }
        return {
            id: hit.id, sku: hit.sku || 'BRAK', name: hit.title || 'Produkt', price: hit.price || 0, slug: hit.slug || hit.sku, 
            external_images: externalImages, images: hit.images || []
        };
      }) || [];

      // ZWRACAMY WYNIK Z NAGŁÓWKAMI CDN
      return NextResponse.json({ 
        category: dbCategoryData, 
        breadcrumbs, 
        subcategories: Array.from(directSubcategories).sort(),
        filters: globalFilters, 
        depth: breadcrumbs.length, 
        products: mappedProducts,
        totalCount: meiliData.estimatedTotalHits || meiliData.totalHits || 0, 
        faqs: dbCategoryData.faqs
      }, { headers: corsHeaders });

  } catch (error: any) {
      return NextResponse.json({ 
        category: { h1_dynamic: `BŁĄD MEILI: ${error.message}`, name: "ERROR" }, 
        products: [], breadcrumbs: [], subcategories: [], filters: {}, totalCount: 0, faqs: [] 
      }, { headers: corsHeaders }); 
  }
}