'use client';

import React, { useState, useEffect } from 'react';
import CategoryFilters from './CategoryFilters';
import CategoryToolbar from './CategoryToolbar';
import ProductGrid from './ProductGrid';

export default function CategoryWorkspace({ initialData, fullPath }: any) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [isListView, setIsListView] = useState(false);

  useEffect(() => {
    // Funkcja odpytująca przez nasze bezpieczne API (omija błąd 127.0.0.1 w przeglądarce)
    const fetchAPI = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams(window.location.search);
        params.set('fullPath', fullPath);
        
        setIsListView(params.get('view') === 'list');

        const res = await fetch(`/api/search?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setData((prev: any) => ({
            ...prev,
            narrowedFilters: json.narrowedFilters || {},
            products: json.products || [],
            totalCount: json.totalCount || 0
          }));
        }
      } catch(e) {
        console.error("Client API Fetch Error", e);
      }
      setLoading(false);
    };

    // Nasłuchiwanie na kliknięcia w filtry (bez przeładowania Next.js)
    window.addEventListener('shallow-routing', fetchAPI);
    window.addEventListener('popstate', fetchAPI);
    
    // Sprawdź widok przy pierwszym załadowaniu
    setIsListView(new URLSearchParams(window.location.search).get('view') === 'list');

    return () => {
      window.removeEventListener('shallow-routing', fetchAPI);
      window.removeEventListener('popstate', fetchAPI);
    };
  }, [fullPath]);

  return (
    // 🔥 TUTAJ PRZYWRÓCONO KONTENER CENTRUJĄCY (max-w-7xl mx-auto) NAPRAWIAJĄCY ROZJECHANIE!
    <main className="max-w-7xl mx-auto px-4 py-6 lg:py-12 flex flex-col lg:flex-row gap-8 lg:gap-12 relative z-10 w-full">
      <aside className="w-full lg:w-80 flex-shrink-0">
         <CategoryFilters baseFilters={data.filters} narrowedFilters={data.narrowedFilters} totalCount={data.totalCount} />
      </aside>
      
      <div className="flex-1 flex flex-col min-h-[500px]">
         <CategoryToolbar totalCount={data.totalCount} />
         
         <div className={`transition-opacity duration-150 ${loading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
            <ProductGrid 
              initialProducts={data.products} 
              totalCount={data.totalCount} 
              fullPath={fullPath} 
              isListView={isListView} 
            />
         </div>
      </div>
    </main>
  );
}