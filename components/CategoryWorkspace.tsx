'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import CategoryFilters from './CategoryFilters';
import CategoryToolbar from './CategoryToolbar';
import ProductGrid from './ProductGrid';

export default function CategoryWorkspace({ initialData, fullPath }: any) {
  const searchParams = useSearchParams();
  const [data, setData] = useState(initialData);
  const [isPending, setIsPending] = useState(false);
  const firstRender = useRef(true);

  useEffect(() => {
    // Pomijamy pierwsze ładowanie (dane już przyszły z serwera dla SEO)
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    const fetchFilteredData = async () => {
      setIsPending(true);
      const params = new URLSearchParams(searchParams.toString());
      params.set('fullPath', fullPath);

      try {
        // Asynchroniczne, błyskawiczne strzały do API po sam czysty JSON
        const res = await fetch(`/api/search?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error('Błąd pobierania filtrów:', error);
      }
      setIsPending(false);
    };

    // Delikatny "debounce" zapobiega spamowaniu API przy szybkim klikaniu
    const timer = setTimeout(() => {
      fetchFilteredData();
    }, 100);

    return () => clearTimeout(timer);
  }, [searchParams, fullPath]);

  return (
    <main className="max-w-7xl mx-auto px-4 py-6 lg:py-12 flex flex-col lg:flex-row gap-8 lg:gap-12 relative z-10">
      <aside className="w-full lg:w-80 flex-shrink-0">
        <CategoryFilters
          baseFilters={data.filters}
          narrowedFilters={data.narrowedFilters}
          totalCount={data.totalCount}
        />
      </aside>
      <div className="flex-1 flex flex-col min-h-[500px]">
        <CategoryToolbar totalCount={data.totalCount} />
        {/* Wizualny feedback kliknięcia (opacity), ale układ nie znika! */}
        <div className={`transition-opacity duration-200 ${isPending ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
          <ProductGrid
            initialProducts={data.products}
            totalCount={data.totalCount}
            fullPath={fullPath}
            isListView={searchParams.get('view') === 'list'}
          />
        </div>
      </div>
    </main>
  );
}