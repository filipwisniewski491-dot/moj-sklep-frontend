'use client';

import { useState, useEffect, useRef } from 'react';
import { meiliClient } from '@/lib/meilisearch-client';
import CategoryFilters from './CategoryFilters';
import ProductGrid from './ProductGrid';
import CategoryToolbar from './CategoryToolbar';

// Formatuje parametry z URL w wygodne tablice dla Reacta
const normalizeParams = (params: any) => {
  const normalized: any = { ...params };
  Object.keys(normalized).forEach(key => {
     if (!['limit', 'sort', 'minPrice', 'maxPrice', 'q', 'page', 'view'].includes(key)) {
        if (typeof normalized[key] === 'string') {
           normalized[key] = normalized[key].split(',').map((v:string) => v.trim()).filter(Boolean);
        }
     }
  });
  return normalized;
};

export default function CategoryWorkspace({ initialData, currentHandle, allowedHandles, fullPath, initialSearchParams }: any) {
  const [data, setData] = useState(initialData);
  const [isPending, setIsPending] = useState(false);
  const [activeFilters, setActiveFilters] = useState(() => normalizeParams(initialSearchParams || {}));
  
  const isFirstRender = useRef(true);

  // KIEDY ZMIENIA SIĘ FILTR -> UDERZAJ DO MEILISEARCH!
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return; 
    }

    const fetchMeili = async () => {
      setIsPending(true); // Natychmiastowe pokazanie spinnera ładowania!
      try {
        // 1. Kosmetyczna zmiana linku URL (bez odświeżania serwera Next.js!)
        const queryParams = new URLSearchParams();
        Object.entries(activeFilters).forEach(([k, v]) => {
           if (Array.isArray(v) && v.length > 0) queryParams.set(k, v.join(','));
           else if (v && typeof v === 'string') queryParams.set(k, v);
        });
        const queryString = queryParams.toString();
        const newUrl = window.location.pathname + (queryString ? `?${queryString}` : '');
        window.history.replaceState(window.history.state, '', newUrl);

        // 2. Budowanie zapytania dla Meili
        const safeHandles = allowedHandles?.filter(Boolean) || [currentHandle];
        const categoryFilterStr = `category_handles IN [${safeHandles.map((h: string) => JSON.stringify(h)).join(', ')}]`;
        const filterArray: string[] = [categoryFilterStr];

        Object.entries(activeFilters).forEach(([key, val]) => {
           if (['limit', 'sort', 'minPrice', 'maxPrice', 'q', 'page', 'view'].includes(key)) return;
           const values = Array.isArray(val) ? val : String(val).split(',').map(v => v.trim()).filter(Boolean);
           if (values.length > 0) {
              const orConditions = values.map(v => `"${key}" = ${JSON.stringify(v)}`);
              filterArray.push(`(${orConditions.join(' OR ')})`);
           }
        });

        if (activeFilters.minPrice) filterArray.push(`price >= ${activeFilters.minPrice}`);
        if (activeFilters.maxPrice) filterArray.push(`price <= ${activeFilters.maxPrice}`);

        const index = meiliClient.index('products');
        const q = activeFilters.q || "";
        let meiliSort = undefined;
        if (activeFilters.sort === 'price_asc') meiliSort = ['price:asc'];
        if (activeFilters.sort === 'price_desc') meiliSort = ['price:desc'];
        const limit = activeFilters.limit ? parseInt(activeFilters.limit) : 250;

        const filterString = filterArray.join(' AND ');

        // 3. Strzał bezpośrednio z przeglądarki klienta
        const [baseFacetsResult, searchResult] = await Promise.all([
          index.search(q, { limit: 0, filter: categoryFilterStr, facets: ['*'] }),
          index.search(q, { limit, filter: filterString, sort: meiliSort, facets: ['*'] })
        ]);

        const products = searchResult.hits.map((p: any) => ({
          id: p.id, sku: p.id, name: p.title, price: p.price || 0, slug: p.handle,
          category_text: p.Kategoria || '', images: p.thumbnail ? [{ url: p.thumbnail }] : []
        }));

        setData({
          products,
          baseFilters: baseFacetsResult.facetDistribution || {},
          narrowedFilters: searchResult.facetDistribution || {},
          totalCount: searchResult.estimatedTotalHits || products.length
        });

      } catch (e) {
        console.error("❌ Błąd Meilisearch na froncie:", e);
      } finally {
        setIsPending(false); // Ukrycie spinnera
      }
    };

    fetchMeili();
  }, [activeFilters, currentHandle, allowedHandles]);

  // Funkcje do zarządzania filtrami przekazywane w dół do bocznego paska
  const toggleFilter = (key: string, value: string) => {
    setActiveFilters((prev: any) => {
      const current = prev[key] || [];
      let valuesArray = Array.isArray(current) ? [...current] : [current];
      if (valuesArray.includes(value)) valuesArray = valuesArray.filter(v => v !== value);
      else valuesArray.push(value);
      
      const next = { ...prev };
      if (valuesArray.length > 0) next[key] = valuesArray;
      else delete next[key];
      return next;
    });
  };

  const clearFilter = (key: string) => {
    setActiveFilters((prev: any) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const updateFilter = (key: string, value: string) => {
    setActiveFilters((prev: any) => {
      const next = { ...prev };
      if (value) next[key] = value;
      else delete next[key];
      return next;
    });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full relative min-h-[600px]">
      {/* 🚀 BŁYSKAWICZNY WSKAŹNIK ŁADOWANIA ZABEZPIECZAJĄCY PRZED UCZUCIEM "ZAMROŻENIA" */}
      {isPending && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-white/60 backdrop-blur-[2px] rounded-[32px] transition-all duration-100">
           <div className="flex flex-col items-center bg-white p-6 rounded-3xl shadow-2xl border border-slate-100">
             <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-100 border-t-red-600 mb-3"></div>
             <span className="text-xs font-black uppercase tracking-widest text-slate-800 animate-pulse">Ładuję wyniki...</span>
           </div>
        </div>
      )}
      
      <aside className="w-full lg:w-80 flex-shrink-0">
        <CategoryFilters
          baseFilters={data.baseFilters}
          narrowedFilters={data.narrowedFilters}
          totalCount={data.totalCount}
          isPending={isPending}
          activeFilters={activeFilters}
          toggleFilter={toggleFilter}
          clearFilter={clearFilter}
          updateFilter={updateFilter}
        />
      </aside>
      <div className="flex-1 flex flex-col">
        <CategoryToolbar totalCount={data.totalCount} />
        <div className={`transition-opacity duration-200 ${isPending ? 'opacity-30' : 'opacity-100'}`}>
           <ProductGrid 
             initialProducts={data.products} 
             totalCount={data.totalCount} 
             fullPath={fullPath} 
             isListView={activeFilters.view === 'list'} 
           />
        </div>
      </div>
    </div>
  );
}