import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const backendGenerateSlug = (text: string) => {
  if (!text) return '';
  return text.toLowerCase()
    .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e')
    .replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o')
    .replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

// Inteligentny parser do czyszczenia danych typu "['Ursus', 'Zetor']"
const parseAttributeValues = (rawValue: any): string[] => {
    if (!rawValue) return [];
    let strVal = String(rawValue).trim();
    if (strVal === '-' || strVal.toLowerCase().includes('brak')) return [];
    
    // Jeśli z bazy przyszedł string wyglądający jak tablica Pythona/JSON
    if (strVal.startsWith('[') && strVal.endsWith(']')) {
        strVal = strVal.slice(1, -1); // usuń nawiasy
        return strVal.split(',').map(s => s.replace(/['"]/g, '').trim()).filter(Boolean);
    }
    
    // Zwykłe cięcie
    return strVal.split(/[,/|]/).map(v => v.trim()).filter(Boolean);
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id'); 
  const fullPath = searchParams.get('fullPath'); 
  const currentLimit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 24;

  const activeFilters = Object.fromEntries(searchParams.entries());
  const sort = activeFilters.sort || null;
  const minPrice = activeFilters.minPrice ? parseFloat(activeFilters.minPrice) : null;
  const maxPrice = activeFilters.maxPrice ? parseFloat(activeFilters.maxPrice) : null;

  const gpParamKey = Object.keys(activeFilters).find(k => k.toLowerCase() === 'grupa produktowa');
  if (gpParamKey) delete activeFilters[gpParamKey]; 

  delete activeFilters.categoryId;
  delete activeFilters.q;
  delete activeFilters.id;
  delete activeFilters.sort;
  delete activeFilters.minPrice;
  delete activeFilters.maxPrice;
  delete activeFilters.limit;
  delete activeFilters.crossSell;
  delete activeFilters.fullPath;

  const storeHash = process.env.BIGCOMMERCE_STORE_HASH;
  const bcToken = process.env.BIGCOMMERCE_ACCESS_TOKEN;
  const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://178.105.201.145:1337";
  const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN || "69c5b0f17b4011cb33911548db2286647d4965600d6ad47f07eeaeaf09ce6606da1c0fc4d78874e6d5565777a1b22027314514f3e32548b2266857e6c27fade37f1b3ea8f7bdd5027abef42abb5d29de4c9edcd5cae94e31b189347e0a99a56dae0b10cbabaef37cc6503fb143e3d269bb539acc3bbdd28e473e9ce9162a6e63";

  const getAttr = (obj: any, key: string) => {
      if (!obj) return null;
      if (obj[key] !== undefined) return obj[key];
      if (obj.technical_specs && obj.technical_specs[key] !== undefined) return obj.technical_specs[key];
      if (obj.attributes && obj.attributes[key] !== undefined) return obj.attributes[key];
      return null;
  };

  // ==========================================
  // 1. KARTA PRODUKTU (PDP)
  // ==========================================
  if (id) {
    try {
      let strapiRes = await fetch(`${STRAPI_URL}/api/products?publicationState=preview&filters[slug][$eq]=${encodeURIComponent(id)}&populate=*`, { headers: { 'Authorization': `Bearer ${STRAPI_TOKEN}` }, cache: 'no-store' });
      let strapiJson = await strapiRes.json();
      
      if (!strapiJson.data || strapiJson.data.length === 0) {
        strapiRes = await fetch(`${STRAPI_URL}/api/products?publicationState=preview&filters[sku][$eq]=${encodeURIComponent(id)}&populate=*`, { headers: { 'Authorization': `Bearer ${STRAPI_TOKEN}` }, cache: 'no-store' });
        strapiJson = await strapiRes.json();
      }
      
      let strapiProd = strapiJson.data?.[0] || null;
      let bcProd = null;
      
      if (strapiProd && strapiProd.sku) {
        const bcRes = await fetch(`https://api.bigcommerce.com/stores/${storeHash}/v3/catalog/products?sku=${encodeURIComponent(strapiProd.sku)}&include=images`, { headers: { 'X-Auth-Token': bcToken as string, 'Accept': 'application/json' }, cache: 'no-store' });
        const bcJson = await bcRes.json();
        bcProd = bcJson.data?.[0] || null;
      }
      
      if (strapiProd || bcProd) {
        const catText = getAttr(strapiProd, 'category_text') || '';
        return NextResponse.json({
          data: {
            id: strapiProd?.documentId || strapiProd?.id || bcProd?.id,
            sku: strapiProd?.sku || bcProd?.sku,
            slug: strapiProd?.slug || '',
            name: strapiProd?.seo_title || strapiProd?.name || bcProd?.name,
            price: bcProd?.price || 0, 
            description: strapiProd?.seo_description || strapiProd?.description || bcProd?.description,
            category_text: catText, 
            attributes: strapiProd?.technical_specs || strapiProd?.attributes || {},
            images: bcProd?.images || [], 
            external_images: strapiProd?.external_images || [],
            expert_advice: strapiProd?.expert_advice || null,
            symptoms: strapiProd?.symptoms || null,
            faq: strapiProd?.faq || strapiProd?.faqs || null,
            crossSell: strapiProd?.cross_sell_skus || strapiProd?.cross_sell || []
          }
        });
      }
      return NextResponse.json({ data: null }, { status: 404 });
    } catch (error) { return NextResponse.json({ data: null }, { status: 500 }); }
  }

  // ==========================================
  // 2. KATEGORIE
  // ==========================================
  if (fullPath) {
    try {
      const segments = fullPath.split('/').filter(Boolean);
      const urlDepth = segments.length;
      const currentSlug = segments[urlDepth - 1]; 
      
      let exactName = currentSlug.replace(/-/g, ' '); 
      let dbCategoryData = { h1_dynamic: "", top_seo_text: "", bottom_seo_text: "", faqs: [], name: "" };
      let exactCategoryPath = "";

      // A. WYSZUKIWANIE KATEGORII
      try {
         const catRes = await fetch(`${STRAPI_URL}/api/categories?publicationState=preview&filters[slug][$containsi]=${encodeURIComponent(currentSlug)}&pagination[pageSize]=100&populate=*`, { headers: { 'Authorization': `Bearer ${STRAPI_TOKEN}` }, cache: 'no-store' });
         const catJson = await catRes.json();
         
         if (catJson.data && catJson.data.length > 0) {
            let matchedCat = null;
            matchedCat = catJson.data.find((c: any) => {
                const p = getAttr(c, 'category_path');
                if (!p) return false;
                const sluggifiedPath = p.split('>').map((s: string) => backendGenerateSlug(s)).join('/');
                return sluggifiedPath === fullPath || sluggifiedPath.endsWith(fullPath);
            });

            if (!matchedCat && segments.length > 1) {
                const parentSlug = segments[segments.length - 2];
                matchedCat = catJson.data.find((c: any) => {
                    const p = getAttr(c, 'category_path');
                    if (!p) return false;
                    const sluggifiedPath = backendGenerateSlug(p);
                    return sluggifiedPath.includes(parentSlug);
                });
            }

            if (!matchedCat) matchedCat = catJson.data[0];

            exactName = getAttr(matchedCat, 'name') || exactName;
            dbCategoryData.name = exactName;
            dbCategoryData.h1_dynamic = getAttr(matchedCat, 'h1_dynamic') || exactName.toUpperCase();
            dbCategoryData.top_seo_text = getAttr(matchedCat, 'top_seo_text') || "";
            dbCategoryData.bottom_seo_text = getAttr(matchedCat, 'bottom_seo_text') || null;
            dbCategoryData.faqs = getAttr(matchedCat, 'faqs') || []; 
            exactCategoryPath = getAttr(matchedCat, 'category_path') || exactName;
         } else {
             const humanName = currentSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
             exactName = humanName;
             dbCategoryData.name = humanName;
             dbCategoryData.h1_dynamic = humanName.toUpperCase();
             exactCategoryPath = segments.map(s => s.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())).join(' > ');
         }
      } catch(e) { console.error(e); }

      const rawBreadcrumbs = exactCategoryPath.split('>').map((s: string) => s.trim()).filter(Boolean);
      const accumulatedSlugs: string[] = [];
      const formattedBreadcrumbs = rawBreadcrumbs.map((name) => {
          const slug = backendGenerateSlug(name);
          accumulatedSlugs.push(slug);
          return { name: name, slug: slug, path: accumulatedSlugs.join('/') };
      });

      // B. BEZPIECZNE POBIERANIE PRODUKTÓW (ZWIĘKSZONY LIMIT RÓWNOLEGŁY)
      let baseUrl = `${STRAPI_URL}/api/products?publicationState=preview&pagination[pageSize]=100&populate=*`;
      if (exactCategoryPath) {
          baseUrl += `&filters[category_text][$containsi]=${encodeURIComponent(exactCategoryPath.trim())}`;
      } else {
          baseUrl += `&filters[category_text][$containsi]=${encodeURIComponent(exactName)}`;
      }

      let firstPageRes = await fetch(`${baseUrl}&pagination[page]=1`, { headers: { 'Authorization': `Bearer ${STRAPI_TOKEN}` }, cache: 'no-store' });
      let firstPageJson = await firstPageRes.json();
      
      if (!firstPageJson.data || firstPageJson.data.length === 0) {
          let fallbackUrl = `${STRAPI_URL}/api/products?publicationState=preview&pagination[pageSize]=100&populate=*`;
          fallbackUrl += `&filters[$and][0][category_text][$containsi]=${encodeURIComponent(exactName)}`;
          if (segments.length > 1) {
              const parentName = segments[segments.length - 2].replace(/-/g, ' ');
              fallbackUrl += `&filters[$and][1][category_text][$containsi]=${encodeURIComponent(parentName)}`;
          }
          firstPageRes = await fetch(`${fallbackUrl}&pagination[page]=1`, { headers: { 'Authorization': `Bearer ${STRAPI_TOKEN}` }, cache: 'no-store' });
          firstPageJson = await firstPageRes.json();
          baseUrl = fallbackUrl;
      }

      let allCategoryProducts: any[] = [];
      if (firstPageJson.data) allCategoryProducts.push(...firstPageJson.data);

      // PARALLEL FETCHING - BŁYSKAWICZNE POBIERANIE DO 5000 PRODUKTÓW
      if (firstPageJson.meta?.pagination?.total > 100) {
        const totalPages = Math.ceil(firstPageJson.meta.pagination.total / 100);
        const maxPages = Math.min(totalPages, 50); // Maksymalnie 5000 produktów
        
        const fetchPromises = [];
        for (let page = 2; page <= maxPages; page++) {
          fetchPromises.push(
            fetch(`${baseUrl}&pagination[page]=${page}`, { headers: { 'Authorization': `Bearer ${STRAPI_TOKEN}` }, cache: 'no-store' })
            .then(res => res.ok ? res.json() : null)
            .catch(() => null)
          );
        }
        const results = await Promise.all(fetchPromises);
        results.forEach(res => {
          if (res && res.data) allCategoryProducts.push(...res.data);
        });
      }

      // C. ZBIERANIE PODKATEGORII
      const subcategories = new Set<string>();
      try {
          const subCatsRes = await fetch(`${STRAPI_URL}/api/categories?publicationState=preview&filters[category_path][$containsi]=${encodeURIComponent(exactCategoryPath + ' >')}&pagination[pageSize]=250`, { headers: { 'Authorization': `Bearer ${STRAPI_TOKEN}` }, cache: 'no-store' });
          const subCatsJson = await subCatsRes.json();
          if (subCatsJson.data) {
              subCatsJson.data.forEach((c: any) => {
                  const p = getAttr(c, 'category_path');
                  if (p) {
                      const parts = p.split('>').map((s: string) => s.trim()).filter(Boolean);
                      if (parts.length > rawBreadcrumbs.length) subcategories.add(parts[rawBreadcrumbs.length]);
                  }
              });
          }
      } catch(e) {}

      if (subcategories.size === 0) {
          allCategoryProducts.forEach((p: any) => {
              const catText = getAttr(p, 'category_text') || "";
              const parts = catText.split('>').map((s: string) => s.trim()).filter(Boolean);
              const currentIndex = parts.findIndex((part: string) => part.toLowerCase() === exactName.toLowerCase());
              if (currentIndex !== -1 && parts.length > currentIndex + 1) {
                  subcategories.add(parts[currentIndex + 1]);
              }
          });
      }

      // D. SILNIK FILTRÓW (ZALEŻNOŚCI I PARSOWANIE)
      const FORBIDDEN_KEYS = ['grupa produktowa', 'typ produktu', 'numer katalogowy', 'oem', 'numer oem', 'nr oem', 'opis', 'informacje dodatkowe', 'waga', 'wymiar', 'długość', 'szerokość', 'wysokość', 'ean', 'ilość', 'kolor'];
      
      const isForbidden = (key: string) => {
          const lowerKey = key.toLowerCase();
          if (lowerKey === 'oem' || lowerKey === 'opis' || lowerKey === 'ean') return true;
          return FORBIDDEN_KEYS.some(fk => lowerKey.includes(fk));
      };

      const productMatchesFilters = (p: any, filtersToMatch: Record<string, string>) => {
        const specs = getAttr(p, 'technical_specs') || getAttr(p, 'attributes') || {};
        
        for (const [fKey, fVal] of Object.entries(filtersToMatch)) {
            const specKey = Object.keys(specs).find(k => k.toLowerCase() === fKey.toLowerCase());
            
            // Obsługa uniwersalnych
            if (fKey.toLowerCase() === 'pasuje do marki' && fVal === 'Części uniwersalne i pozostałe') {
                if (!specKey || !specs[specKey]) return true;
                const parsed = parseAttributeValues(specs[specKey]);
                if (parsed.length === 0) return true;
                return false;
            }

            if (!specKey) return false;
            
            // Czyste dopasowywanie (rozwiązuje problem zagnieżdżonych modeli)
            const parsedValues = parseAttributeValues(specs[specKey]).map(v => v.toLowerCase());
            if (!parsedValues.includes(fVal.toLowerCase())) {
                return false;
            }
        }
        return true;
      };

      const allFilterKeys = new Set<string>();
      allFilterKeys.add('Pasuje do marki');
      allFilterKeys.add('Pasuje do modelu');

      allCategoryProducts.forEach((p: any) => {
          const specs = getAttr(p, 'technical_specs') || getAttr(p, 'attributes') || {};
          Object.keys(specs).forEach(k => {
              if (!isForbidden(k)) {
                  allFilterKeys.add(k.toLowerCase() === 'pasuje do marki' ? 'Pasuje do marki' : k.toLowerCase() === 'pasuje do modelu' ? 'Pasuje do modelu' : k);
              }
          });
      });

      const optimizedFilters: Record<string, Record<string, number>> = {};
      allFilterKeys.forEach(filterKey => {
          const otherActiveFilters = { ...activeFilters };
          delete otherActiveFilters[filterKey];
          
          // Izoluje produkty, żeby Modele zgadzały się z wybraną Marką
          const matchingProductsForThisKey = allCategoryProducts.filter(p => productMatchesFilters(p, otherActiveFilters));

          matchingProductsForThisKey.forEach(p => {
              const specs = getAttr(p, 'technical_specs') || getAttr(p, 'attributes') || {};
              const specKey = Object.keys(specs).find(k => k.toLowerCase() === filterKey.toLowerCase());
              
              let valuesToProcess: string[] = [];
              const rawParsed = parseAttributeValues(specKey ? specs[specKey] : null);

              if (filterKey.toLowerCase() === 'pasuje do marki') {
                  if (rawParsed.length === 0) {
                      valuesToProcess = ['Części uniwersalne i pozostałe'];
                  } else {
                      valuesToProcess = rawParsed;
                  }
              } else {
                  if (rawParsed.length === 0) return;
                  valuesToProcess = rawParsed;
              }

              valuesToProcess.forEach(value => {
                  if (value.length < 2) return;
                  // Kapitalizacja i standaryzacja
                  const standardValue = value.charAt(0).toUpperCase() + value.slice(1);
                  if (!optimizedFilters[filterKey]) optimizedFilters[filterKey] = {};
                  optimizedFilters[filterKey][standardValue] = (optimizedFilters[filterKey][standardValue] || 0) + 1;
              });
          });
      });

      let filteredProducts = allCategoryProducts.filter(p => productMatchesFilters(p, activeFilters));
      const skus = filteredProducts.map((p: any) => p.sku).filter(Boolean);
      
      let bcProducts: any[] = [];
      if (skus.length > 0) {
        // Porcjowanie po 200 sku z uwagi na limity BigCommerce
        const limitBc = skus.slice(0, currentLimit + 50); 
        try {
          const bcRes = await fetch(`https://api.bigcommerce.com/stores/${storeHash}/v3/catalog/products?sku:in=${limitBc.join(',')}&include=images`, { headers: { 'X-Auth-Token': bcToken as string, 'Accept': 'application/json' }, cache: 'no-store' });
          const bcJson = await bcRes.json();
          bcProducts = bcJson.data || [];
        } catch(e) {}
      }

      let mappedProducts = filteredProducts.map((item: any) => {
        const sku = item.sku;
        const bcMatch = bcProducts.find((bc: any) => bc.sku === sku);
        return {
          id: item.documentId || item.id || sku,
          sku: sku || 'BRAK-SKU',
          name: item.seo_title || item.name || bcMatch?.name || 'Produkt',
          price: bcMatch?.price || 0,
          slug: item.slug || sku,
          external_images: item.external_images || [],
          images: bcMatch?.images || []
        };
      });

      if (minPrice !== null) mappedProducts = mappedProducts.filter((p: any) => p.price >= minPrice);
      if (maxPrice !== null) mappedProducts = mappedProducts.filter((p: any) => p.price <= maxPrice);
      if (sort === 'price_asc') mappedProducts.sort((a: any, b: any) => a.price - b.price);
      else if (sort === 'price_desc') mappedProducts.sort((a: any, b: any) => b.price - a.price);
      else if (sort === 'name_asc') mappedProducts.sort((a: any, b: any) => a.name.localeCompare(b.name));

      return NextResponse.json({ 
        category: dbCategoryData,
        breadcrumbs: formattedBreadcrumbs,
        subcategories: Array.from(subcategories).sort(),
        filters: optimizedFilters, 
        depth: formattedBreadcrumbs.length,
        products: mappedProducts.slice(0, currentLimit),
        totalCount: mappedProducts.length, // Teraz ten licznik pokaże prawdziwą skalę z bazy
        faqs: dbCategoryData.faqs
      });

    } catch (error) { 
        return NextResponse.json({ category: null, products: [], breadcrumbs: [], subcategories: [], totalCount: 0, faqs: [] }); 
    }
  }

  return NextResponse.json({ data: [] });
}