'use client';

import React, { useState, useEffect } from 'react';
import CategoryFilters from './CategoryFilters';
import CategoryToolbar from './CategoryToolbar';
import ProductGrid from './ProductGrid';
import { meiliClient } from '@/lib/meilisearch-client';

const OPTIMIZED_FACETS = [
  'Pasuje do marki', 'Pasuje do modelu', 'Typ produktu', 'Producent',
  'Rodzaj', 'Waga [kg]', 'Napięcie [V]', 'Strona zabudowy',
  'Ilość zębów', 'Wymiary', 'Średnica wewnętrzna [mm]', 'Średnica zewnętrzna [mm]', 'Zastosowanie'
];

export default function CategoryWorkspace({ initialData, fullPath, allowedHandles }: any) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Funkcja pobierająca natychmiastowo dane BEZ przeładowywania strony
    const fetchMeiliDirectly = async () => {
      setLoading(true);
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const activeFilters = Object.fromEntries(searchParams.entries());
        const searchQ = activeFilters.q || "";
        const currentLimit = activeFilters.limit ? parseInt(activeFilters.limit) : 250;

        ['limit', 'sort', 'minPrice', 'maxPrice', 'q', 'page', 'view'].forEach(k => delete activeFilters[k]);

        const categoryFilterStr = allowedHandles && allowedHandles.length > 0
          ? `category_handles IN [${allowedHandles.map((h: string) => JSON.stringify(h)).join(', ')}]`
          : `category_handles = ${JSON.stringify(fullPath.split('/').pop())}`;

        const filterArray = [categoryFilterStr];

        Object.entries(activeFilters).forEach(([key, val]) => {
          const values = String(val).split(',').map(v => v.trim()).filter(Boolean);
          if (values.length > 0) {
            const orConditions = values.map(v => `'${key}' = ${JSON.stringify(v)}`);
            filterArray.push(`(${orConditions.join(' OR ')})`);
          }
        });

        let meiliSort: any = undefined;
        if (searchParams.get('sort') === 'price_asc') meiliSort = ['price:asc'];
        if (searchParams.get('sort') === 'price_desc') meiliSort = ['price:desc'];

        const index = meiliClient.index('products');
        
        // Piorunująco szybki strzał prosto do bazy z przeglądarki klienta
        const searchResult = await index.search(searchQ, {
          limit: currentLimit,
          filter: filterArray.join(' AND '),
          sort: meiliSort,
          facets: OPTIMIZED_FACETS
        });

        const mappedProducts = searchResult.hits.map((p: any) => ({
          id: p.id, sku: p.id, name: p.title, price: p.price || 0, slug: p.handle,
          category_text: p.Kategoria || '',
          images: p.thumbnail ? [{ url: p.thumbnail }] : []
        }));

        setData((prev: any) => ({
          ...prev,
          narrowedFilters: searchResult.facetDistribution || {},
          products: mappedProducts,
          totalCount: searchResult.estimatedTotalHits || mappedProducts.length
        }));
      } catch(e) {
        console.error("Direct Client Search Error", e);
      }
      setLoading(false);
    };

    // Nasłuchujemy customowych eventów z komponentu filtrów, ignorując Next.js Router
    window.addEventListener('shallow-routing', fetchMeiliDirectly);
    window.addEventListener('popstate', fetchMeiliDirectly);
    
    return () => {
      window.removeEventListener('shallow-routing', fetchMeiliDirectly);
      window.removeEventListener('popstate', fetchMeiliDirectly);
    };
  }, [allowedHandles, fullPath]);

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 relative z-10 w-full">
      <aside className="w-full lg:w-80 flex-shrink-0">
         <CategoryFilters baseFilters={data.filters} narrowedFilters={data.narrowedFilters} totalCount={data.totalCount} />
      </aside>
      <div className="flex-1 flex flex-col min-h-[500px]">
         <CategoryToolbar totalCount={data.totalCount} />
         {/* Podczas ładowania produkty tylko lekko blakną, nie ma białego ekranu */}
         <div className={`transition-opacity duration-150 ${loading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
            <ProductGrid initialProducts={data.products} totalCount={data.totalCount} fullPath={fullPath} isListView={false} />
         </div>
      </div>
    </div>
  );
}