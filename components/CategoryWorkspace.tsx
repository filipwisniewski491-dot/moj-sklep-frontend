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
    // API Call omijający serwer Vercela (Native Fetch)
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

    window.addEventListener('shallow-routing', fetchAPI);
    window.addEventListener('popstate', fetchAPI);
    
    setIsListView(new URLSearchParams(window.location.search).get('view') === 'list');

    return () => {
      window.removeEventListener('shallow-routing', fetchAPI);
      window.removeEventListener('popstate', fetchAPI);
    };
  }, [fullPath]);

  return (
    <main className="max-w-7xl mx-auto px-4 py-6 lg:py-12 flex flex-col lg:flex-row gap-8 lg:gap-12 relative z-10 w-full">
      <aside className="w-full lg:w-80 flex-shrink-0">
         <CategoryFilters 
            baseFilters={data.filters} 
            narrowedFilters={data.narrowedFilters} 
            totalCount={data.totalCount} 
            isPending={loading} 
         />
      </aside>
      
      <div className="flex-1 flex flex-col min-h-[500px] relative">
         {/* Wskaźnik ładowania */}
         {loading && (
          <div className="absolute inset-0 z-[100] flex items-start pt-32 justify-center bg-white/40 backdrop-blur-[1px] rounded-3xl">
             <div className="flex flex-col items-center bg-white p-6 rounded-2xl shadow-xl">
               <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-100 border-t-red-600 mb-3"></div>
               <span className="text-xs font-black uppercase tracking-widest text-slate-800">Aktualizuję filtry...</span>
             </div>
          </div>
         )}

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