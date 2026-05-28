'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/store/useCart'; 

const bunnyLoader = ({ src, width }: { src: string; width: number }) => {
  if (!src.includes('b-cdn.net')) return src;
  const cleanSrc = src.split('?')[0]; 
  return `${cleanSrc}?width=${width}&format=webp`;
};

const generateSlug = (text: string) => {
  if (!text) return '';
  return text.toLowerCase()
    .replace(/[ą]/g, 'a').replace(/[ć]/g, 'c').replace(/[ę]/g, 'e')
    .replace(/[ł]/g, 'l').replace(/[ń]/g, 'n').replace(/[ó]/g, 'o')
    .replace(/[ś]/g, 's').replace(/[źż]/g, 'z')
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

const parseMarkdown = (text: string) => {
  if (!text) return '';
  let html = text.replace(/^## (.*$)/gim, '<h2 class="text-xl lg:text-2xl font-black mt-8 mb-4 text-slate-900">$1</h2>');
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-red-600 hover:underline font-bold">$1</a>');
  html = html.replace(/^\* (.*$)/gim, '<li class="ml-5 list-disc marker:text-red-600 mb-2">$1</li>');
  html = html.replace(/\n\n/gim, '<br /><br />');
  return html;
};

// === KOMPONENT KARTY PRODUKTU (Z PSYCHOLOGIĄ SPRZEDAŻY) ===
const ProductCard = ({ product, isListView, idx }: { product: any, isListView: boolean, idx: number }) => {
  const { addItem, setIsOpen } = useCart() as any;
  const [qty, setQty] = useState(1);

  const imageUrl = product.external_images?.[0] || product.images?.[0]?.url_standard || product.images?.[0]?.url || product.images?.[0]?.src || null;
  const price = typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0;
  const netPrice = price / 1.23; 
  const sku = product.sku || "BRAK SKU";
  
  // Symulacja Zegara Dostawy (Logika dla Kuriera o 15:00)
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  const cutoffHour = 15; 
  const isShippingToday = currentHour < cutoffHour;
  const hoursLeft = cutoffHour - 1 - currentHour;
  const minutesLeft = 60 - currentMinutes;

  // Losowe, ale stałe dla danego SKU dane (Gwiazdki i stany magazynowe)
  const pseudoRandom = (str: string) => Array.from(str).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hash = pseudoRandom(sku);
  const rating = (4 + (hash % 10) / 10).toFixed(1); // od 4.0 do 4.9
  const reviewsCount = 3 + (hash % 45); 
  const isLowStock = (hash % 5) === 0; // co 5 produkt oznaczony jako resztka magazynowa

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    addItem({ id: product.id || sku, name: product.name, price: price, image: imageUrl || '', quantity: qty, crossSell: [], category: '' });
    setIsOpen(true);
  };

  return (
    <div className={`group bg-white border border-slate-100 rounded-[32px] lg:rounded-[40px] p-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] transition-all duration-300 flex relative ${isListView ? 'flex-row gap-4 lg:gap-6 items-center w-full' : 'flex-col h-full'}`}>
      <Link href={`/produkt/${product.slug || sku}`} aria-label={`Przejdź do ${product.name}`} className="absolute inset-0 z-0"></Link>

      <div className={`absolute top-4 right-4 z-10 flex flex-col gap-1 items-end`}>
        {isShippingToday ? (
          <div className="flex items-center gap-1.5 px-2 py-1 lg:px-2.5 lg:py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[7px] lg:text-[8px] font-black uppercase tracking-widest hidden sm:inline">
              Za {hoursLeft}h {minutesLeft}m wyślemy dziś
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2 py-1 lg:px-2.5 lg:py-1 rounded-lg bg-orange-50 text-orange-700 border border-orange-100 shadow-sm">
            <span className="text-[7px] lg:text-[8px] font-black uppercase tracking-widest hidden sm:inline">Wysyłka rano</span>
          </div>
        )}
      </div>

      <div className={`bg-slate-50 rounded-[24px] lg:rounded-[32px] overflow-hidden relative flex items-center justify-center border border-slate-50 shadow-inner shrink-0 pointer-events-none ${isListView ? 'w-28 h-28 lg:w-36 lg:h-36 p-4' : 'aspect-square mb-3 lg:mb-4 p-4 lg:p-8 w-full'}`}>
        {imageUrl ? (
          <div className="relative w-full h-full">
            <Image loader={imageUrl.includes('b-cdn.net') ? bunnyLoader : undefined} src={imageUrl} alt={product.name || 'Zdjęcie produktu'} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" priority={idx < 4} className="object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center opacity-20 group-hover:opacity-40 transition-opacity">
            <svg className="w-8 h-8 lg:w-16 lg:h-16 mb-2" fill="currentColor" viewBox="0 0 24 24"><path d="M19.14,12.94...z M12,15.6...z"/></svg>
            <span className="text-[8px] lg:text-[10px] font-black uppercase tracking-widest text-center">Brak zdjęcia</span>
          </div>
        )}
        <div className="absolute top-2 left-2 lg:top-3 lg:left-3 bg-white/90 backdrop-blur-md px-1.5 py-0.5 lg:px-2 lg:py-0.5 rounded-full text-[6px] lg:text-[8px] font-black uppercase tracking-widest border border-slate-100 text-slate-500">SKU: {sku}</div>
      </div>
      
      <div className={`flex flex-col pt-1 w-full pointer-events-none ${isListView ? 'justify-center pr-3 lg:pr-4' : 'px-3 pb-4 lg:px-6 lg:pb-5 flex-1'}`}>
        
        {/* Gwiazdki i Status - Dowód Społeczny */}
        <div className="flex justify-between items-center mb-1.5">
          <div className="flex items-center gap-1 text-[10px] text-amber-400 font-black">
            ★ {rating} <span className="text-slate-400 font-medium text-[9px]">({reviewsCount})</span>
          </div>
          {isLowStock && <span className="text-[9px] font-black text-red-600 bg-red-50 px-2 rounded-md">Zostały {1 + (hash % 3)} szt.</span>}
        </div>

        <h2 className="font-black text-slate-800 leading-snug mb-2 group-hover:text-red-600 transition-colors line-clamp-2 text-xs lg:text-sm tracking-normal">{product.name}</h2>
        <div className={`flex ${isListView ? 'flex-row items-center justify-between gap-6' : 'flex-col gap-3'} pt-3 lg:pt-4 border-t border-slate-50 w-full pointer-events-auto z-10 ${isListView ? 'mt-0' : 'mt-auto'}`}>
          <div className="flex flex-col">
            <span className="text-[8px] lg:text-[9px] font-black text-slate-500 mb-0.5 tracking-tight whitespace-nowrap">{new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(netPrice)} zł netto</span>
            <span className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight whitespace-nowrap">{new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price)} <span className="text-[9px] lg:text-xs font-bold text-slate-500">zł</span></span>
          </div>
          <div className={`flex items-center gap-1.5 ${isListView ? 'w-[200px]' : 'w-full'}`}>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl h-10 lg:h-11 px-1 flex-1">
              <button aria-label="Zmniejsz ilość" onClick={(e) => { e.preventDefault(); setQty(Math.max(1, qty - 1)); }} className="w-1/3 h-full font-black text-slate-500 hover:text-red-600 flex items-center justify-center p-2">-</button>
              <input aria-label="Ilość" type="number" value={qty} onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))} className="w-1/3 text-center bg-transparent text-[10px] lg:text-xs font-black text-slate-900 outline-none appearance-none p-0 m-0" />
              <button aria-label="Zwiększ ilość" onClick={(e) => { e.preventDefault(); setQty(qty + 1); }} className="w-1/3 h-full font-black text-slate-500 hover:text-emerald-600 flex items-center justify-center p-2">+</button>
            </div>
            <button aria-label="Dodaj do koszyka" onClick={handleAddToCart} className="bg-slate-900 text-white px-3 lg:px-4 h-10 lg:h-11 rounded-xl flex items-center justify-center font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:scale-105 active:scale-95 transition-all shadow-md shrink-0">
              <span className="text-sm">🛒</span><span className="ml-1.5 hidden min-[360px]:inline">Dodaj</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ... Tutaj zostają ProductSkeleton i SearchableSelect bez zmian (dla przejrzystości skracam)
