// w funkcji GET, zaraz na początku:
console.log("DEBUG_MEILI_URL:", process.env.MEILI_URL);
console.log("DEBUG_STRAPI_URL:", process.env.NEXT_PUBLIC_STRAPI_URL);

import { NextResponse } from 'next/server';

export const revalidate = 0; 
export const dynamic = 'force-dynamic';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://178.105.201.145:1337";
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN || "cda26b3506e41733176d80f44770d5a02c643d326b2432aa8acaee1a1a3af69677b12e05113442adebb493643bcc1d1080cae96e51ab8c5ca1b8c30cda8c26ff653ddb8ba171fe5d7569bf2faa5c6a971f2db70904cc3011b34bbaa095650c3d9138f6b360be2ef247b9c6153fb3bd90aeaa2a878ae7f2cd79d2ed2878e7f79a";
const MEILI_URL = process.env.MEILI_URL || "http://178.105.201.145:7700";
const MEILI_KEY = process.env.MEILI_MASTER_KEY || "0d1f6d31c3d8cc16ca866cfafa46271b";

const getAttr = (obj: any, key: string) => obj?.[key] ?? obj?.attributes?.[key] ?? null;

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
    // 1. Zbuduj perfekcyjne Breadcrumbs z polskimi znakami pobierając z bazy wszystkie rodzice
    const segQuery = segments.map((s, i) => `filters[slug][$in][${i}]=${s}`).join('&');
    const breadRes = await fetch(`${STRAPI_URL}/api/categories?${segQuery}&pagination[pageSize]=50`, { headers: { 'Authorization': `Bearer ${STRAPI_TOKEN}` }, cache: 'no-store' });
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

    // 2. Pobierz aktualną kategorię
    const catRes = await fetch(`${STRAPI_URL}/api/categories?filters[slug][$eq]=${currentSlug}&populate=*`, { headers: { 'Authorization': `Bearer ${STRAPI_TOKEN}` }, cache: 'no-store' });
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
                const subRes = await fetch(`${STRAPI_URL}/api/categories?filters[category_path][$startsWith]=${realPath}&pagination[pageSize]=1000`, { headers: { 'Authorization': `Bearer ${STRAPI_TOKEN}` }, cache: 'no-store' });
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
  } catch (e) { console.error("Strapi fetch error", e); }

  if (breadcrumbs.length === 0) {
      let tempP = "";
      breadcrumbs = segments.map(s => { tempP = tempP ? `${tempP}/${s}` : s; return { name: s.replace(/-/g, ' '), slug: s, path: tempP }; });
  }

  if (allTargetCategories.size === 0) allTargetCategories.add(dbCategoryData.name);

  // 3. MEILISEARCH MULTI-SEARCH (Globalne filtry vs Przefiltrowane Produkty)
  try {
      const categoryConditions = Array.from(allTargetCategories).map(c => `category = "${c.replace(/"/g, '\\"')}"`).join(" OR ");
      const baseCategoryFilter = `(${categoryConditions})`;
      
      let activeFilterArray = [baseCategoryFilter];
      Object.entries(activeFilters).forEach(([key, val]) => activeFilterArray.push(`"${key}" = "${val}"`));
      if (minPrice !== null) activeFilterArray.push(`price >= ${minPrice}`);
      if (maxPrice !== null) activeFilterArray.push(`price <= ${maxPrice}`);

      let meiliSort = undefined;
      if (sort === 'price_asc') meiliSort = ['price:asc'];
      if (sort === 'price_desc') meiliSort = ['price:desc'];
      if (sort === 'name_asc') meiliSort = ['title:asc'];

      // Równoległe zapytania do Meilisearch
      const [productsRes, facetsRes] = await Promise.all([
        fetch(`${MEILI_URL}/indexes/products/search`, {
          method: 'POST', headers: { 'Authorization': `Bearer ${MEILI_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: searchQ, filter: activeFilterArray, limit: currentLimit, sort: meiliSort }), cache: 'no-store' 
        }),
        fetch(`${MEILI_URL}/indexes/products/search`, {
          method: 'POST', headers: { 'Authorization': `Bearer ${MEILI_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: searchQ, filter: [baseCategoryFilter], limit: 0, facets: ["*"] }), cache: 'no-store' 
        })
      ]);

      const meiliData = await productsRes.json();
      const facetsData = await facetsRes.json();
      const globalFilters = facetsData.facetDistribution || {};

      // Pancerne przetwarzanie zdjęć 
      const mappedProducts = meiliData.hits.map((hit: any) => {
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
      });

      return NextResponse.json({ 
        category: dbCategoryData, 
        breadcrumbs, 
        subcategories: Array.from(directSubcategories).sort(),
        filters: globalFilters, // Zwracamy CZYSTE globalne filtry
        depth: breadcrumbs.length, 
        products: mappedProducts,
        totalCount: meiliData.estimatedTotalHits || meiliData.totalHits || 0, 
        faqs: dbCategoryData.faqs
      });
  } catch (error) {
      return NextResponse.json({ category: dbCategoryData, products: [], breadcrumbs: [], subcategories: [], filters: {}, totalCount: 0, faqs: [] }); 
  }
}