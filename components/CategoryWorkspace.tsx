'use client';

import React, { useState, useEffect, useRef } from 'react';
import { meiliClient } from '@/lib/meilisearch-client';
import CategoryFilters from './CategoryFilters';
import CategoryToolbar from './CategoryToolbar';
import ProductGrid from './ProductGrid';

const OPTIMIZED_FACETS = [
  'Pasuje do marki', 'Pasuje do modelu', 'Typ produktu', 'Producent', 
  'Rodzaj', 'Waga [kg]', 'Napięcie [V]', 'Strona zabudowy', 
  'Ilość zębów', 'Wymiary', 'Średnica wewnętrzna [mm]', 'Średnica zewnętrzna [mm]', 'Zastosowanie'
];

export default function CategoryWorkspace({ initialData, fullPath, currentHandle, allowedHandles }: any) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);

  const [activeFilters, setActiveFilters] = useState<Record<string, string>>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return Object.fromEntries(params.entries());
    }
    return {};
  });

  const isFirstRender = useRef(true);

  // Funkcja pomocnicza dla Toolbara
  const updateFilter = (key: string, value: string | null) => {
    setActiveFilters((prev: any) => {
      const next = { ...prev };
      if (value) next[key] = value; else delete next[key];
      return next;
    });
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const fetchFromMeiliDirectly = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        Object.entries(activeFilters).forEach(([k, v]) => {
          if (v) params.set(k, v);
        });
        
        // Zmiana paska URL z zachowaniem historii (aby działał przycisk Wstecz)
        const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
        window.history.pushState(null, '', newUrl);

        const index = meiliClient.index('products');
        const safeHandles = allowedHandles?.filter(Boolean) || [currentHandle];
        const categoryFilterStr = `category_handles IN [${safeHandles.map((h: string) => JSON.stringify(h)).join(', ')}]`;
        const filterArray: string[] = [categoryFilterStr];

        Object.entries(activeFilters).forEach(([key, val]) => {
          if (['limit', 'sort', 'minPrice', 'maxPrice', 'q', 'page', 'view'].includes(key)) return;
          if (!val) return;
          const values = String(val).split(',').map(v => v.trim()).filter(Boolean);
          if (values.length > 0) {
            // 🔥 POPRAWIONE: Meilisearch w 100% wymaga tutaj POJEDYNCZEGO apostrofu ('${key}')
            const orConditions = values.map(v => `'${key}' = ${JSON.stringify(v)}`);
            filterArray.push(`(${orConditions.join(' OR ')})`);
          }
        });

        if (activeFilters.minPrice) filterArray.push(`price >= ${activeFilters.minPrice}`);
        if (activeFilters.maxPrice) filterArray.push(`price <= ${activeFilters.maxPrice}`);

        const q = activeFilters.q || "";
        let meiliSort = undefined;
        if (activeFilters.sort === 'price_asc') meiliSort = ['price:asc'];
        if (activeFilters.sort === 'price_desc') meiliSort = ['price:desc'];
        const limit = activeFilters.limit ? parseInt(activeFilters.limit) : 250;

        const finalFilterString = filterArray.join(' AND ');

        const [baseFacetsResult, searchResult] = await Promise.all([
          index.search(q, { limit: 0, filter: categoryFilterStr, facets: OPTIMIZED_FACETS }),
          index.search(q, { limit, filter: finalFilterString, sort: meiliSort, facets: OPTIMIZED_FACETS })
        ]);

        setData({
          filters: baseFacetsResult.facetDistribution || {},
          narrowedFilters: searchResult.facetDistribution || {},
          products: searchResult.hits.map((p: any) => ({
            id: p.id, sku: p.id, name: p.title, price: p.price || 0, slug: p.handle,
            category_text: p.Kategoria || '', images: p.thumbnail ? [{ url: p.thumbnail }] : []
          })),
          totalCount: searchResult.estimatedTotalHits || searchResult.hits.length
        });

      } catch (e) {
        console.error("❌ Błąd Meilisearch na froncie:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchFromMeiliDirectly();
  }, [activeFilters]);

  // Nasłuchiwanie przycisku "Wstecz" w przeglądarce
  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      setActiveFilters(Object.fromEntries(params.entries()));
    };
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  const isListView = activeFilters.view === 'list';

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full relative min-h-[600px]">
      <aside className="w-full lg:w-80 flex-shrink-0">
         <CategoryFilters 
            baseFilters={data.filters} 
            narrowedFilters={data.narrowedFilters} 
            totalCount={data.totalCount} 
            isPending={loading} 
            activeFilters={activeFilters}
            setActiveFilters={setActiveFilters}
         />
      </aside>
      
      <div className="flex-1 flex flex-col min-h-[500px] relative">
         {loading && (
          <div className="absolute inset-0 z-[100] flex items-start pt-32 justify-center bg-white/40 backdrop-blur-[1px] rounded-3xl transition-opacity">
             <div className="flex flex-col items-center bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
               <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-100 border-t-red-600 mb-3"></div>
               <span className="text-xs font-black uppercase tracking-widest text-slate-800 animate-pulse">Aktualizuję filtry...</span>
             </div>
          </div>
         )}

         {/* 🔥 Przekazujemy dowodzenie do paska narzędzi */}
         <CategoryToolbar 
           totalCount={data.totalCount} 
           activeFilters={activeFilters} 
           updateFilter={updateFilter} 
         />
         
         <div className={`transition-opacity duration-150 ${loading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
            <ProductGrid 
              initialProducts={data.products} 
              totalCount={data.totalCount} 
              fullPath={fullPath} 
              isListView={isListView} 
            />
         </div>
      </div>
    </div>
  );
}