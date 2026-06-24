'use client';

import React, { useState, useEffect, useRef } from 'react';
import { meiliClient } from '@/lib/meilisearch-client';
import CategoryFilters from './CategoryFilters';
import CategoryToolbar from './CategoryToolbar';
import ProductGrid from './ProductGrid';

const OPTIMIZED_FACETS = [
  'Pasuje do marki', 'Pasuje do modelu', 'Typ produktu', 'Producent', 
  'Rodzaj', 'Waga [kg]', 'Napięcie [V]', 'Strona zabudowy', 
  'Ilość zębów', 'Wymiary', 'Średnica wewnętrzna [mm]', 'Średnica zewnętrzna [mm]', 'Zastosowanie'
];

export default function CategoryWorkspace({ initialData, fullPath, currentHandle, allowedHandles }: any) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);

  const [activeFilters, setActiveFilters] = useState<Record<string, string>>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return Object.fromEntries(params.entries());
    }
    return {};
  });

  const isFirstRender = useRef(true);

  // Funkcja pomocnicza dla Toolbara
  const updateFilter = (key: string, value: string | null) => {
    setActiveFilters((prev: any) => {
      const next = { ...prev };
      if (value) next[key] = value; else delete next[key];
      return next;
    });
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const fetchFromMeiliDirectly = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        Object.entries(activeFilters).forEach(([k, v]) => {
          if (v) params.set(k, v);
        });
        
        // Zmiana paska URL z zachowaniem historii (aby działał przycisk Wstecz)
        const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
        window.history.pushState(null, '', newUrl);

        const index = meiliClient.index('products');
        const safeHandles = allowedHandles?.filter(Boolean) || [currentHandle];
        const categoryFilterStr = `category_handles IN [${safeHandles.map((h: string) => JSON.stringify(h)).join(', ')}]`;
        const filterArray: string[] = [categoryFilterStr];

        Object.entries(activeFilters).forEach(([key, val]) => {
          if (['limit', 'sort', 'minPrice', 'maxPrice', 'q', 'page', 'view'].includes(key)) return;
          if (!val) return;
          const values = String(val).split(',').map(v => v.trim()).filter(Boolean);
          if (values.length > 0) {
            // 🔥 POPRAWIONE: Meilisearch w 100% wymaga tutaj POJEDYNCZEGO apostrofu ('${key}')
            const orConditions = values.map(v => `'${key}' = ${JSON.stringify(v)}`);
            filterArray.push(`(${orConditions.join(' OR ')})`);
          }
        });

        if (activeFilters.minPrice) filterArray.push(`price >= ${activeFilters.minPrice}`);
        if (activeFilters.maxPrice) filterArray.push(`price <= ${activeFilters.maxPrice}`);

        const q = activeFilters.q || "";
        let meiliSort = undefined;
        if (activeFilters.sort === 'price_asc') meiliSort = ['price:asc'];
        if (activeFilters.sort === 'price_desc') meiliSort = ['price:desc'];
        const limit = activeFilters.limit ? parseInt(activeFilters.limit) : 250;

        const finalFilterString = filterArray.join(' AND ');

        const [baseFacetsResult, searchResult] = await Promise.all([
          index.search(q, { limit: 0, filter: categoryFilterStr, facets: OPTIMIZED_FACETS }),
          index.search(q, { limit, filter: finalFilterString, sort: meiliSort, facets: OPTIMIZED_FACETS })
        ]);

        setData({
          filters: baseFacetsResult.facetDistribution || {},
          narrowedFilters: searchResult.facetDistribution || {},
          products: searchResult.hits.map((p: any) => ({
            id: p.id, sku: p.id, name: p.title, price: p.price || 0, slug: p.handle,
            category_text: p.Kategoria || '', images: p.thumbnail ? [{ url: p.thumbnail }] : []
          })),
          totalCount: searchResult.estimatedTotalHits || searchResult.hits.length
        });

      } catch (e) {
        console.error("❌ Błąd Meilisearch na froncie:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchFromMeiliDirectly();
  }, [activeFilters]);

  // Nasłuchiwanie przycisku "Wstecz" w przeglądarce
  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      setActiveFilters(Object.fromEntries(params.entries()));
    };
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  const fetchFromMeiliDirectly = async () => {
  setLoading(true);
  try {
    const index = meiliClient.index('products');
    const safeHandles = allowedHandles?.filter(Boolean) || [currentHandle];
    const categoryFilterStr = `category_handles IN [${safeHandles.map((h: string) => JSON.stringify(h)).join(', ')}]`;
    
    // --- DIAGNOSTYKA ---
    console.log("DEBUG: Czy zapytanie ma filtry:", categoryFilterStr);
    
    const searchResult = await index.search(activeFilters.q || "", {
      filter: categoryFilterStr, // NA RAZ TYLKO FILTR KATEGORII
      limit: 250
    });

    console.log("DEBUG: Czy Meili zwrócił jakiekolwiek produkty:", searchResult.hits.length);
    
    if (searchResult.hits.length === 0) {
       console.warn("UWAGA: Meilisearch nie znalazł produktów dla tego zapytania!");
    }

    setData({
      products: searchResult.hits.map((p: any) => ({
        id: p.id, sku: p.id, name: p.title, price: p.price || 0, slug: p.handle,
        category_text: p.Kategoria || '', images: p.thumbnail ? [{ url: p.thumbnail }] : []
      })),
      totalCount: searchResult.estimatedTotalHits || 0,
      filters: {}, narrowedFilters: {}
    });
  } catch (e) {
    console.error("❌ BŁĄD MEILISEARCH:", e);
  } finally {
    setLoading(false);
  }
};
}