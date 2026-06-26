'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const cleanLabel = (label: string) => {
  if (!label) return '';
  let cleaned = label.replace(/[\[\]]/g, '').trim();
  if (/^uniwersaln[aey]$/i.test(cleaned)) return 'Uniwersalna';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

export default function CategoryFilters({ 
  baseFilters = {}, 
  narrowedFilters = {}, 
  disjunctiveFacets = {}, 
  totalCount = 0, 
  isPending, 
  activeFilters = {}, 
  toggleFilter, 
  clearFilter, 
  updateFilter,
  isMobileFiltersOpen,
  setIsMobileFiltersOpen
}: any) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const [minPrice, setMinPrice] = useState(activeFilters.minPrice || '');
  const [maxPrice, setMaxPrice] = useState(activeFilters.maxPrice || '');
  const [searchQ, setSearchQ] = useState(activeFilters.q || '');

  const [filterSearchQuery, setFilterSearchQuery] = useState<Record<string, string>>({});
  const [expandedFilters, setExpandedFilters] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const checkScreenSize = () => setIsDesktop(window.innerWidth >= 1024);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    if (isMobileFiltersOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileFiltersOpen]);

  const applyPriceFilter = () => {
    if (minPrice) updateFilter('minPrice', minPrice); else clearFilter('minPrice');
    if (maxPrice) updateFilter('maxPrice', maxPrice); else clearFilter('maxPrice');
  };

  let techFilters = JSON.parse(JSON.stringify(baseFilters));

  // USUNIĘTO 'pasuje do marki' i 'pasuje do modelu' z wykluczeń! 
  const excludeKeys = ['kategoria', 'category', 'id', 'sku', 'title', 'slug', 'image', 'oem', 'numer katalogowy / oem', 'grupa produktowa', 'marka maszyny', 'marka', 'category_handle', 'category_handles', 'model', 'typ'];

  Object.keys(techFilters).forEach(key => {
    const lowerKey = key.toLowerCase();
    if (excludeKeys.includes(lowerKey) || lowerKey.includes('waga') || Object.keys(techFilters[key] || {}).length < 2) {
       delete techFilters[key];
    }
  });

  const filterCoverage = Object.keys(techFilters).map(key => {
    const count = Object.values(techFilters[key] as Record<string, number>).reduce((sum, c) => sum + c, 0);
    return { key, count };
  }).sort((a, b) => b.count - a.count);

  // WYMUSZAMY MARKE I MODEL NA SAMYM SZCZYCIE LISTY
  const priorityKeys = ['Pasuje do marki', 'Pasuje do modelu'];
  const otherKeys = filterCoverage.map(f => f.key).filter(k => !priorityKeys.includes(k));
  const techFilterKeys = [...priorityKeys.filter(k => techFilters[k]), ...otherKeys.slice(0, 6)];

  let activeFiltersCount = 0;
  Object.keys(activeFilters).forEach(key => {
    if (!['limit', 'sort', 'view', 'q', 'minPrice', 'maxPrice', 'm_filters'].includes(key)) {
       activeFiltersCount += (Array.isArray(activeFilters[key]) ? activeFilters[key].length : 1);
    }
  });

  const getAvailabilityMap = (filterKey: string): Record<string, number> => {
    const isActive = !!activeFilters[filterKey];
    if (isActive && disjunctiveFacets[filterKey]) {
      return disjunctiveFacets[filterKey];
    }
    return narrowedFilters[filterKey] || {};
  };

  const renderFilterBlock = (filterKey: string) => {
    const filterValues = techFilters[filterKey] as Record<string, number>;
    if (!filterValues) return null;
    const searchQuery = filterSearchQuery[filterKey]?.toLowerCase() || '';
    const availMap = getAvailabilityMap(filterKey);

    const sortedEntries = Object.entries(filterValues).sort((a, b) => {
      const aAvail = availMap[a[0]] || 0;
      const bAvail = availMap[b[0]] || 0;
      const aHas = aAvail > 0;
      const bHas = bAvail > 0;
      if (aHas !== bHas) return aHas ? -1 : 1; 
      return bAvail - aAvail;
    });

    const matchedEntries = sortedEntries.filter(([val]) => val.toLowerCase().includes(searchQuery));
    const isLongList = sortedEntries.length > 5;
    const isExpanded = expandedFilters[filterKey] || searchQuery.length > 0;

    // NAPRAWA KAFELKÓW: Prawidłowe rozbicie ciągu znaków na tablicę
    const rawVal = activeFilters[filterKey];
    const activeValuesArray = rawVal ? String(rawVal).split(',').filter(Boolean) : [];
    const hasActiveSelection = activeValuesArray.length > 0;

    return (
      <div key={filterKey} className={`space-y-3 transition-opacity duration-150 ${isPending ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        <div className="flex items-center justify-between">
          <h4 className="font-black text-[11px] uppercase tracking-wider text-slate-900 flex items-center gap-2">
            {filterKey}
            {hasActiveSelection && (
              <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{activeValuesArray.length}</span>
            )}
          </h4>
          {hasActiveSelection && (
            <button type="button" onClick={() => clearFilter(filterKey)} disabled={isPending} className="text-[9px] font-black uppercase text-red-600 hover:text-white tracking-wider bg-red-50 hover:bg-red-600 px-2 py-1 rounded transition-colors shadow-sm disabled:opacity-50">✕ Wyczyść</button>
          )}
        </div>

        {/* OSOBNE KAFELKI ZAMIAST JEDNEGO ZLEPIONEGO BLOKU */}
        {hasActiveSelection && (
          <div className="flex flex-wrap gap-1.5 pb-1">
            {activeValuesArray.map((selectedVal: string) => (
              <button
                key={selectedVal}
                type="button"
                onClick={(e) => { e.preventDefault(); if (!isPending) toggleFilter(filterKey, selectedVal); }}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-wider pl-2.5 pr-2 py-1.5 rounded-lg shadow-sm hover:bg-red-700 transition-colors disabled:opacity-50 group/chip"
              >
                <span className="truncate max-w-[180px]">{cleanLabel(selectedVal)}</span>
                <span className="bg-white/25 group-hover/chip:bg-white/40 rounded w-4 h-4 flex items-center justify-center text-[11px] leading-none transition-colors">✕</span>
              </button>
            ))}
          </div>
        )}

        {isLongList && (
          <div className="relative mb-3">
            <input aria-label={`Szukaj w filtrze ${filterKey}`} type="text" placeholder={`Szukaj w ${filterKey.toLowerCase()}...`} className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-3 min-h-[48px] text-[11px] font-bold text-slate-700 outline-none focus:border-red-600 transition-colors" value={filterSearchQuery[filterKey] || ''} onChange={(e) => setFilterSearchQuery(prev => ({ ...prev, [filterKey]: e.target.value }))} />
            <span className="absolute right-3 top-3 text-slate-500 text-sm">🔍</span>
          </div>
        )}

        <div className={`space-y-2 ${isExpanded ? 'max-h-[300px] overflow-y-auto pr-2 custom-scrollbar' : ''}`}>
          {matchedEntries.length === 0 ? (
            <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest py-2">Brak wyników</div>
          ) : (
            (isExpanded ? matchedEntries : matchedEntries.slice(0, 5)).map(([val]) => {
              // Sprawdzamy czy ta konkretna wartość jest w odseparowanej tablicy
              const isChecked = activeValuesArray.includes(val);
              const availCount = availMap[val] || 0;
              const isDisabled = availCount === 0 && !isChecked;

              return (
                <label
                  key={val}
                  className={`flex items-center justify-between py-2 px-2 min-h-[48px] rounded-lg transition-colors group ${isDisabled ? 'opacity-40 pointer-events-none' : 'cursor-pointer hover:bg-slate-50'} ${isChecked ? 'bg-red-50/60' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    if (!isDisabled && !isPending) toggleFilter(filterKey, val);
                  }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-6 h-6 border-2 rounded-md flex items-center justify-center transition-all flex-shrink-0 ${isChecked ? 'border-red-600 bg-red-50' : 'border-slate-300 bg-white group-hover:border-red-400'}`}>
                      {isChecked && <div className="w-3 h-3 bg-red-600 rounded-[3px]"></div>}
                    </div>
                    <span className={`text-sm transition-colors truncate ${isChecked ? 'text-red-700 font-black' : isDisabled ? 'text-slate-400 font-medium' : 'text-slate-700 font-medium group-hover:text-slate-900'}`}>{cleanLabel(val)}</span>
                  </div>
                  <div className="flex items-center gap-2 pl-2 flex-shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isDisabled ? 'text-slate-300 bg-slate-50 border-slate-100' : 'text-slate-500 bg-white border-slate-200'}`}>{availCount}</span>
                  </div>
                </label>
              );
            })
          )}
        </div>

        {isLongList && !isExpanded && (<button type="button" onClick={() => setExpandedFilters(prev => ({ ...prev, [filterKey]: true }))} className="text-[11px] p-2 min-h-[48px] font-black uppercase tracking-widest text-slate-500 hover:text-red-600 mt-2 flex items-center justify-center w-full pt-2 border-t border-slate-50">+ Pokaż więcej ({sortedEntries.length - 5})</button>)}
        {isLongList && isExpanded && (<button type="button" onClick={() => { setExpandedFilters(prev => ({ ...prev, [filterKey]: false })); setFilterSearchQuery(prev => ({ ...prev, [filterKey]: '' })); }} className="text-[11px] p-2 min-h-[48px] font-black uppercase tracking-widest text-slate-500 hover:text-red-600 mt-2 flex items-center justify-center w-full pt-2 border-t border-slate-50">- Zwiń listę</button>)}
      </div>
    );
  };

  const filterContent = (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-40 rotate-12 transform translate-x-8 -translate-y-8 rounded-full blur-xl group-hover:opacity-60 transition-opacity"></div>
        <div className="flex items-start gap-3 relative z-10">
          <span className="text-2xl leading-none pt-0.5 animate-pulse drop-shadow-md">💡</span>
          <div>
            <h4 className="text-amber-900 font-black text-xs uppercase tracking-widest mb-2">Nie widzisz swojej części?</h4>
            <p className="text-amber-800/90 text-xs font-medium leading-relaxed mb-4">Wpisz <strong className="text-amber-900 bg-amber-100/50 px-1 rounded">numer OEM</strong> u góry.</p>
            <a href="tel:+48500600700" className="inline-block bg-amber-600 text-white hover:bg-amber-700 text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95">📞 Zadzwoń</a>
          </div>
        </div>
      </div>

      <div className="mb-6 pb-6 border-b border-slate-100">
        <h3 className="font-black uppercase text-[11px] tracking-widest text-slate-900 mb-3">Znasz numer OEM?</h3>
        <div className="relative flex items-center">
          <input type="text" placeholder="Wpisz numer lub nazwę..." className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3.5 min-h-[48px] text-sm font-bold outline-none focus:border-red-600 transition-colors placeholder:text-slate-500" value={searchQ} onChange={(e) => setSearchQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && updateFilter('q', searchQ)} disabled={isPending} />
          <button type="button" onClick={() => updateFilter('q', searchQ)} disabled={isPending} className="absolute right-2 bg-slate-900 hover:bg-red-600 text-white px-4 rounded-lg transition-colors shadow-md min-w-[48px] min-h-[40px] flex items-center justify-center disabled:opacity-50">🔍</button>
        </div>
      </div>

      <div className={`mb-6 border-b border-slate-100 pb-6 transition-opacity duration-150 ${isPending ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-black text-[10px] uppercase tracking-wider text-slate-600">Zakres Cenowy (zł)</h4>
          {(activeFilters.minPrice || activeFilters.maxPrice) && (
             <button type="button" disabled={isPending} onClick={() => { setMinPrice(''); setMaxPrice(''); clearFilter('minPrice'); clearFilter('maxPrice'); }} className="text-[9px] font-black uppercase tracking-widest text-red-600 hover:text-white bg-red-50 hover:bg-red-600 px-2 py-1 rounded transition-colors shadow-sm disabled:opacity-50">✕ Wyczyść</button>
          )}
        </div>
        <div className="flex gap-2 items-center">
          <input type="number" placeholder="Od" disabled={isPending} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-3 text-xs font-bold text-slate-800 outline-none focus:border-red-600 min-h-[48px] disabled:opacity-50" value={minPrice} onChange={e => setMinPrice(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applyPriceFilter()} />
          <span className="text-slate-500 font-black">-</span>
          <input type="number" placeholder="Do" disabled={isPending} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-3 text-xs font-bold text-slate-800 outline-none focus:border-red-600 min-h-[48px] disabled:opacity-50" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applyPriceFilter()} />
        </div>
        <button type="button" disabled={isPending} onClick={applyPriceFilter} className="w-full mt-3 bg-slate-100 text-slate-800 py-3 rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors min-h-[48px] disabled:opacity-50">Zastosuj cenę</button>
      </div>

      <div className="space-y-8">
        {techFilterKeys.map((filterKey: string) => renderFilterBlock(filterKey))}
      </div>
    </div>
  );

  return (
    <>
      <div className="lg:hidden sticky top-0 z-[55] bg-white/95 backdrop-blur-md py-3 -mx-4 px-4 border-b border-slate-200 shadow-sm mb-4">
         <button type="button" onClick={() => setIsMobileFiltersOpen(true)} className="bg-slate-900 text-white w-full py-4 rounded-xl font-black text-[12px] uppercase tracking-widest shadow-md flex items-center justify-center gap-3 active:scale-95 transition-transform min-h-[56px]">
           <span className="text-base leading-none">🎛️</span> FILTRUJ I ZNAJDŹ
           {activeFiltersCount > 0 && <span className="bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-[11px] ml-1 shadow-inner">{activeFiltersCount}</span>}
         </button>
      </div>

      {isMobileFiltersOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[99999] w-full h-[100dvh] bg-white flex flex-col m-0 p-0 overflow-hidden">
           <div className="flex-none bg-slate-900 text-white p-4 flex justify-between items-center shadow-md" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
              <span className="font-black uppercase tracking-widest text-sm">Szukaj i Filtruj</span>
              <button type="button" onClick={() => setIsMobileFiltersOpen(false)} className="bg-slate-800 hover:bg-red-600 px-4 py-2.5 rounded-lg text-xs font-black uppercase transition-colors min-w-[48px] min-h-[48px]">✕ Zamknij</button>
           </div>
           <div className="flex-1 overflow-y-auto p-5 pb-24 custom-scrollbar bg-white">
              {filterContent}
           </div>
           <div className="flex-none bg-white p-4 border-t shadow-[0_-10px_20px_rgba(0,0,0,0.05)]" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
               <button type="button" disabled={isPending} onClick={() => setIsMobileFiltersOpen(false)} className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest active:scale-95 transition-transform min-h-[56px] disabled:opacity-50">
                  {isPending ? 'ŁADOWANIE...' : `Pokaż ${totalCount} wyników ➔`}
               </button>
           </div>
        </div>,
        document.body
      )}

      {isDesktop && (
        <div className="hidden lg:block w-full bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 relative">
          {filterContent}
        </div>
      )}
    </>
  );
}