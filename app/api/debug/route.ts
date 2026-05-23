import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q'); // Nowa lokalna wyszukiwarka
  const id = searchParams.get('id'); 
  const categoryId = searchParams.get('categoryId');
  const currentLimit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 24;

  const activeFilters = Object.fromEntries(searchParams.entries());
  const sort = activeFilters.sort || null;
  const minPrice = activeFilters.minPrice ? parseFloat(activeFilters.minPrice) : null;
  const maxPrice = activeFilters.maxPrice ? parseFloat(activeFilters.maxPrice) : null;
  
  let activeL3 = null;
  const gpParamKey = Object.keys(activeFilters).find(k => k.toLowerCase() === 'grupa produktowa');
  if (gpParamKey) {
     activeL3 = activeFilters[gpParamKey];
     delete activeFilters[gpParamKey]; 
  }

  delete activeFilters.categoryId;
  delete activeFilters.q;
  delete activeFilters.id;
  delete activeFilters.sort;
  delete activeFilters.minPrice;
  delete activeFilters.maxPrice;
  delete activeFilters.limit;

  const storeHash = process.env.BIGCOMMERCE_STORE_HASH;
  const bcToken = process.env.BIGCOMMERCE_ACCESS_TOKEN;
  const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";
  const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN || "0ebf60ed67ac356c914f79c119ffeeec80dd776e8619895f964e2d7776774f0884b13be7b70b0a4b499b0aed8975d48bf03851b18bd2529654ff7413ef4ec684b3642917f54d768dbfb5f5773fc70c4c3eb83e2922fcaccf35e76d0294324a30203019f581c8b30fe978a95f0ca8b11d22aa124d119b314e3d727d8abb90777d";

  // --- KARTA PRODUKTU ---
  if (id) {
    try {
      let strapiRes = await fetch(`${STRAPI_URL}/api/products?filters[slug][$eq]=${encodeURIComponent(id)}&publicationState=preview&populate=*`, { headers: { 'Authorization': `Bearer ${STRAPI_TOKEN}` }, cache: 'no-store' });
      let strapiJson = await strapiRes.json();
      if (!strapiJson.data || strapiJson.data.length === 0) {
        strapiRes = await fetch(`${STRAPI_URL}/api/products?filters[sku][$eq]=${encodeURIComponent(id)}&publicationState=preview&populate=*`, { headers: { 'Authorization': `Bearer ${STRAPI_TOKEN}` }, cache: 'no-store' });
        strapiJson = await strapiRes.json();
      }
      let strapiProd = strapiJson.data?.[0] || null;
      let bcProd = null;
      if (strapiProd && strapiProd.sku) {
        const bcRes = await fetch(`https://api.bigcommerce.com/stores/${storeHash}/v3/catalog/products?sku=${encodeURIComponent(strapiProd.sku)}&include=images`, { headers: { 'X-Auth-Token': bcToken as string, 'Accept': 'application/json' } });
        const bcJson = await bcRes.json();
        bcProd = bcJson.data?.[0] || null;
      }
      if (strapiProd || bcProd) {
        return NextResponse.json({
          data: {
            id: strapiProd?.documentId || strapiProd?.id || bcProd?.id,
            sku: strapiProd?.sku || bcProd?.sku,
            slug: strapiProd?.slug || '',
            name: strapiProd?.seo_title || strapiProd?.name || bcProd?.name,
            price: bcProd?.price || 0, 
            description: strapiProd?.seo_description || strapiProd?.description || bcProd?.description,
            attributes: strapiProd?.technical_specs || strapiProd?.attributes || {},
            images: bcProd?.images || [], 
            external_images: strapiProd?.external_images || [] 
          }
        });
      }
      return NextResponse.json({ data: null }, { status: 404 });
    } catch (error) { return NextResponse.json({ data: null }, { status: 500 }); }
  }

  // --- STRONA KATEGORII ---
  if (categoryId) {
    try {
      let cleanCategoryName = decodeURIComponent(categoryId);
      if (cleanCategoryName.includes('%')) cleanCategoryName = decodeURIComponent(cleanCategoryName);
      
      const baseUrl = `${STRAPI_URL}/api/products?filters[category_text][$containsi]=${encodeURIComponent(cleanCategoryName.trim())}&populate=*&pagination[pageSize]=100`;

      const firstPageRes = await fetch(`${baseUrl}&pagination[page]=1`, { headers: { 'Authorization': `Bearer ${STRAPI_TOKEN}` }, cache: 'no-store' });
      const firstPageJson = await firstPageRes.json();
      
      let allCategoryProducts = firstPageJson.data || [];
      const totalInPim = firstPageJson.meta?.pagination?.total || 0;

      if (allCategoryProducts.length === 0) return NextResponse.json({ category: { h1_dynamic: cleanCategoryName }, products: [], filters: {}, breadcrumbs: [], subcategories: [], depth: 1, totalCount: 0 });

      if (totalInPim > 100) {
        const maxPages = Math.min(Math.ceil(totalInPim / 100), 15); 
        const promises = [];
        for (let page = 2; page <= maxPages; page++) {
          promises.push(fetch(`${baseUrl}&pagination[page]=${page}`, { headers: { 'Authorization': `Bearer ${STRAPI_TOKEN}` }, cache: 'no-store' }).then(res => res.json()));
        }
        const chunks = await Promise.all(promises);
        chunks.forEach(chunk => { if (chunk.data) allCategoryProducts.push(...chunk.data); });
      }

      // NOWOŚĆ: WYSZUKIWARKA LOKALNA (OEM / Nazwa / SKU) w obrębie kategorii
      if (query) {
         const qLow = query.toLowerCase();
         allCategoryProducts = allCategoryProducts.filter((p: any) => {
            const name = (p.name || p.seo_title || '').toLowerCase();
            const sku = (p.sku || '').toLowerCase();
            const specs = p.technical_specs || p.attributes || {};
            // Szukamy klucza oem
            const oemKey = Object.keys(specs).find(k => k.toLowerCase().includes('oem') || k.toLowerCase().includes('numer'));
            const oem = oemKey ? String(specs[oemKey]).toLowerCase() : '';
            return name.includes(qLow) || sku.includes(qLow) || oem.includes(qLow);
         });
      }

      let depth = 1;
      const firstMatch = allCategoryProducts.find((p: any) => p.category_text?.toLowerCase().includes(cleanCategoryName.toLowerCase()));
      if (firstMatch) {
        const parts = firstMatch.category_text.split('>').map((s: string) => s.trim().toLowerCase());
        if (parts.length > 1 && parts[1] === cleanCategoryName.toLowerCase()) depth = 2;
      }
      if (activeL3) depth = 3;

      const subcategories = new Set<string>();
      if (depth === 1) {
         allCategoryProducts.forEach((p: any) => {
            const parts = (p.category_text || "").split('>').map((s: string) => s.trim());
            if (parts.length > 1) subcategories.add(parts[1]);
         });
      } else {
         allCategoryProducts.forEach((p: any) => {
            const specs = p.technical_specs || p.attributes || {};
            const gpKey = Object.keys(specs).find(k => k.toLowerCase() === 'grupa produktowa');
            if (gpKey && specs[gpKey]) subcategories.add(String(specs[gpKey]).trim());
         });
      }

      let baseProducts = allCategoryProducts;
      if (depth === 3 && activeL3) {
         baseProducts = allCategoryProducts.filter((p: any) => {
            const specs = p.technical_specs || p.attributes || {};
            const gpKey = Object.keys(specs).find(k => k.toLowerCase() === 'grupa produktowa');
            return gpKey && String(specs[gpKey]).trim().toLowerCase() === activeL3?.toLowerCase();
         });
      }

      let rawFilters: Record<string, Record<string, number>> = {};
      const FORBIDDEN_KEYS = ['grupa produktowa', 'typ produktu', 'numer katalogowy', 'oem', 'numer oem', 'waga', 'wymiar', 'długość', 'szerokość', 'wysokość', 'ean', 'ilość', 'kolor'];
      const FORBIDDEN_VALUES = ['brak danych', 'brak', '-', 'n/a', 'null', 'undefined', 'nieokreślona', 'nieokreślony', 'uniwersalny', 'uniwersalna', 'pozostałe', 'polski', 'polska', 'inne'];
      
      baseProducts.forEach((p: any) => {
        const specs = p.technical_specs || p.attributes || {};
        Object.keys(specs).forEach(key => {
          if (FORBIDDEN_KEYS.some(fk => key.toLowerCase().includes(fk))) return;
          let rawValue = String(specs[key]).trim();
          if (!rawValue || FORBIDDEN_VALUES.includes(rawValue.toLowerCase())) return;

          let finalKey = key;
          if (key.toLowerCase() === 'pasuje do marki') finalKey = 'Pasuje do marki';
          if (key.toLowerCase() === 'pasuje do modelu') finalKey = 'Pasuje do modelu';

          let valuesArray = rawValue.split(/[,/]/).map(v => v.trim());

          valuesArray.forEach(value => {
              if (!value || value.length < 2) return;
              if (finalKey.toLowerCase() !== 'kategoria zaczepu (kat.)' && value.length < 4 && /\d/.test(value)) return;

              if (finalKey === 'Pasuje do marki' || finalKey.toLowerCase() === 'marka') {
                  const vLow = value.toLowerCase();
                  if (vLow.includes('elmot')) value = 'ELMOT';
                  else if (vLow.includes('zetor')) value = 'Zetor';
                  else if (vLow.includes('ursus')) value = 'Ursus';
                  else if (vLow === 'mf' || vLow.includes('massey')) value = 'Massey Ferguson';
                  else if (vLow.includes('john deere')) value = 'John Deere';
                  else if (vLow.includes('fendt')) value = 'Fendt';
                  else if (vLow.includes('case')) value = 'Case IH';
                  else if (vLow.includes('andoria')) value = 'ANDORIA';
                  else if (vLow.includes('archimedes')) value = 'ARCHIMEDES';
                  else if (vLow.includes('rolmus')) value = 'ROLMUS';
                  else if (vLow.includes('bizon')) value = 'Bizon';
                  else if (vLow.includes('mtz')) value = 'MTZ';
                  else if (vLow.includes('władimirec')) value = 'Władimirec';
                  else value = value.charAt(0).toUpperCase() + value.slice(1);
              }
              
              if (value.length > 30) return;

              if (!rawFilters[finalKey]) rawFilters[finalKey] = {};
              if (!rawFilters[finalKey][value]) rawFilters[finalKey][value] = 0;
              rawFilters[finalKey][value]++;
          });
        });
      });

      Object.keys(rawFilters).forEach(key => {
        Object.keys(rawFilters[key]).forEach(val => { if (rawFilters[key][val] < 2) delete rawFilters[key][val]; });
        if (Object.keys(rawFilters[key]).length <= 1) delete rawFilters[key];
      });

      const optimizedFilters: Record<string, Record<string, number>> = {};
      const MUST_HAVE = ['Pasuje do marki', 'Pasuje do modelu'];
      MUST_HAVE.forEach(k => {
         if (rawFilters[k]) {
            optimizedFilters[k] = rawFilters[k];
            delete rawFilters[k];
         }
      });

      if (depth >= 2) {
         const limitTech = depth === 3 ? 5 : 3; 
         const coverageArray = Object.keys(rawFilters).map(key => {
            const coverage = Object.values(rawFilters[key]).reduce((a,b) => a+b, 0);
            return { key, coverage };
         });
         coverageArray.sort((a,b) => b.coverage - a.coverage).slice(0, limitTech).forEach(item => {
            optimizedFilters[item.key] = rawFilters[item.key];
         });
      }

      let filteredProducts = baseProducts;
      if (Object.keys(activeFilters).length > 0) {
        filteredProducts = filteredProducts.filter((p: any) => {
          const specs = p.technical_specs || p.attributes || {};
          for (const key in activeFilters) {
            const specKey = Object.keys(specs).find(k => k.toLowerCase() === key.toLowerCase());
            if (!specKey) return false;

            let rawValue = String(specs[specKey]).trim();
            let valuesArray = rawValue.split(/[,/]/).map(v => v.trim());
            let filterValue = String(activeFilters[key]).trim().toLowerCase();

            let matchFound = false;
            for (let v of valuesArray) {
               let vLow = v.toLowerCase();
               if (vLow.includes('elmot')) v = 'elmot';
               else if (vLow.includes('zetor')) v = 'zetor';
               else if (vLow.includes('ursus')) v = 'ursus';
               else if (vLow === 'mf' || vLow.includes('massey')) v = 'massey ferguson';
               else if (vLow.includes('john deere')) v = 'john deere';
               else if (vLow.includes('fendt')) v = 'fendt';
               else if (vLow.includes('case')) v = 'case ih';
               else if (vLow.includes('andoria')) v = 'andoria';
               else if (vLow.includes('archimedes')) v = 'archimedes';
               else if (vLow.includes('rolmus')) v = 'rolmus';
               else if (vLow.includes('bizon')) v = 'bizon';
               else if (vLow.includes('mtz')) v = 'mtz';
               else if (vLow.includes('władimirec')) v = 'władimirec';

               if (v.toLowerCase() === filterValue) {
                   matchFound = true;
                   break;
               }
            }
            if (!matchFound) return false;
          }
          return true; 
        });
      }

      const totalCount = filteredProducts.length;
      const slicedProducts = filteredProducts.slice(0, currentLimit);

      const skus = slicedProducts.map((p: any) => p.sku).filter(Boolean);
      let bcProducts: any[] = [];
      if (skus.length > 0) {
        const bcRes = await fetch(`https://api.bigcommerce.com/stores/${storeHash}/v3/catalog/products?sku:in=${skus.join(',')}&include=images`, { headers: { 'X-Auth-Token': bcToken as string, 'Accept': 'application/json' } });
        const bcJson = await bcRes.json();
        bcProducts = bcJson.data || [];
      }

      let mappedProducts = slicedProducts.map((item: any) => {
        const bcMatch = bcProducts.find(bc => bc.sku === item.sku);
        return {
          id: item.documentId || item.id || item.sku,
          sku: item.sku || 'BRAK-SKU',
          name: item.seo_title || item.name || bcMatch?.name || 'Produkt',
          price: bcMatch?.price || 0,
          slug: item.slug || item.sku,
          external_images: item.external_images || [],
          images: bcMatch?.images || []
        };
      });

      if (minPrice !== null) mappedProducts = mappedProducts.filter((p: any) => p.price >= minPrice);
      if (maxPrice !== null) mappedProducts = mappedProducts.filter((p: any) => p.price <= maxPrice);
      if (sort === 'price_asc') mappedProducts.sort((a: any, b: any) => a.price - b.price);
      else if (sort === 'price_desc') mappedProducts.sort((a: any, b: any) => b.price - a.price);
      else if (sort === 'name_asc') mappedProducts.sort((a: any, b: any) => a.name.localeCompare(b.name));

      const breadcrumbs = (baseProducts[0]?.category_text || cleanCategoryName).split('>').map((s: string) => s.trim());

      return NextResponse.json({ 
        category: {
          h1_dynamic: activeL3 ? activeL3 : cleanCategoryName.toUpperCase(),
          top_seo_text: depth === 1 ? `Wybierz maszynę i odnajdź potrzebne części z gwarancją błyskawicznej dostawy.` : `Dobierz komponenty OEM do swojej maszyny.`
        },
        breadcrumbs: breadcrumbs,
        subcategories: Array.from(subcategories),
        filters: optimizedFilters, 
        depth: depth,
        activeL3: activeL3,
        products: mappedProducts,
        totalCount: totalCount 
      });

    } catch (error) { return NextResponse.json({ category: null, products: [], filters: {}, breadcrumbs: [], subcategories: [], totalCount: 0 }); }
  }

  return NextResponse.json({ data: [] });
}