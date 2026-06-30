'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';

const cleanLabel = (label: string) => {
  if (!label) return '';
  let cleaned = label.replace(/[\[\]]/g, '').trim();
  if (/^uniwersaln[aey]$/i.test(cleaned)) return 'Uniwersalna';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

const SearchableSelect = ({ label, options = {}, value, onChange, placeholder }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sortedOptions = Object.entries(options).sort((a, b) => (b[1] as number) - (a[1] as number));
  const filteredOptions = sortedOptions.filter(([val]) => val.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="w-full relative" ref={wrapperRef}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-slate-600 font-black uppercase text-[10px] tracking-widest">{label}</h3>
        {value && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(''); setIsOpen(false); }}
            className="text-[9px] font-black uppercase tracking-widest text-red-600 hover:text-white bg-red-50 hover:bg-red-600 px-2 py-1 rounded transition-colors shadow-sm"
          >
            ✕ Wyczyść
          </button>
        )}
      </div>
      <button type="button" aria-label={`Wybierz ${label}`} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-4 py-3.5 min-h-[48px] flex justify-between items-center cursor-pointer transition-colors hover:border-red-500 shadow-sm" onClick={() => setIsOpen(!isOpen)}>
        <span className={value ? "text-slate-900 line-clamp-1 text-left" : "text-slate-500 text-left"}>{value ? cleanLabel(value) : placeholder}</span>
        <svg className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>
      {isOpen && (
        <div className="absolute z-[99] w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-slate-100 bg-slate-50/90 backdrop-blur-md">
            <input aria-label={`Szukaj w ${label}`} type="text" className="w-full bg-white border border-slate-200 text-slate-900 text-xs px-3 py-3 rounded-lg outline-none focus:border-red-600 placeholder:text-slate-400 transition-colors min-h-[48px]" placeholder="Wpisz, aby wyszukać..." value={searchTerm} onClick={(e) => e.stopPropagation()} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="max-h-56 overflow-y-auto custom-scrollbar bg-white">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-4 text-xs text-slate-500 italic text-center">Brak wyników</div>
            ) : (
              filteredOptions.map(([val, count]) => (
                <button type="button" aria-label={`Wybierz opcję ${val}`} key={val} className={`w-full text-left px-4 py-4 min-h-[48px] text-xs font-bold cursor-pointer transition-colors flex justify-between items-center border-t border-slate-50 ${value === val ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`} onClick={() => { onChange(val); setIsOpen(false); setSearchTerm(''); }}>
                  <span className="line-clamp-1 pr-2">{cleanLabel(val)}</span>
                  <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600 border border-slate-200">{count as number}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function CategoryFilters({ baseFilters = {}, narrowedFilters = {}, disjunctiveFacets = {}, allBrands = {}, allModels = {}, facetOrder = [], totalCount = 0, isPending, activeFilters = {}, toggleFilter, clearFilter, updateFilter, commitMobileSelection, currentBrandName = null, currentModelName = null, isMobileFiltersOpen = false, setIsMobileFiltersOpen = () => {} }: any) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // 🔥 MOBILE: odłożony wybór marki/modelu. null = "wyczyść", undefined = "bez zmian" (użyj aktualnej).
  const [pendingBrand, setPendingBrand] = useState<string | null | undefined>(undefined);
  const [pendingModel, setPendingModel] = useState<string | null | undefined>(undefined);

  // Gdy otwieramy panel mobilny - zresetuj odłożony wybór do stanu aktualnego (bez zmian)
  useEffect(() => {
    if (isMobileFiltersOpen) {
      setPendingBrand(undefined);
      setPendingModel(undefined);
    }
  }, [isMobileFiltersOpen]);

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
    setIsMobileFiltersOpen(false);
  };

  const isMarkaSelected = !!activeFilters['Pasuje do marki'];
  // 🔥 PEŁNA lista marek (wszystkie w kategorii) - żeby user mógł zmienić markę.
  // Fallback na baseFilters gdy allBrands puste (np. zwykła kategoria bez marki w URL).
  const formatedGarageMake = (Object.keys(allBrands).length > 0 ? allBrands : (baseFilters['Pasuje do marki'] || baseFilters['Marka'] || {}));
  // PEŁNA lista modeli dla wybranej marki - żeby user mógł zmienić model.
  const formatedGarageModel = isMarkaSelected
    ? (Object.keys(allModels).length > 0 ? allModels : (narrowedFilters['Pasuje do modelu'] || narrowedFilters['Model'] || {}))
    : (baseFilters['Pasuje do modelu'] || baseFilters['Model'] || {});

  let techFilters = JSON.parse(JSON.stringify(baseFilters));

  // Marka/model/kategoria mają własne UI, a Waga/Zastosowanie/Grupa produktowa właściciel wyłączył - nie pokazuj ich jako checkboxy.
  const HIDE_IN_TECH = new Set(['Pasuje do marki', 'Pasuje do modelu', 'Marka', 'category_handles', 'Waga [kg]', 'Zastosowanie', 'Grupa produktowa']);

  // 🔁 Kolejność filtrów przychodzi z backendu (facetOrder): już posortowana wg pokrycia
  // w TEJ kategorii, z marką/modelem/typem przypiętym i pominięciem pól o zbyt wielu wartościach.
  // Fallback: gdy facetOrder nie dotarł, policz pokrycie lokalnie (jak dawniej).
  const orderedKeys: string[] = (Array.isArray(facetOrder) && facetOrder.length > 0)
    ? facetOrder.slice()
    : Object.keys(techFilters).sort((a, b) => {
        const ca = Object.values(techFilters[a] || {} as any).reduce((s: number, c: any) => s + c, 0);
        const cb = Object.values(techFilters[b] || {} as any).reduce((s: number, c: any) => s + c, 0);
        return cb - ca;
      });

  // Pokaż WSZYSTKIE filtry, które backend wybrał dla tej kategorii (bez sztywnego limitu 5).
  // Backend już ograniczył listę do ~14 najlepszych, więc tu tylko odsiewamy puste/jednowartościowe.
  const techFilterKeys = orderedKeys.filter((key) => {
    if (HIDE_IN_TECH.has(key)) return false;
    const vals = techFilters[key];
    return vals && Object.keys(vals).length >= 2;
  }).slice(0, 20); // miękki bezpiecznik, gdyby kiedyś przyszło więcej

  let activeFiltersCount = 0;
  Object.keys(activeFilters).forEach(key => {
    if (!['limit', 'sort', 'view', 'Pasuje do marki', 'Pasuje do modelu', 'q', 'minPrice', 'maxPrice'].includes(key)) {
       activeFiltersCount += (Array.isArray(activeFilters[key]) ? activeFilters[key].length : 1);
    }
  });

  // 🔥 Wybór właściwego źródła liczb dla danego filtra:
  // - filtr AKTYWNY (user coś w nim wybrał) -> disjunctiveFacets (nie gasi sam siebie)
  // - filtr NIEAKTYWNY -> narrowedFilters (zawężony wszystkim, pokazuje co dostępne)
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

    // mapa dostępności: ile produktów ma każda wartość w aktualnym kontekście
    const availMap = getAvailabilityMap(filterKey);

    // 🔥 SORTOWANIE: dostępne (>0) na górze wg liczby, niedostępne (szare) na dole
    const sortedEntries = Object.entries(filterValues).sort((a, b) => {
      const aAvail = availMap[a[0]] || 0;
      const bAvail = availMap[b[0]] || 0;
      const aHas = aAvail > 0;
      const bHas = bAvail > 0;
      if (aHas !== bHas) return aHas ? -1 : 1;   // dostępne pierwsze
      return bAvail - aAvail;                      // potem wg liczby (malejąco)
    });

    const matchedEntries = sortedEntries.filter(([val]) => val.toLowerCase().includes(searchQuery));

    const isLongList = sortedEntries.length > 5;
    const isExpanded = expandedFilters[filterKey] || searchQuery.length > 0;

    // 🔥 NAPRAWA sklejania: wartości multi-select trzymane jako string "A,B,C" - dzielimy po przecinku
    const rawValue = activeFilters[filterKey];
    const activeValuesArray: string[] = Array.isArray(rawValue)
      ? rawValue
      : (rawValue ? String(rawValue).split(',').map((v: string) => v.trim()).filter(Boolean) : []);
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

        {/* 🔥 CHIPSY zaznaczonych wartości - widoczne, łatwe do usunięcia */}
        {hasActiveSelection && (
          <div className="flex flex-wrap gap-1.5 pb-1">
            {activeValuesArray.map((selectedVal: string) => (
              <button
                key={selectedVal}
                type="button"
                onClick={() => { if (!isPending) toggleFilter(filterKey, selectedVal); }}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-wider pl-2.5 pr-2 py-1.5 rounded-lg shadow-sm hover:bg-red-700 transition-colors disabled:opacity-50 group/chip"
              >
                <span>{cleanLabel(selectedVal)}</span>
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
              const isChecked = activeValuesArray.includes(val);
              // 🔥 LICZNIK: realna liczba dostępnych produktów w aktualnym kontekście
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

  const renderFilterContent = (mobileCtx: boolean) => (
    <div className="space-y-6">

      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-40 rotate-12 transform translate-x-8 -translate-y-8 rounded-full blur-xl group-hover:opacity-60 transition-opacity"></div>
        <div className="flex items-start gap-3 relative z-10">
          <span className="text-2xl leading-none pt-0.5 drop-shadow-md">💡</span>
          <div>
            <h4 className="text-amber-900 font-black text-xs uppercase tracking-widest mb-2">Nie znalazłeś części?</h4>
            <p className="text-amber-800/90 text-xs font-medium leading-relaxed mb-4">Mamy ponad <strong className="text-amber-900">140 000 części</strong>. Jeśli filtry jej nie pokazują — zadzwoń, dobierzemy ją dla Ciebie po numerze OEM lub modelu maszyny.</p>
            <a href="tel:+48257888900" className="inline-flex items-center gap-2 bg-amber-600 text-white hover:bg-amber-700 text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95">📞 Zadzwoń: 25 788 89 00</a>
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

      <div className="mb-6 pb-6 border-b border-slate-100">
        <h3 className="font-black uppercase text-[11px] tracking-widest text-slate-900 mb-3">Dobierz do maszyny</h3>
        <div className={`space-y-3 transition-opacity duration-150 ${isPending ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <SearchableSelect
            label="Marka maszyny"
            placeholder={"Wybierz markę"}
            options={formatedGarageMake}
            value={mobileCtx ? (pendingBrand === undefined ? (currentBrandName || '') : (pendingBrand || '')) : (activeFilters['Pasuje do marki'] || '')}
            onChange={(val: string) => {
              if (mobileCtx) {
                // odłożony wybór: zapisz markę, wyzeruj model (inna marka = inne modele)
                setPendingBrand(val || null);
                setPendingModel(null);
              } else {
                updateFilter('Pasuje do marki', val);
              }
            }}
          />
          <SearchableSelect
            label="Model maszyny"
            placeholder={"Wybierz model"}
            options={formatedGarageModel}
            value={mobileCtx ? (pendingModel === undefined ? (currentModelName || '') : (pendingModel || '')) : (activeFilters['Pasuje do modelu'] || '')}
            onChange={(val: string) => {
              if (mobileCtx) {
                setPendingModel(val || null);
              } else {
                updateFilter('Pasuje do modelu', val);
              }
            }}
          />
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
      {isMobileFiltersOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[99999] w-full h-[100dvh] bg-white flex flex-col m-0 p-0 overflow-hidden">
           <div className="flex-none bg-slate-900 text-white p-4 flex justify-between items-center shadow-md" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
              <span className="font-black uppercase tracking-widest text-sm">Szukaj i Filtruj</span>
              <button type="button" onClick={() => setIsMobileFiltersOpen(false)} className="bg-slate-800 hover:bg-red-600 px-4 py-2.5 rounded-lg text-xs font-black uppercase transition-colors min-w-[48px] min-h-[48px]">✕ Zamknij</button>
           </div>
           <div className="flex-1 overflow-y-auto p-5 pb-24 custom-scrollbar bg-white">
              {renderFilterContent(true)}
           </div>
           <div className="flex-none bg-white p-4 border-t shadow-[0_-10px_20px_rgba(0,0,0,0.05)]" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
               <button type="button" disabled={isPending} onClick={() => {
                 // 🔥 Zatwierdź odłożony wybór marki/modelu (jeśli zmieniony), potem zamknij panel.
                 const brandChanged = pendingBrand !== undefined;
                 const modelChanged = pendingModel !== undefined;
                 if ((brandChanged || modelChanged) && commitMobileSelection) {
                   const finalBrand = brandChanged ? pendingBrand : undefined;
                   const finalModel = modelChanged ? pendingModel : undefined;
                   commitMobileSelection(finalBrand, finalModel);
                 }
                 setIsMobileFiltersOpen(false);
               }} className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest active:scale-95 transition-transform min-h-[56px] disabled:opacity-50">
                  {isPending ? 'ŁADOWANIE...' : `Pokaż ${totalCount} wyników ➔`}
               </button>
           </div>
        </div>,
        document.body
      )}

      {isDesktop && (
        <div className="hidden lg:block w-full bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 relative">
          {renderFilterContent(false)}
        </div>
      )}
    </>
  );
}