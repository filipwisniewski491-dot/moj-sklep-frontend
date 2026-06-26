'use client';
import React, { useState } from 'react';
import Link from 'next/link';

// Slugify marki - identyczny jak w lib/brand-utils.ts (spójność URL)
const brandToSlug = (text: string) => {
  if (!text) return '';
  return text.toLowerCase()
    .trim()
    .replace(/[ąàáâ]/g, 'a').replace(/[ćč]/g, 'c').replace(/[ęèé]/g, 'e')
    .replace(/[łl]/g, 'l').replace(/[ńñ]/g, 'n').replace(/[óòôö]/g, 'o')
    .replace(/[śš]/g, 's').replace(/[źżž]/g, 'z').replace(/[üû]/g, 'u')
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Sekcja "Popularne marki" - linki do landing page marka.
 * brands: obiekt z facetów Meili { "Ursus": 730, "John Deere": 412, ... }
 * categoryPath: ścieżka kategorii np. "czesci-do-ciagnikow"
 *
 * Przy konflikcie slugów (Deutz / Deutz') wybiera markę z największą liczbą produktów.
 */
export default function PopularBrands({
  brands,
  categoryPath,
  initialCount = 12,
}: {
  brands: Record<string, number>;
  categoryPath: string;
  initialCount?: number;
}) {
  const [showAll, setShowAll] = useState(false);

  if (!brands || Object.keys(brands).length === 0) return null;
  if (!categoryPath) return null;

  // Deduplikacja po slugu - przy konflikcie zostaje marka z większą liczbą produktów
  const bySlug: Record<string, { name: string; count: number }> = {};
  for (const [name, count] of Object.entries(brands)) {
    const slug = brandToSlug(name);
    if (!slug) continue;
    // pomijamy "Uniwersalne" i podobne nie-marki w linkowaniu SEO
    if (slug === 'uniwersalne' || slug === 'brak' || slug === 'inne') continue;
    const ex = bySlug[slug];
    if (!ex || count > ex.count) bySlug[slug] = { name, count };
  }

  // sortuj wg liczby produktów malejąco
  const sorted = Object.entries(bySlug)
    .map(([slug, v]) => ({ slug, name: v.name, count: v.count }))
    .sort((a, b) => b.count - a.count);

  if (sorted.length === 0) return null;

  const displayList = showAll ? sorted : sorted.slice(0, initialCount);

  return (
    <div className="mb-4 border-t border-slate-100 pt-5">
      <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-600 mb-4">Popularne marki:</h2>
      <div className="flex flex-wrap gap-2 lg:gap-3">
        {displayList.map((brand) => (
          <Link
            aria-label={`Części do marki ${brand.name}`}
            key={brand.slug}
            href={`/kategoria/${categoryPath}/${brand.slug}`}
            prefetch={false}
            className="px-5 py-3.5 bg-white border border-slate-200 hover:border-slate-900 hover:bg-slate-900 hover:text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm min-h-[48px] flex items-center justify-center gap-2"
          >
            {brand.name}
            <span className="text-slate-400 font-bold normal-case">{brand.count}</span>
          </Link>
        ))}
        {sorted.length > initialCount && (
          <button
            aria-label="Pokaż wszystkie marki"
            onClick={() => setShowAll(!showAll)}
            className="px-5 py-3.5 bg-slate-50 border-2 border-slate-200 text-slate-700 hover:border-red-600 hover:text-red-600 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-1.5 min-h-[48px] justify-center"
          >
            {showAll ? <><span>↑</span> Zwiń listę</> : <><span>+ {sorted.length - initialCount}</span> więcej ▾</>}
          </button>
        )}
      </div>
    </div>
  );
}