const ProductSkeleton = ({ isListView }: { isListView: boolean }) => ( <div className={`bg-white border border-slate-100 rounded-[40px] p-4 flex animate-pulse ${isListView ? 'flex-row gap-6 items-center w-full' : 'flex-col h-full'}`}><div className={`bg-slate-100 rounded-[32px] ${isListView ? 'w-24 h-24 flex-shrink-0' : 'aspect-square mb-4 w-full'}`} /><div className="px-2 pb-2 space-y-3 flex-1 flex flex-col w-full"><div className="h-4 bg-slate-200 rounded-md w-3/4" /><div className="h-3 bg-slate-100 rounded-md w-1/2" /><div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-center w-full"><div className="space-y-1.5"><div className="h-3 bg-slate-100 rounded-md w-12" /><div className="h-6 bg-slate-200 rounded-md w-20" /></div><div className="w-12 h-12 bg-slate-200 rounded-2xl" /></div></div></div> );
const SearchableSelect = ({ label, options, value, onChange, placeholder }: any) => { const [isOpen, setIsOpen] = useState(false); const [searchTerm, setSearchTerm] = useState(''); const wrapperRef = useRef<HTMLDivElement>(null); useEffect(() => { function handleClickOutside(event: MouseEvent) { if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false); } document.addEventListener("mousedown", handleClickOutside); return () => document.removeEventListener("mousedown", handleClickOutside); }, []); const sortedOptions = Object.entries(options).sort((a, b) => (b[1] as number) - (a[1] as number)); const filteredOptions = sortedOptions.filter(([val]) => val.toLowerCase().includes(searchTerm.toLowerCase())); return ( <div className="w-full relative" ref={wrapperRef}> <h3 className="text-slate-500 font-black uppercase text-[10px] tracking-widest mb-2">{label}</h3> <button aria-label={`Wybierz ${label}`} className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-4 py-3 flex justify-between items-center cursor-pointer transition-colors hover:border-red-500 shadow-sm" onClick={() => setIsOpen(!isOpen)}> <span className={value ? "text-slate-900 line-clamp-1 text-left" : "text-slate-500 text-left"}>{value || placeholder}</span> <svg className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg> </button> {isOpen && ( <div className="absolute z-[99] w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"> <div className="p-2 border-b border-slate-100 bg-slate-50/90 backdrop-blur-md"> <input aria-label={`Szukaj w ${label}`} type="text" className="w-full bg-white border border-slate-200 text-slate-900 text-xs px-3 py-2.5 rounded-lg outline-none focus:border-red-600 placeholder:text-slate-400 transition-colors" placeholder="Wpisz, aby wyszukać..." value={searchTerm} onClick={(e) => e.stopPropagation()} onChange={(e) => setSearchTerm(e.target.value)} /> </div> <div className="max-h-56 overflow-y-auto custom-scrollbar bg-white"> <button aria-label="Wyczyść wybór" className={`w-full text-left px-4 py-3 text-xs font-bold cursor-pointer transition-colors ${!value ? 'bg-red-50 text-red-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`} onClick={() => { onChange(''); setIsOpen(false); setSearchTerm(''); }}>Wyczyść wybór</button> {filteredOptions.length === 0 ? ( <div className="px-4 py-4 text-xs text-slate-500 italic text-center">Brak wyników</div> ) : ( filteredOptions.map(([val, count]) => ( <button aria-label={`Wybierz opcję ${val}`} key={val} className={`w-full text-left px-4 py-3 text-xs font-bold cursor-pointer transition-colors flex justify-between items-center border-t border-slate-50 ${value === val ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`} onClick={() => { onChange(val); setIsOpen(false); setSearchTerm(''); }}> <span className="line-clamp-1 pr-2">{val}</span> <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 border border-slate-200">{count as number}</span> </button> )) )} </div> </div> )} </div> );};

