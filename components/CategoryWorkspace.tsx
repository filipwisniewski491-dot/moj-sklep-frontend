'use client';

import React, { useState, useEffect, useRef, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import CategoryFilters from './CategoryFilters';
import CategoryToolbar from './CategoryToolbar';
import ProductGrid from './ProductGrid';
import StickyCartBar from './StickyCartBar';

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
  categoryPath = '',
  currentBrandSlug = null,
  currentBrandName = null,
  currentModelSlug = null,
  currentModelName = null,
}: any) {
  const router = useRouter();

  const [isPendingRoute, startTransition] = useTransition();

  const [data, setData] = useState(() => ({
    products: initialData?.products || [],
    filters: initialData?.filters || {},
    narrowedFilters: initialData?.narrowedFilters || {},
    disjunctiveFacets: initialData?.disjunctiveFacets || {},
    allBrands: initialData?.allBrands || {},
    allModels: initialData?.allModels || {},
    totalCount: initialData?.totalCount || 0,
  }));

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(48);

  useEffect(() => {
    setData({
      products: initialData?.products || [],
      filters: initialData?.filters || {},
      narrowedFilters: initialData?.narrowedFilters || {},
      disjunctiveFacets: initialData?.disjunctiveFacets || {},
      allBrands: initialData?.allBrands || {},
      allModels: initialData?.allModels || {},
      totalCount: initialData?.totalCount || 0,
    });
  }, [initialData]);

  const [activeFilters, setActiveFilters] = useState<Record<string, string>>(() => {
    if (typeof window !== 'undefined') {
      const result: Record<string, string> = {};
      new URLSearchParams(window.location.search).forEach((v, k) => { result[k] = v; });
      return result;
    }
    return {};
  });

  const isFirstRender = useRef(true);

  // 🔥 SZYBKOŚĆ: start 48 produktów (nie 250). Doładowanie po 48 z serwera na żądanie.
  const fetchProducts = useCallback(async (filters: Record<string, string>, limit = 48, isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true); else setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('fullPath', fullPath);
      params.set('limit', String(limit));

      // Filtry techniczne (NIE marka/model - te są w ścieżce fullPath)
      Object.entries(filters).forEach(([key, val]) => {
        if (!val) return;
        if (key === 'Pasuje do marki' || key === 'Pasuje do modelu') return; // w ścieżce
        params.set(key, val);
      });

      const res = await fetch(`/api/search?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      setData(prev => ({
        products: json.products || [],
        // Przy doładowaniu zachowaj facety/listy (to samo zapytanie, brak migania filtrów)
        filters: isLoadMore ? prev.filters : (json.filters || {}),
        narrowedFilters: isLoadMore ? prev.narrowedFilters : (json.narrowedFilters || {}),
        disjunctiveFacets: isLoadMore ? prev.disjunctiveFacets : (json.disjunctiveFacets || {}),
        allBrands: prev.allBrands,  // zachowaj pełną listę marek (z SSR)
        allModels: prev.allModels,  // zachowaj pełną listę modeli (z SSR)
        totalCount: json.totalCount || 0,
      }));
    } catch (e) {
      console.error('Błąd pobierania produktów:', e);
    } finally {
      if (isLoadMore) setLoadingMore(false); else setLoading(false);
    }
  }, [fullPath]);

  // Doładowanie kolejnej porcji (zwiększa limit i pobiera większy zestaw z serwera)
  const loadMore = useCallback(() => {
    const newLimit = displayLimit + 48;
    setDisplayLimit(newLimit);
    fetchProducts(activeFilters, newLimit, true);
  }, [displayLimit, activeFilters, fetchProducts]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (!initialData?.products?.length) {
        fetchProducts(activeFilters, 48);
      }
      return;
    }
    // Zmiana filtrów = nowy wynik od początku (reset do 48)
    setDisplayLimit(48);
    fetchProducts(activeFilters, 48);
  }, [activeFilters, fetchProducts]);

  const buildLandingUrl = useCallback((brandSlug: string | null, modelSlug: string | null) => {
    const segments = [categoryPath].filter(Boolean);
    if (brandSlug) segments.push(brandSlug);
    if (brandSlug && modelSlug) segments.push(modelSlug);
    let url = '/kategoria/' + segments.join('/');

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

  // 🔥 MOBILE: odłożony wybór marki/modelu - zatwierdzany jednym przekierowaniem na "POKAŻ WYNIKÓW".
  // brandValue/modelValue to NAZWY (np. "Ursus", "C-385") lub null. Jeśli undefined - użyj aktualnej.
  const commitMobileSelection = useCallback((brandValue?: string | null, modelValue?: string | null) => {
    const effectiveBrand = brandValue === undefined ? currentBrandName : brandValue;
    const effectiveModel = modelValue === undefined ? currentModelName : modelValue;
    const bSlug = effectiveBrand ? toSlug(effectiveBrand) : null;
    const mSlug = (effectiveBrand && effectiveModel) ? toSlug(effectiveModel) : null;
    startTransition(() => router.push(buildLandingUrl(bSlug, mSlug)));
  }, [router, buildLandingUrl, currentBrandName, currentModelName]);

  const updateFilter = useCallback((key: string, value: string | null) => {
    // Marka/model -> URL (SEO landing page /ursus/c-360)
    if (key === 'Pasuje do marki') {
      startTransition(() => {
        if (value) router.push(buildLandingUrl(toSlug(value), null));
        else router.push(buildLandingUrl(null, null));
      });
      return;
    }
    if (key === 'Pasuje do modelu') {
      startTransition(() => {
        if (value && currentBrandSlug) router.push(buildLandingUrl(currentBrandSlug, toSlug(value)));
        else if (currentBrandSlug) router.push(buildLandingUrl(currentBrandSlug, null));
      });
      return;
    }
    // Pozostałe filtry -> stan (filtrowanie na miejscu)
    setActiveFilters(prev => {
      const next = { ...prev };
      if (value) next[key] = value;
      else delete next[key];
      return next;
    });
  }, [router, buildLandingUrl, currentBrandSlug]);

  const clearFilter = useCallback((key: string) => {
    if (key === 'Pasuje do marki') {
      startTransition(() => router.push(buildLandingUrl(null, null)));
      return;
    }
    if (key === 'Pasuje do modelu') {
      startTransition(() => router.push(buildLandingUrl(currentBrandSlug, null)));
      return;
    }
    setActiveFilters(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, [router, buildLandingUrl, currentBrandSlug]);

  const toggleFilter = useCallback((key: string, value: string) => {
    // Marka/model -> URL (SEO)
    if (key === 'Pasuje do marki') {
      const isActive = currentBrandSlug === toSlug(value);
      startTransition(() => router.push(isActive ? buildLandingUrl(null, null) : buildLandingUrl(toSlug(value), null)));
      return;
    }
    if (key === 'Pasuje do modelu') {
      if (!currentBrandSlug) return;
      const isActive = currentModelSlug === toSlug(value);
      startTransition(() => router.push(isActive ? buildLandingUrl(currentBrandSlug, null) : buildLandingUrl(currentBrandSlug, toSlug(value))));
      return;
    }
    // Pozostałe filtry -> multi-select (OR), wartości jako string "A,B,C"
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

  // Wstrzyknij aktualną markę/model do filtrów (żeby UI pokazywało zaznaczenie)
  const displayFilters = { ...activeFilters };
  if (currentBrandName) displayFilters['Pasuje do marki'] = currentBrandName;
  if (currentModelName) displayFilters['Pasuje do modelu'] = currentModelName;

  const isReallyLoading = loading || isPendingRoute;

  return (
    <>
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8 w-full relative min-h-[600px]">

        {isReallyLoading && (
          <div className="absolute inset-0 z-[100] flex items-start pt-32 justify-center bg-white/40 backdrop-blur-[1px] rounded-3xl pointer-events-none">
            <div className="flex flex-col items-center bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-100 border-t-red-600 mb-3"></div>
              <span className="text-xs font-black uppercase tracking-widest text-slate-800 animate-pulse">Ładuję...</span>
            </div>
          </div>
        )}

        <aside className="w-full lg:w-80 flex-shrink-0">
          <CategoryFilters
            baseFilters={data.filters}
            narrowedFilters={data.narrowedFilters}
            disjunctiveFacets={data.disjunctiveFacets}
            allBrands={data.allBrands}
            allModels={data.allModels}
            totalCount={data.totalCount}
            isPending={isReallyLoading}
            activeFilters={displayFilters}
            updateFilter={updateFilter}
            toggleFilter={toggleFilter}
            clearFilter={clearFilter}
            commitMobileSelection={commitMobileSelection}
            currentBrandName={currentBrandName}
            currentModelName={currentModelName}
          />
        </aside>

        <div className="flex-1 flex flex-col min-h-[500px] relative">
          <CategoryToolbar
            totalCount={data.totalCount}
            activeFilters={displayFilters}
            updateFilter={updateFilter}
          />

          <div className={`transition-opacity duration-150 ${isReallyLoading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
            <ProductGrid
              initialProducts={data.products}
              totalCount={data.totalCount}
              fullPath={fullPath}
              isListView={isListView}
              onLoadMore={loadMore}
              hasMore={data.products.length < data.totalCount}
              isLoadingMore={loadingMore}
            />
          </div>
        </div>
      </div>
    </div>
    <StickyCartBar />
    </>
  );
}