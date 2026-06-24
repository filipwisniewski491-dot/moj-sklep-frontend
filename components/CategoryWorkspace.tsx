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

    const fetchDiagnostics = async () => {
      setLoading(true);
      try {
        const index = meiliClient.index('products');
        
        // 1. Budowa filtra
        const safeHandles = allowedHandles?.filter(Boolean) || [currentHandle];
        const categoryFilterStr = `category_handles IN [${safeHandles.map((h: string) => JSON.stringify(h)).join(', ')}]`;
        
        const filterArray: string[] = [categoryFilterStr];
        Object.entries(activeFilters).forEach(([key, val]) => {
          if (['limit', 'sort', 'minPrice', 'maxPrice', 'q', 'page', 'view'].includes(key)) return;
          if (!val) return;
          const values = String(val).split(',').map(v => v.trim()).filter(Boolean);
          if (values.length > 0) {
            const orConditions = values.map(v => `'${key}' = ${JSON.stringify(v)}`);
            filterArray.push(`(${orConditions.join(' OR ')})`);
          }
        });

        const finalFilter = filterArray.join(' AND ');

        // 🔥 DIAGNOSTYKA - SKOPIUJ TO, JEŚLI WYSKOCZY W KONSOLI
        console.log("🔍 [DEBUG] Pełny filtr wysłany do Meili:", finalFilter);
        
        const searchResult = await index.search(activeFilters.q || "", {
          filter: finalFilter,
          facets: OPTIMIZED_FACETS,
          limit: 250
        });

        console.log("✅ [DEBUG] Liczba produktów zwróconych:", searchResult.hits.length);
        if (searchResult.hits.length === 0) {
            console.warn("⚠️ [DEBUG] PUSTA ODPOWIEDŹ. Sprawdź, czy nazwy atrybutów w 'category_handles' zgadzają się z tymi w indeksie.");
        }

        setData({
          filters: searchResult.facetDistribution || {}, // Zaktualizowane filtry
          narrowedFilters: searchResult.facetDistribution || {},
          products: searchResult.hits.map((p: any) => ({
            id: p.id, sku: p.id, name: p.title, price: p.price || 0, slug: p.handle,
            category_text: p.Kategoria || '', images: p.thumbnail ? [{ url: p.thumbnail }] : []
          })),
          totalCount: searchResult.estimatedTotalHits || 0
        });

      } catch (e) {
        console.error("❌ BŁĄD MEILISEARCH:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchDiagnostics();
  }, [activeFilters, currentHandle, allowedHandles]);

  const isListView = activeFilters.view === 'list';

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full relative min-h-[600px]">
      {loading && (
        <div className="absolute inset-0 z-[100] flex items-start pt-32 justify-center bg-white/40 backdrop-blur-[1px] rounded-3xl transition-opacity">
           <div className="flex flex-col items-center bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
             <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-100 border-t-red-600 mb-3"></div>
             <span className="text-xs font-black uppercase tracking-widest text-slate-800 animate-pulse">Ładuję produkty...</span>
           </div>
        </div>
      )}
      
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