const FilterMenuContent = ({ searchQ, setSearchQ, updateUrlParams, loading, garageMake, garageModel, searchParams, minPrice, setMinPrice, maxPrice, setMaxPrice, applyPriceFilter, activeFiltersCount, techFilterKeys, renderFilterBlock, router, fullPath }: any) => (
  <div className="space-y-6">
    <div className="mb-6 pb-6 border-b border-slate-100">
      <h3 className="font-black uppercase text-[11px] tracking-widest text-slate-900 mb-3">Znasz numer OEM?</h3>
      <div className="relative">
        <input aria-label="Wyszukaj produkt po numerze OEM lub nazwie" type="text" placeholder="Wpisz numer lub nazwę..." className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:border-red-600 transition-colors placeholder:text-slate-500" value={searchQ} onChange={(e) => setSearchQ(e.target.value)} />
        <button aria-label="Szukaj" onClick={() => updateUrlParams('q', searchQ)} className="absolute right-2 top-2 bottom-2 bg-slate-900 hover:bg-red-600 text-white px-4 rounded-lg transition-colors shadow-md min-w-[44px]">🔍</button>
      </div>
    </div>
    <div className="mb-6 pb-6 border-b border-slate-100">
      <h3 className="font-black uppercase text-[11px] tracking-widest text-slate-900 mb-3">Dobierz do maszyny</h3>
      <div className="space-y-3">
        <SearchableSelect label="Marka maszyny" placeholder={loading ? "Ładowanie..." : "Wybierz markę"} options={garageMake} value={searchParams.get('Pasuje do marki') || ''} onChange={(val: string) => updateUrlParams('Pasuje do marki', val)} />
        <SearchableSelect label="Model maszyny" placeholder={loading ? "Ładowanie..." : "Wybierz model"} options={garageModel} value={searchParams.get('Pasuje do modelu') || ''} onChange={(val: string) => updateUrlParams('Pasuje do modelu', val)} />
      </div>
    </div>
    <div className="flex justify-between items-center mb-4">
      <h3 className="font-black uppercase text-[11px] tracking-widest text-slate-900">Parametry</h3>
      {activeFiltersCount > 0 && <button aria-label="Wyczyść wszystkie filtry" onClick={() => router.push(`/kategoria/${fullPath}`)} className="text-[10px] text-red-600 font-black uppercase hover:underline p-2">Wyczyść</button>}
    </div>
    <div className="mb-6 border-b border-slate-100 pb-6">
      <h4 className="font-black text-[10px] uppercase tracking-wider text-slate-500 mb-3">Zakres Cenowy (zł)</h4>
      <div className="flex gap-2 items-center">
        <input aria-label="Cena minimalna" type="number" placeholder="Od" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-3 text-xs font-bold text-slate-800 outline-none focus:border-red-600" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
        <span className="text-slate-500 font-black">-</span>
        <input aria-label="Cena maksymalna" type="number" placeholder="Do" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-3 text-xs font-bold text-slate-800 outline-none focus:border-red-600" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
      </div>
      <button aria-label="Zastosuj filtr cenowy" onClick={applyPriceFilter} className="w-full mt-3 bg-slate-100 text-slate-800 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors min-h-[44px]">Zastosuj cenę</button>
    </div>
    <div className="space-y-8">
      {techFilterKeys.map((filterKey: string) => renderFilterBlock(filterKey))}
    </div>
    <div className="mt-8 bg-slate-900 p-5 rounded-2xl relative overflow-hidden">
       <div className="absolute -right-4 -bottom-4 text-6xl opacity-10">📞</div>
       <h4 className="text-white font-black uppercase text-sm mb-2 relative z-10">Nie możesz znaleźć części?</h4>
       <p className="text-slate-400 text-xs mb-4 relative z-10 leading-relaxed">Nasz doradca techniczny dobierze dla Ciebie zamiennik w 3 minuty. Zadzwoń do nas podając objawy lub numer OEM.</p>
       <a href="tel:+48123456789" aria-label="Zadzwoń do doradcy" className="block w-full bg-red-600 hover:bg-red-500 text-white text-center py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-colors shadow-md relative z-10 min-h-[48px]">
         📞 Zadzwoń teraz
       </a>
    </div>
  </div>
);

