'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import CategoryFilters from './CategoryFilters';
import CategoryToolbar from './CategoryToolbar';
import ProductGrid from './ProductGrid';

export default function CategoryWorkspace({ initialData, fullPath, currentHandle, allowedHandles }: any) {
  const [data, setData] = useState(() => ({
    products: initialData?.products || [],
    filters: initialData?.filters || {},
    narrowedFilters: initialData?.narrowedFilters || {},
    totalCount: initialData?.totalCount || 0,
  }));

  const [loading, setLoading] = useState(false);

  const [activeFilters, setActiveFilters] = useState<Record<string, string>>(() => {
    if (typeof window !== 'undefined') {
      const result: Record<string, string> = {};
      new URLSearchParams(window.location.search).forEach((v, k) => { result[k] = v; });
      return result;
    }
    return {};
  });

  const isFirstRender = useRef(true);

  const fetchProducts = useCallback(async (filters: Record<string, string>) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('fullPath', fullPath);
      params.set('limit', '250');
      Object.entries(filters).forEach(([key, val]) => {
        if (val) params.set(key, val);
      });

      const res = await fetch(`/api/search?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      setData({
        products: json.products || [],
        filters: json.filters || {},
        narrowedFilters: json.narrowedFilters || {},
        totalCount: json.totalCount || 0,
      });
    } catch (e) {
      console.error('Błąd pobierania produktów:', e);
    } finally {
      setLoading(false);
    }
  }, [fullPath]);

  // ✅ KLUCZOWA ZMIANA: przy pierwszym renderze fetchuj jeśli initialData jest puste
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      // Jeśli serwer nie dał produktów — pobierz przez API
      if (!initialData?.products?.length) {
        fetchProducts(activeFilters);
      }
      return;
    }
    fetchProducts(activeFilters);
  }, [activeFilters]);

  const updateFilter = useCallback((key: string, value: string | null) => {
    setActiveFilters(prev => {
      const next = { ...prev };
      if (value) next[key] = value;
      else delete next[key];
      return next;
    });
  }, []);

  const clearFilter = useCallback((key: string) => {
    setActiveFilters(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const toggleFilter = useCallback((key: string, value: string) => {
    setActiveFilters(prev => {
      const next = { ...prev };
      const current = next[key] ? next[key].split(',') : [];
      const idx = current.indexOf(value);
      if (idx >= 0) current.splice(idx, 1);
      else current.push(value);
      if (current.length === 0) delete next[key];
      else next[key] = current.join(',');
      return next;
    });
  }, []);

  const isListView = activeFilters.view === 'list';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8 w-full relative min-h-[600px]">

        {loading && (
          <div className="absolute inset-0 z-[100] flex items-start pt-32 justify-center bg-white/40 backdrop-blur-[1px] rounded-3xl pointer-events-none">
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
            updateFilter={updateFilter}
            toggleFilter={toggleFilter}
            clearFilter={clearFilter}
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
    </div>
  );
}
