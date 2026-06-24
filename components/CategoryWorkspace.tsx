'use client';

import { useState, useEffect } from 'react';
import { meiliClient } from '@/lib/meilisearch-client';
import CategoryFilters from './CategoryFilters';
import ProductGrid from './ProductGrid';
import CategoryToolbar from './CategoryToolbar';

export default function CategoryWorkspace({ initialData, currentHandle, allowedHandles, fullPath }: any) {
  const [data, setData] = useState(initialData);
  const [isPending, setIsPending] = useState(false);
  
  const [searchString, setSearchString] = useState(
    typeof window !== 'undefined' ? window.location.search : ''
  );

  useEffect(() => {
    const fetchMeiliDirectly = async (e?: Event) => {
      setIsPending(true);
      try {
        // 🔥 Pobieramy parametry BEZPOŚREDNIO z naszego custom eventu (omijamy opóźnienia Next.js)
        let currentSearch = window.location.search;
        if (e && (e as CustomEvent).detail !== undefined) {
           currentSearch = '?' + (e as CustomEvent).detail;
        }
        
        const searchParams = new URLSearchParams(currentSearch);
        setSearchString(currentSearch);

        console.log("🚀 Meilisearch szuka dla:", currentSearch);

        const activeFilters = Object.fromEntries(searchParams.entries());
        ['fullPath', 'limit', 'sort', 'minPrice', 'maxPrice', 'q', 'page', 'view'].forEach(k => delete activeFilters[k]);

        const categoryFilterStr = allowedHandles.length > 0
          ? `category_handles IN [${allowedHandles.map((h: string) => JSON.stringify(h)).join(', ')}]`
          : `category_handles = ${JSON.stringify(currentHandle)}`;

        const filterArray: string[] = [categoryFilterStr];

        Object.entries(activeFilters).forEach(([key, val]) => {
          const values = String(val).split(',').map(v => v.trim()).filter(Boolean);
          if (values.length > 0) {
            const orConditions = values.map(v => `'${key}' = ${JSON.stringify(v)}`);
            filterArray.push(`(${orConditions.join(' OR ')})`);
          }
        });

        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        if (minPrice) filterArray.push(`price >= ${minPrice}`);
        if (maxPrice) filterArray.push(`price <= ${maxPrice}`);

        const sortParam = searchParams.get('sort');
        let meiliSort = undefined;
        if (sortParam === 'price_asc') meiliSort = ['price:asc'];
        if (sortParam === 'price_desc') meiliSort = ['price:desc'];

        const q = searchParams.get('q') || "";
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string) : 250;

        const index = meiliClient.index('products');

        const filterString = filterArray.join(' AND ');

        // 🚀 STRZAŁ DO BAZY
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
        
        console.log("✅ Pobrano produktów:", products.length);

      } catch (e) {
        console.error("❌ Błąd połączenia z Meilisearch na froncie:", e);
      } finally {
        setIsPending(false);
      }
    };

    // 🔥 Nasłuchujemy na WŁASNY event, którego Next.js nie zablokuje
    const handlePopstate = () => fetchMeiliDirectly();
    window.addEventListener('meili-update', fetchMeiliDirectly);
    window.addEventListener('popstate', handlePopstate); 

    return () => {
        window.removeEventListener('meili-update', fetchMeiliDirectly);
        window.removeEventListener('popstate', handlePopstate);
    };
  }, [currentHandle, allowedHandles]);

  const currentParams = new URLSearchParams(searchString);

  return (
     <div className="flex flex-col lg:flex-row gap-8 w-full relative min-h-[600px]">
        {/* 🔥 GIGANTYCZNY WSKAŹNIK ŁADOWANIA (nałożony na zawartość) */}
        {isPending && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-white/50 backdrop-blur-[2px] rounded-[32px] transition-all duration-200">
             <div className="flex flex-col items-center bg-white p-6 rounded-2xl shadow-xl">
               <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-100 border-t-red-600 mb-3"></div>
               <span className="text-xs font-black uppercase tracking-widest text-slate-800">Szukam...</span>
             </div>
          </div>
        )}
        
        <aside className="w-full lg:w-80 flex-shrink-0">
          <CategoryFilters
            baseFilters={data.baseFilters}
            narrowedFilters={data.narrowedFilters}
            totalCount={data.totalCount}
            isPending={isPending}
            currentParams={currentParams}
          />
        </aside>
        <div className="flex-1 flex flex-col">
          <CategoryToolbar totalCount={data.totalCount} />
          <div className={`transition-opacity duration-200 ${isPending ? 'opacity-30' : 'opacity-100'}`}>
            <ProductGrid
              initialProducts={data.products}
              totalCount={data.totalCount}
              fullPath={fullPath}
              isListView={currentParams.get('view') === 'list'}
            />
          </div>
        </div>
     </div>
  );
}