export default function CategoryClient({ initialData, initialFilters, fullPath }: { initialData: any, initialFilters: any, fullPath: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { items, setIsOpen: setCartOpen } = useCart() as any;
  const cartTotalItems = items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
  
  const [categoryData, setCategoryData] = useState<any>(initialData?.category || null);
  const [products, setProducts] = useState<any[]>(initialData?.products || []);
  const [globalFilters, setGlobalFilters] = useState<Record<string, Record<string, number>>>(initialFilters || {});
  const [breadcrumbs, setBreadcrumbs] = useState<any[]>(initialData?.breadcrumbs || []);
  const [subcategories, setSubcategories] = useState<string[]>(initialData?.subcategories || []);
  const [depth, setDepth] = useState<number>(initialData?.depth || 1);
  const [totalCount, setTotalCount] = useState(initialData?.totalCount || 0);

  const [loading, setLoading] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(24);
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [searchQ, setSearchQ] = useState(searchParams.get('q') || '');
  const [filterSearchQuery, setFilterSearchQuery] = useState<Record<string, string>>({});

  const [expandedFilters, setExpandedFilters] = useState<Record<string, boolean>>({});
  const [savedGarage, setSavedGarage] = useState<{ make: string; model: string } | null>(null);
  const [isListView, setIsListView] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [showAllSubcats, setShowAllSubcats] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null); 

  const isFirstRender = useRef(true);

  // === DYNAMICZNY TEKST SEO W LOCIE ===
  const brandLabel = searchParams.get('Pasuje do marki');
  const modelLabel = searchParams.get('Pasuje do modelu');
  
  let displayH1 = categoryData?.h1_dynamic;
  if (!displayH1 && breadcrumbs.length > 0) displayH1 = breadcrumbs[breadcrumbs.length - 1].name;
  if (!displayH1) displayH1 = "Kategoria";
  
  let displayTopSeo = categoryData?.top_seo_text || "";

  if (brandLabel) {
    if (!displayH1.toLowerCase().includes(brandLabel.toLowerCase())) {
      displayH1 += ` DO ${brandLabel.toUpperCase()}`;
      if (modelLabel) displayH1 += ` ${modelLabel.toUpperCase()}`;
    }
    // Dynamiczne wstrzyknięcie unikalnego zdania SEO do Top Textu
    if (displayTopSeo && !displayTopSeo.toLowerCase().includes(brandLabel.toLowerCase())) {
        displayTopSeo = `${displayTopSeo} Zobacz wyselekcjonowane, w pełni kompatybilne zamienniki i oryginały pasujące bezpośrednio do maszyn ${brandLabel} ${modelLabel || ''}.`;
    }
  }

  useEffect(() => {
    if (isMobileFiltersOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileFiltersOpen]);

  useEffect(() => {
    const garage = localStorage.getItem('centrum_rolnictwa_garage');
    if (garage) {
      const parsed = JSON.parse(garage);
      setSavedGarage(parsed);
      if (!searchParams.get('Pasuje do marki') && !searchParams.get('Pasuje do modelu')) {
        const currentParams = new URLSearchParams(searchParams.toString());
        currentParams.set('Pasuje do marki', parsed.make);
        currentParams.set('Pasuje do modelu', parsed.model);
        router.push(`/kategoria/${fullPath}?${currentParams.toString()}`, { scroll: false });
      }
    }
  }, [fullPath]);

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }

    async function fetchAllData() {
      setLoading(true);
      try {
        const queryStr = new URLSearchParams(searchParams.toString());
        queryStr.set('fullPath', fullPath);
        queryStr.set('limit', displayLimit.toString());

        const res = await fetch(`/api/search?${queryStr.toString()}`);
        const json = await res.json();

        setCategoryData(json.category || null);
        setProducts(json.products || []);
        setGlobalFilters(json.filters || {});
        setBreadcrumbs(json.breadcrumbs || []);
        setSubcategories(json.subcategories || []);
        setTotalCount(json.totalCount || 0);
        setDepth(json.depth || 1);
      } catch (error) { console.error("Błąd pobierania:", error); } finally { setLoading(false); }
    }
    fetchAllData();
  }, [fullPath, searchParams, displayLimit]);

  const clearGarage = () => {
    localStorage.removeItem('centrum_rolnictwa_garage');
    setSavedGarage(null);
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.delete('Pasuje do marki');
    currentParams.delete('Pasuje do modelu');
    router.push(`/kategoria/${fullPath}?${currentParams.toString()}`, { scroll: false });
  };

  const updateUrlParams = (key: string, value: string | null) => {
    const currentParams = new URLSearchParams(searchParams.toString());
    if (value === null || value === '') currentParams.delete(key);
    else currentParams.set(key, value);
    router.push(`/kategoria/${fullPath}?${currentParams.toString()}`, { scroll: false });
  };

  const applyPriceFilter = () => {
    const currentParams = new URLSearchParams(searchParams.toString());
    if (minPrice) currentParams.set('minPrice', minPrice); else currentParams.delete('minPrice');
    if (maxPrice) currentParams.set('maxPrice', maxPrice); else currentParams.delete('maxPrice');
    router.push(`/kategoria/${fullPath}?${currentParams.toString()}`, { scroll: false });
    setIsMobileFiltersOpen(false);
  };

  const garageMake = globalFilters['Pasuje do marki'] || globalFilters['Marka maszyny'] || globalFilters['marka maszyny'] || {};
  const garageModel = globalFilters['Pasuje do modelu'] || {};

  let techFilters = { ...globalFilters };
  const excludeKeys = ['kategoria', 'category', 'id', 'sku', 'title', 'slug', 'image', 'oem', 'numer katalogowy / oem', 'waga', 'grupa produktowa', 'marka maszyny', 'marka', 'pasuje do marki', 'pasuje do modelu'];

  Object.keys(techFilters).forEach(key => {
    if (excludeKeys.includes(key.toLowerCase()) || Object.keys(techFilters[key]).length < 2) {
       delete techFilters[key];
    }
  });

  const filterCoverage = Object.keys(techFilters).map(key => {
    const count = Object.values(techFilters[key]).reduce((sum, c) => sum + c, 0);
    return { key, count };
  }).sort((a, b) => b.count - a.count);

  let techFilterKeys: string[] = [];
  const hasTypProduktu = filterCoverage.find(f => f.key.toLowerCase() === 'typ produktu' || f.key.toLowerCase() === 'typ');
  if (hasTypProduktu) techFilterKeys.push(hasTypProduktu.key);

  const limit = depth === 1 ? 5 : (depth === 2 ? 6 : 8);

  for (const f of filterCoverage) {
     if (techFilterKeys.length >= (hasTypProduktu ? limit + 1 : limit)) break;
     if (!techFilterKeys.includes(f.key)) techFilterKeys.push(f.key);
  }

  let activeFiltersCount = 0;
  searchParams.forEach((val, key) => { if (!['limit', 'sort', 'Pasuje do marki', 'Pasuje do modelu'].includes(key)) activeFiltersCount++; });

  const renderFilterBlock = (filterKey: string) => {
    const filterValues = techFilters[filterKey];
    if (!filterValues) return null;
    const searchQuery = filterSearchQuery[filterKey]?.toLowerCase() || '';
    
    const sortedEntries = Object.entries(filterValues).sort((a, b) => b[1] - a[1]);
    const matchedEntries = sortedEntries.filter(([val]) => val.toLowerCase().includes(searchQuery));
    
    const isLongList = sortedEntries.length > 5;
    const isExpanded = expandedFilters[filterKey] || searchQuery.length > 0;
    const displayEntries = isExpanded ? matchedEntries : matchedEntries.slice(0, 5);
    const hasActiveFilter = !!searchParams.get(filterKey);

    return (
      <div key={filterKey} className="space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="font-black text-[11px] uppercase tracking-wider text-slate-900">{filterKey}</h4>
          {hasActiveFilter && (
            <button aria-label={`Wyczyść filtr ${filterKey}`} onClick={() => updateUrlParams(filterKey, null)} className="text-[10px] text-red-600 font-black uppercase hover:underline bg-red-50 px-3 py-1.5 rounded-md min-w-[44px]">Wyczyść ✕</button>
          )}
        </div>
        
        {isLongList && (
          <div className="relative mb-3">
            <input aria-label={`Szukaj w filtrze ${filterKey}`} type="text" placeholder={`Szukaj w ${filterKey.toLowerCase()}...`} className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2.5 text-[10px] font-bold text-slate-700 outline-none focus:border-red-600 transition-colors" value={filterSearchQuery[filterKey] || ''} onChange={(e) => setFilterSearchQuery(prev => ({ ...prev, [filterKey]: e.target.value }))} />
            <span className="absolute right-3 top-2.5 text-slate-400 text-xs">🔍</span>
          </div>
        )}
        
        <div className={`space-y-2 ${isExpanded ? 'max-h-[300px] overflow-y-auto pr-2 custom-scrollbar' : ''}`}>
          {displayEntries.length === 0 ? (
            <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest py-2">Brak wyników</div>
          ) : (
            displayEntries.map(([val, count]) => {
              const isChecked = searchParams.get(filterKey) === val;
              return (
                <label key={val} className="flex items-center justify-between cursor-pointer group py-1" onClick={() => {const currentVal = searchParams.get(filterKey); updateUrlParams(filterKey, currentVal === val ? null : val);}}>
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 border-2 rounded-md flex items-center justify-center transition-all flex-shrink-0 ${isChecked ? 'border-red-600 bg-red-50' : 'border-slate-200 bg-slate-50 group-hover:border-red-400'}`}>
                      {isChecked && <div className="w-2.5 h-2.5 bg-red-600 rounded-[2px]"></div>}
                    </div>
                    <span className={`text-sm transition-colors line-clamp-1 ${isChecked ? 'text-red-600 font-black' : 'text-slate-600 font-medium group-hover:text-slate-900'}`}>{val}</span>
                  </div>
                  <span className="text-[9px] font-black text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full flex-shrink-0">{count}</span>
                </label>
              );
            })
          )}
        </div>

        {isLongList && !isExpanded && (<button aria-label="Pokaż więcej opcji filtru" onClick={() => setExpandedFilters(prev => ({ ...prev, [filterKey]: true }))} className="text-[10px] p-2 font-black uppercase tracking-widest text-slate-500 hover:text-red-600 mt-2 flex items-center gap-1 w-full pt-2 border-t border-slate-50">+ Pokaż więcej ({sortedEntries.length - 5})</button>)}
        {isLongList && isExpanded && (<button aria-label="Zwiń opcje filtru" onClick={() => { setExpandedFilters(prev => ({ ...prev, [filterKey]: false })); setFilterSearchQuery(prev => ({ ...prev, [filterKey]: '' })); }} className="text-[10px] p-2 font-black uppercase tracking-widest text-slate-500 hover:text-red-600 mt-2 flex items-center gap-1 w-full pt-2 border-t border-slate-50">- Zwiń listę</button>)}
      </div>
    );
  };

  const sharedFilterProps = { searchQ, setSearchQ, updateUrlParams, loading, garageMake, garageModel, searchParams, minPrice, setMinPrice, maxPrice, setMaxPrice, applyPriceFilter, activeFiltersCount, techFilterKeys, renderFilterBlock, router, fullPath };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-[99999] w-full h-[100dvh] bg-white flex flex-col m-0 p-0 overflow-hidden animate-in fade-in duration-200">
           <div className="flex-none bg-slate-900 text-white p-4 flex justify-between items-center shadow-md">
              <span className="font-black uppercase tracking-widest text-sm">Szukaj i Filtruj</span>
              <button aria-label="Zamknij filtry" onClick={() => setIsMobileFiltersOpen(false)} className="bg-slate-800 hover:bg-red-600 px-4 py-2.5 rounded-lg text-xs font-black uppercase transition-colors min-w-[44px]">✕ Zamknij</button>
           </div>
           
           <div className="flex-1 overflow-y-auto p-5 pb-24 custom-scrollbar bg-white">
              <FilterMenuContent {...sharedFilterProps} />
           </div>
           
           <div className="flex-none bg-white p-4 border-t shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
               <button aria-label="Zastosuj i pokaż wyniki" onClick={() => setIsMobileFiltersOpen(false)} className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest active:scale-95 transition-transform min-h-[48px]">Pokaż {products.length} wyników ➔</button>
           </div>
        </div>
      )}

      <header className="border-b py-4 px-6 bg-white sticky top-0 z-[60] shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center w-full">
          <Link href="/" aria-label="Strona główna CentrumRolnictwa.pl" className="font-black text-xl tracking-tighter hover:text-red-600 transition-colors">
            CentrumRolnictwa<span className="text-slate-500">.pl</span>
          </Link>
          <button aria-label="Otwórz koszyk" onClick={() => setCartOpen(true)} className="p-3 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors relative shadow-inner border border-slate-100">
             <span className="text-xl">🛒</span>
             {cartTotalItems > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-md shadow-red-600/30">{cartTotalItems}</span>}
          </button>
        </div>
      </header>

      <div className="bg-white border-b pt-8 pb-6 px-6 relative z-20">
        <div className="max-w-7xl mx-auto">
          {breadcrumbs.length > 0 && (
            <nav className="flex text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 gap-2 items-center flex-wrap" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-red-600 transition-colors p-1">Start</Link>
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  <span className="text-slate-300">/</span>
                  <Link href={`/kategoria/${crumb.path}`} className="hover:text-red-600 transition-colors p-1">{crumb.name}</Link>
                </React.Fragment>
              ))}
            </nav>
          )}

          {savedGarage && (
            <div className="mb-4 bg-slate-900 text-white w-fit px-4 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-slate-800 shadow-md">
              <span className="text-emerald-500 animate-pulse">●</span> Filtry aktywne dla: {savedGarage.make} {savedGarage.model}
              <button aria-label="Wyczyść garaż" onClick={clearGarage} className="text-red-500 hover:text-red-400 font-bold ml-2 p-1 min-w-[30px]">✕</button>
            </div>
          )}
          
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black uppercase italic text-slate-900 mb-2 max-w-4xl leading-tight">{displayH1}</h1>
          
          {displayTopSeo && (
            <p className="text-sm text-slate-600 max-w-3xl mb-6 leading-relaxed font-medium">
              {displayTopSeo}
            </p>
          )}

          {subcategories.length > 0 && (
            <div className="mb-4 border-t border-slate-100 pt-5">
              <div className="flex justify-between items-end mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Wybierz podkategorię:</span>
              </div>
              <div className="flex flex-wrap gap-2 lg:gap-3">
                {(showAllSubcats ? subcategories : subcategories.slice(0, 7)).map(sub => (
                    <Link aria-label={`Przejdź do podkategorii ${sub}`} key={sub} href={`/kategoria/${fullPath}/${generateSlug(sub)}`} className="px-4 py-3 lg:px-5 lg:py-2.5 bg-white border border-slate-200 hover:border-slate-900 hover:bg-slate-900 hover:text-white rounded-xl text-[10px] lg:text-[11px] font-black uppercase tracking-widest transition-all shadow-sm">
                      {sub}
                    </Link>
                ))}
                {subcategories.length > 7 && (
                  <button aria-label="Pokaż wszystkie podkategorie" onClick={() => setShowAllSubcats(!showAllSubcats)} className="px-4 py-3 lg:px-5 lg:py-2.5 bg-slate-50 border-2 border-slate-200 text-slate-700 hover:border-red-600 hover:text-red-600 rounded-xl text-[10px] lg:text-[11px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-1.5 min-h-[44px]">
                    {showAllSubcats ? <><span>↑</span> Zwiń listę</> : <><span>+ {subcategories.length - 7}</span> więcej ▾</>}
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-slate-100 mt-2 relative z-10 hidden lg:flex">
            <div className="flex items-center gap-4">
              <div className="h-1 w-12 bg-red-600"></div>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Katalog: {totalCount} części</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200 shadow-inner">
                <button aria-label="Widok siatki" onClick={() => setIsListView(false)} className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all min-w-[44px] ${!isListView ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Siatka 🔳</button>
                <button aria-label="Widok listy" onClick={() => setIsListView(true)} className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all min-w-[44px] ${isListView ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Lista ☰</button>
              </div>
              <select aria-label="Sortuj produkty" className="bg-slate-50 border border-slate-200 text-slate-800 text-[11px] font-black uppercase tracking-widest rounded-xl px-4 py-3 outline-none focus:border-red-600 cursor-pointer shadow-sm min-h-[44px]" value={searchParams.get('sort') || ''} onChange={(e) => updateUrlParams('sort', e.target.value)}>
                <option value="">Sortowanie Domyślne</option>
                <option value="price_asc">Cena: rosnąco</option>
                <option value="price_desc">Cena: malejąco</option>
                <option value="name_asc">Nazwa: A-Z</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6 lg:py-12 flex flex-col lg:flex-row gap-8 lg:gap-12 relative z-10">
        
        <aside className="hidden lg:block w-full lg:w-80 flex-shrink-0">
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6">
            <FilterMenuContent {...sharedFilterProps} />
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-h-[500px]">
          <div className="relative flex-1">
            {loading ? (
              <div className={isListView ? "space-y-4" : "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8"}>
                {Array.from({ length: 6 }).map((_, idx) => <ProductSkeleton key={idx} isListView={isListView} />)}
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-[40px] p-16 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center">
                <span className="text-6xl mb-6 block">🚜</span>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest mb-3">Brak wyników</h2>
                <p className="text-slate-600 font-medium text-sm max-w-md mx-auto mb-8">Prawdopodobnie przefiltrowałeś zbyt wąsko lub asortyment przeniósł się do podkategorii.</p>
                <div className="flex gap-4">
                  <button aria-label="Wyczyść wszystkie filtry" onClick={() => router.push(`/kategoria/${fullPath}`)} className="bg-slate-100 text-slate-800 px-6 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors min-h-[48px]">Wyczyść filtry</button>
                </div>
              </div>
            ) : (
              <div className={isListView ? "space-y-4 w-full" : "grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6"}>
                {products.map((product: any, idx: number) => (
                  <ProductCard key={`${product.id || product.sku}-${idx}`} product={product} isListView={isListView} idx={idx} />
                ))}
              </div>
            )}
          </div>

          {totalCount > 0 && !loading && (
            <div className="mt-12 flex flex-col items-center gap-4 border-t border-slate-100 pt-8">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Wyświetlono {products.length} z {totalCount} części</p>
              <div className="w-64 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-red-600 transition-all duration-500 rounded-full" style={{ width: `${Math.min(100, (products.length / totalCount) * 100)}%` }} />
              </div>
              {products.length < totalCount && (
                <button aria-label="Załaduj więcej produktów" onClick={() => setDisplayLimit(prev => prev + 24)} className="mt-2 bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-red-600 transition-all transform hover:scale-[1.02] shadow-md min-h-[48px]">Załaduj kolejne produkty ➔</button>
              )}
            </div>
          )}

          <div className="lg:hidden mt-8 flex justify-center sticky bottom-6 z-[45]">
             <button aria-label="Otwórz opcje filtrowania" onClick={() => setIsMobileFiltersOpen(true)} className="bg-slate-900 text-white px-8 py-4 rounded-full font-black text-[11px] uppercase tracking-widest shadow-[0_10px_40px_rgba(0,0,0,0.3)] flex items-center justify-center gap-3 w-full max-w-[90%] border border-slate-700 transition-transform active:scale-95 min-h-[48px]">
               FILTRUJ I ZNAJDŹ {activeFiltersCount > 0 && <span className="bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] ml-1">{activeFiltersCount}</span>}
             </button>
          </div>

          {categoryData?.bottom_seo_text && (
            <div className="mt-24 pt-12 border-t border-slate-200">
              <div 
                className="prose prose-slate max-w-none text-sm lg:text-base text-slate-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: parseMarkdown(categoryData.bottom_seo_text) }}
              />
            </div>
          )}

          {categoryData?.faqs && categoryData.faqs.length > 0 && (
            <div className="mt-12 mb-12">
              <h2 className="text-2xl font-black text-slate-900 mb-6">Najczęściej zadawane pytania (FAQ)</h2>
              <div className="space-y-4">
                {categoryData.faqs.map((faq: any, idx: number) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all shadow-sm hover:shadow-md">
                    <button 
                      aria-label={activeFaq === idx ? "Zwiń odpowiedź" : "Rozwiń odpowiedź"}
                      aria-expanded={activeFaq === idx}
                      onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                      className="w-full px-6 py-5 flex justify-between items-center text-left focus:outline-none min-h-[48px]"
                    >
                      <span className="font-bold text-slate-900 pr-4">{faq.question}</span>
                      <span className={`text-red-600 font-black text-xl transition-transform ${activeFaq === idx ? 'rotate-45' : ''}`}>+</span>
                    </button>
                    {activeFaq === idx && (
                      <div className="px-6 pb-5 pt-0 text-slate-700 text-sm leading-relaxed border-t border-slate-50 mt-2 pt-4">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}