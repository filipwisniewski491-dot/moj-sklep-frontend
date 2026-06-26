'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import CategoryFilters from './CategoryFilters';
import CategoryToolbar from './CategoryToolbar';
import ProductGrid from './ProductGrid';

// Slugify - identyczny jak w lib/brand-utils.ts (marka/model -> URL)
function toSlug(s: string): string {
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/[ąàáâ]/g, 'a').replace(/[ćč]/g, 'c').replace(/[ęèé]/g, 'e')
    .replace(/[łl]/g, 'l').replace(/[ńñ]/g, 'n').replace(/[óòôö]/g, 'o')
    .replace(/[śš]/g, 's').replace(/[źżž]/g, 'z').replace(/[üû]/g, 'u')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function CategoryWorkspace({
  initialData,
  fullPath,
  currentHandle,
  allowedHandles,
  // 🔥 NOWE propsy z page.tsx (z domyślnymi wartościami dla bezpieczeństwa):
  categoryPath = '',      // ścieżka samej kategorii, np. "czesci-do-ciagnikow/silnik-i-osprzet"
  currentBrandSlug = null, // slug aktualnej marki (jeśli na stronie marki)
  currentBrandName = null, // nazwa aktualnej marki
  currentModelSlug = null, // slug aktualnego modelu
}: any) {
  const router = useRouter();

  const [data, setData] = useState(() => ({
    products: initialData?.products || [],
    filters: initialData?.filters || {},
    narrowedFilters: initialData?.narrowedFilters || {},
    disjunctiveFacets: initialData?.disjunctiveFacets || {},
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
        disjunctiveFacets: json.disjunctiveFacets || {},
        totalCount: json.totalCount || 0,
      });
    } catch (e) {
      console.error('Błąd pobierania produktów:', e);
    } finally {
      setLoading(false);
    }
  }, [fullPath]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (!initialData?.products?.length) {
        fetchProducts(activeFilters);
      }
      return;
    }
    fetchProducts(activeFilters);
  }, [activeFilters]);

  // 🔥 Buduje URL landing page z zachowaniem pozostałych filtrów jako ?param
  const buildLandingUrl = useCallback((brandSlug: string | null, modelSlug: string | null) => {
    const segments = [categoryPath].filter(Boolean);
    if (brandSlug) segments.push(brandSlug);
    if (brandSlug && modelSlug) segments.push(modelSlug);
    let url = '/kategoria/' + segments.join('/');

    // zachowaj pozostałe filtry techniczne (bez marki/modelu/limitu) jako query
    const qp = new URLSearchParams();
    Object.entries(activeFilters).forEach(([k, v]) => {
      if (!v) return;
      if (k === 'Pasuje do marki' || k === 'Pasuje do modelu' || k === 'limit' || k === 'fullPath') return;
      qp.set(k, v);
    });
    const qs = qp.toString();
    if (qs) url += '?' + qs;
    return url;
  }, [categoryPath, activeFilters]);

  const updateFilter = useCallback((key: string, value: string | null) => {
    // 🔥 MARKA -> przekierowanie na /kategoria/.../marka
    if (key === 'Pasuje do marki') {
      if (value) {
        router.push(buildLandingUrl(toSlug(value), null));
      } else {
        // odznaczenie marki -> wróć do samej kategorii
        router.push(buildLandingUrl(null, null));
      }
      return;
    }
    // 🔥 MODEL -> przekierowanie na /kategoria/.../marka/model
    if (key === 'Pasuje do modelu') {
      if (value && currentBrandSlug) {
        router.push(buildLandingUrl(currentBrandSlug, toSlug(value)));
      } else if (currentBrandSlug) {
        // odznaczenie modelu -> zostań na stronie marki
        router.push(buildLandingUrl(currentBrandSlug, null));
      }
      return;
    }
    // pozostałe filtry -> stary mechanizm (stan + ?param)
    setActiveFilters(prev => {
      const next = { ...prev };
      if (value) next[key] = value;
      else delete next[key];
      return next;
    });
  }, [router, buildLandingUrl, currentBrandSlug]);

  const clearFilter = useCallback((key: string) => {
    // odznaczenie marki/modelu też przez URL
    if (key === 'Pasuje do marki') {
      router.push(buildLandingUrl(null, null));
      return;
    }
    if (key === 'Pasuje do modelu') {
      router.push(buildLandingUrl(currentBrandSlug, null));
      return;
    }
    setActiveFilters(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, [router, buildLandingUrl, currentBrandSlug]);

  const toggleFilter = useCallback((key: string, value: string) => {
    // marka/model -> przez URL (toggle = ustaw lub zdejmij)
    if (key === 'Pasuje do marki') {
      const isActive = currentBrandSlug === toSlug(value);
      router.push(isActive ? buildLandingUrl(null, null) : buildLandingUrl(toSlug(value), null));
      return;
    }
    if (key === 'Pasuje do modelu') {
      if (!currentBrandSlug) return;
      const isActive = currentModelSlug === toSlug(value);
      router.push(isActive ? buildLandingUrl(currentBrandSlug, null) : buildLandingUrl(currentBrandSlug, toSlug(value)));
      return;
    }
    // pozostałe -> multi-select w stanie
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
  }, [router, buildLandingUrl, currentBrandSlug, currentModelSlug]);

  const isListView = activeFilters.view === 'list';

  // 🔥 Wstrzyknij aktualną markę/model do activeFilters (żeby filtry pokazywały zaznaczenie)
  const displayFilters = { ...activeFilters };
  if (currentBrandName) displayFilters['Pasuje do marki'] = currentBrandName;

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
            disjunctiveFacets={data.disjunctiveFacets}
            totalCount={data.totalCount}
            isPending={loading}
            activeFilters={displayFilters}
            updateFilter={updateFilter}
            toggleFilter={toggleFilter}
            clearFilter={clearFilter}
          />
        </aside>

        <div className="flex-1 flex flex-col min-h-[500px] relative">
          <CategoryToolbar
            totalCount={data.totalCount}
            activeFilters={displayFilters}
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