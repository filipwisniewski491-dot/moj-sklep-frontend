'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import CategoryFilters from './CategoryFilters';
import ProductGrid from './ProductGrid';

export default function CategoryWorkspace({ initialData, fullPath }: any) {
  const searchParams = useSearchParams();
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFiltered = async () => {
      setLoading(true);
      const res = await fetch(`/api/search?${searchParams.toString()}&fullPath=${fullPath}`);
      const json = await res.json();
      setData(json);
      setLoading(false);
    };
    
    // Nie pobieramy przy pierwszym renderze (initialData jest z SSR)
    if (searchParams.toString() !== '') fetchFiltered();
  }, [searchParams, fullPath]);

  return (
    <div className={`transition-opacity ${loading ? 'opacity-50' : 'opacity-100'}`}>
       <div className="flex flex-col lg:flex-row gap-8">
         <aside className="w-full lg:w-80">
            <CategoryFilters baseFilters={data.filters} narrowedFilters={data.filters} totalCount={data.totalCount} />
         </aside>
         <div className="flex-1">
            <ProductGrid initialProducts={data.products} totalCount={data.totalCount} />
         </div>
       </div>
    </div>
  );
}