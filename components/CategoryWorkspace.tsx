'use client';

import { useState, useEffect } from 'react';
import { meiliClient } from '@/lib/meilisearch-client';
import CategoryFilters from './CategoryFilters';
import ProductGrid from './ProductGrid';
import CategoryToolbar from './CategoryToolbar';

export default function CategoryWorkspace({ initialData, currentHandle, allowedHandles, fullPath }: any) {
  const [data, setData] = useState(initialData);
  const [isPending, setIsPending] = useState(false);
  
  // Trzymamy parametry w stringu, aby reagować na nawigację bez wchodzenia w SSR
  const [searchString, setSearchString] = useState(
    typeof window !== 'undefined' ? window.location.search : ''
  );

  useEffect(() => {
    const fetchMeiliDirectly = async () => {
      setIsPending(true);
      try {
        const searchParams = new URLSearchParams(window.location.search);
        setSearchString(window.location.search); // Poinformuj dzieci o nowym URL

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

        // 🚀 STRZAŁ BEZPOŚREDNIO Z PRZEGLĄDARKI W 20 MILISEKUND!
        const [baseFacetsResult, searchResult] = await Promise.all([
          index.search(q, { limit: 0, filter: categoryFilterStr, facets: ['*'] }),
          index.search(q, { limit, filter: filterArray.join(' AND '), sort: meiliSort, facets: ['*'] })
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
        console.error("Błąd połączenia klienckiego z Meilisearch:", e);
      } finally {
        setIsPending(false);
      }
    };

    const handleUrlChange = () => fetchMeiliDirectly();

    // Nasłuchujemy na przycisk "Wstecz" oraz na nasze kliknięcia w filtry
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('pushstate', handleUrlChange); 

    return () => {
        window.removeEventListener('popstate', handleUrlChange);
        window.removeEventListener('pushstate', handleUrlChange);
    };
  }, [currentHandle, allowedHandles]);

  const currentParams = new URLSearchParams(searchString);

  return (
     <div className="flex flex-col lg:flex-row gap-8 w-full">
        <aside className="w-full lg:w-80 flex-shrink-0">
          <CategoryFilters
            baseFilters={data.baseFilters}
            narrowedFilters={data.narrowedFilters}
            totalCount={data.totalCount}
            isPending={isPending}
            currentParams={currentParams} // Przekazujemy stan URL do filtrów
          />
        </aside>
        <div className="flex-1 flex flex-col min-h-[500px]">
          <CategoryToolbar totalCount={data.totalCount} />
          <div className={`transition-opacity duration-150 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
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