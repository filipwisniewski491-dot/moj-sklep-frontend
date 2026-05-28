'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/store/useCart'; 
import SearchBar from '@/components/SearchBar';

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

const capitalizeWords = (str: string) => {
  if (!str) return '';
  return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

// GLOBALNE MEGA MENU
const MEGA_MENU_DATA = [
  { 
    name: "Części do ciągników", slug: "czesci-do-ciagnikow", icon: "🚜",
    columns: [
      { title: "Silnik i osprzęt", slug: "silnik-i-osprzet", links: ["Węże", "Prowadnice", "Uszczelki", "Śruby i mocowania", "Zawory", "Tłoki"] },
      { title: "Układ napędowy", slug: "uklad-napedowy-i-sprzegla", links: ["Kołki", "Kosze", "Krzyżaki", "Mechanizmy różnicowe", "Tarcze sprzęgła"] },
      { title: "Układ paliwowy", slug: "uklad-paliwowy-i-wydechowy", links: ["Pompy wtryskowe", "Wtryskiwacze", "Tłumiki", "Filtry paliwa"] },
      { title: "Kabina i elektryka", slug: "kabina-i-oblachowanie", links: ["Lusterka", "Szyby", "Fotele", "Oświetlenie", "Rozruszniki"] }
    ]
  },
  { 
    name: "Części do maszyn", slug: "czesci-do-maszyn", icon: "⚙️",
    columns: [
      { title: "Uprawa ziemi", slug: "uprawa-ziemi", links: ["Lemiesze", "Dłuta", "Odkładnice", "Piętki"] },
      { title: "Zbiór i żniwa", slug: "zbior-i-zniwa", links: ["Bagnety", "Nożyki", "Paski klinowe", "Palce podbieracza"] }
    ]
  },
  { 
    name: "Hydraulika siłowa", slug: "hydraulika-silowa", icon: "🗜️",
    columns: [
      { title: "Elementy układu", slug: "elementy-ukladu", links: ["Pompy hydrauliczne", "Rozdzielacze", "Siłowniki", "Szybkozłącza"] }
    ]
  }, 
  { 
    name: "Warsztat i uniwersalne", slug: "warsztat-i-uniwersalne", icon: "🔧",
    columns: [
       { title: "Materiały i narzędzia", slug: "wyposazenie-warsztatu", links: ["Narzędzia ręczne", "Elektronarzędzia", "Odzież BHP"] },
       { title: "Chemia i smary", slug: "chemia-i-smary", links: ["Oleje silnikowe", "Smary", "Zmywacze", "Płyny chłodnicze"] }
    ]
  },
  { name: "Elektronika i precyzja", slug: "elektronika-i-precyzja", icon: "📡" },
  { name: "Hodowla i zootechnika", slug: "hodowla-i-zootechnika", icon: "🐄" }
];

const ProductCard = ({ product, isListView, idx }: { product: any, isListView: boolean, idx: number }) => {
  const { addItem, setIsOpen } = useCart() as any;
  const [qty, setQty] = useState(1);

  const imageUrl = product.external_images?.[0] || product.images?.[0]?.url_standard || product.images?.[0]?.url || product.images?.[0]?.src || null;
  const price = typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0;
  const netPrice = price / 1.23; 
  const sku = product.sku || "BRAK SKU";
  
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  const cutoffHour = 15; 
  const isShippingToday = currentHour < cutoffHour;
  const hoursLeft = cutoffHour - 1 - currentHour;
  const minutesLeft = 60 - currentMinutes;

  const pseudoRandom = (str: string) => Array.from(str).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hash = pseudoRandom(sku);
  const rating = (4.5 + (hash % 6) / 10).toFixed(1); 
  const reviewsCount = 3 + (hash % 45); 
  const isLowStock = (hash % 5) === 0; 

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    addItem({ id: product.id || sku, name: product.name, price: price, image: imageUrl || '', quantity: qty, crossSell: [], category: '' });
    setIsOpen(true);
  };

  return (
    <div className={`group bg-white border border-slate-100 rounded-[32px] lg:rounded-[40px] p-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] transition-all duration-300 flex relative ${isListView ? 'flex-row gap-4 lg:gap-6 items-center w-full' : 'flex-col h-full'}`}>
      <Link href={`/produkt/${product.slug || sku}`} aria-label={`Przejdź do ${product.name}`} className="absolute inset-0 z-0"></Link>

      <div className={`absolute top-3 right-3 lg:top-4 lg:right-4 z-10 flex flex-col gap-1 items-end`}>
        {isShippingToday ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[8px] lg:text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
              Wyślemy za {hoursLeft}h {minutesLeft}m
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-orange-50 text-orange-700 border border-orange-100 shadow-sm">
            <span className="text-[8px] lg:text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Wysyłka rano</span>
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
        <div className="absolute bottom-2 left-2 lg:bottom-3 lg:left-3 bg-white/95 backdrop-blur-md px-2 py-1 rounded-full text-[7px] lg:text-[8px] font-black uppercase tracking-widest border border-slate-200 text-slate-500 max-w-[85%] truncate shadow-sm">
          SKU: {sku}
        </div>
      </div>
      
      <div className={`flex flex-col pt-1 w-full pointer-events-none ${isListView ? 'justify-center pr-3 lg:pr-4' : 'px-3 pb-4 lg:px-6 lg:pb-5 flex-1'}`}>
        
        <div className="flex justify-between items-center mb-1.5">
          <div className="flex items-center gap-1 text-[10px] lg:text-[11px] text-amber-400 font-black">
            ★ {rating} <span className="text-slate-400 font-medium text-[9px] lg:text-[10px]">({reviewsCount})</span>
          </div>
          {isLowStock && <span className="text-[9px] lg:text-[10px] font-black text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-md shadow-sm">Zostały {1 + (hash % 3)} szt.</span>}
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
  
  const cartValue = items?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || 0;
  const freeShippingThreshold = 500;
  const progressPercent = Math.min((cartValue / freeShippingThreshold) * 100, 100);

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
  
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isMounted, setIsMounted] = useState(false);

  const rawBrandLabel = searchParams.get('Pasuje do marki');
  const rawModelLabel = searchParams.get('Pasuje do modelu');
  
  const brandLabel = rawBrandLabel ? capitalizeWords(rawBrandLabel) : null;
  const modelLabel = rawModelLabel ? capitalizeWords(rawModelLabel) : null;
  
  let displayH1 = categoryData?.h1_dynamic;
  if (!displayH1 && breadcrumbs.length > 0) displayH1 = breadcrumbs[breadcrumbs.length - 1].name;
  if (!displayH1) displayH1 = "Kategoria";
  
  let displayTopSeo = categoryData?.top_seo_text || "";

  if (brandLabel) {
    if (!displayH1.toLowerCase().includes(brandLabel.toLowerCase())) {
      displayH1 += ` DO ${brandLabel.toUpperCase()}`;
      if (modelLabel) displayH1 += ` ${modelLabel.toUpperCase()}`;
    }
    if (displayTopSeo && !displayTopSeo.toLowerCase().includes(brandLabel.toLowerCase())) {
        displayTopSeo = `${displayTopSeo} Zobacz wyselekcjonowane, w pełni kompatybilne zamienniki i oryginały pasujące bezpośrednio do maszyn ${brandLabel} ${modelLabel || ''}.`;
    } else if (!displayTopSeo) {
        displayTopSeo = `Zobacz wyselekcjonowane, w pełni kompatybilne zamienniki i oryginały pasujące bezpośrednio do maszyn ${brandLabel} ${modelLabel || ''}.`;
    }
  }

  useEffect(() => {
    setIsMounted(true);
    const calculateTimeLeft = () => {
      const now = new Date();
      const cutoff = new Date();
      cutoff.setHours(15, 0, 0, 0); 
      if (now > cutoff) cutoff.setDate(cutoff.getDate() + 1);
      const difference = cutoff.getTime() - now.getTime();
      setTimeLeft({
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    };
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, []);

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
  const excludeKeys = ['kategoria', 'category', 'id', 'sku', 'title', 'slug', 'image', 'oem', 'numer katalogowy / oem', 'grupa produktowa', 'marka maszyny', 'marka', 'pasuje do marki', 'pasuje do modelu'];

  Object.keys(techFilters).forEach(key => {
    const lowerKey = key.toLowerCase();
    if (excludeKeys.includes(lowerKey) || lowerKey.includes('waga') || Object.keys(techFilters[key]).length < 2) {
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
    
    return (
      <div key={filterKey} className="space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="font-black text-[11px] uppercase tracking-wider text-slate-900">{filterKey}</h4>
        </div>
        
        {isLongList && (
          <div className="relative mb-3">
            <input aria-label={`Szukaj w filtrze ${filterKey}`} type="text" placeholder={`Szukaj w ${filterKey.toLowerCase()}...`} className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2.5 text-[10px] font-bold text-slate-700 outline-none focus:border-red-600 transition-colors" value={filterSearchQuery[filterKey] || ''} onChange={(e) => setFilterSearchQuery(prev => ({ ...prev, [filterKey]: e.target.value }))} />
            <span className="absolute right-3 top-2.5 text-slate-400 text-xs">🔍</span>
          </div>
        )}
        
        <div className={`space-y-2 ${isExpanded ? 'max-h-[300px] overflow-y-auto pr-2 custom-scrollbar' : ''}`}>
          {matchedEntries.length === 0 ? (
            <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest py-2">Brak wyników</div>
          ) : (
            (isExpanded ? matchedEntries : matchedEntries.slice(0, 5)).map(([val, count]) => {
              const isChecked = searchParams.get(filterKey) === val;
              return (
                <label key={val} className={`flex items-center justify-between cursor-pointer group py-1.5 px-2 rounded-lg transition-colors ${isChecked ? 'bg-red-50/60' : 'hover:bg-slate-50'}`} onClick={(e) => { e.preventDefault(); const currentVal = searchParams.get(filterKey); updateUrlParams(filterKey, currentVal === val ? null : val); }}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-5 h-5 border-2 rounded-md flex items-center justify-center transition-all flex-shrink-0 ${isChecked ? 'border-red-600 bg-red-50' : 'border-slate-200 bg-white group-hover:border-red-400'}`}>
                      {isChecked && <div className="w-2.5 h-2.5 bg-red-600 rounded-[2px]"></div>}
                    </div>
                    <span className={`text-sm transition-colors truncate ${isChecked ? 'text-red-700 font-black' : 'text-slate-600 font-medium group-hover:text-slate-900'}`}>{val}</span>
                  </div>
                  <div className="flex items-center gap-2 pl-2 flex-shrink-0">
                    {isChecked ? (
                      <span className="text-[9px] font-black text-red-600 uppercase tracking-wider flex items-center gap-1 bg-red-100/50 px-2 py-1 rounded-md hover:bg-red-200 transition-colors">
                        ✕ Usuń
                      </span>
                    ) : (
                      <span className="text-[9px] font-black text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">{count}</span>
                    )}
                  </div>
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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 md:pb-0">
      
      {/* --- POWIADOMIENIE BŁĘDU (Szuflada Mobile) --- */}
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
               <button aria-label="Zastosuj i pokaż wyniki" onClick={() => setIsMobileFiltersOpen(false)} className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest active:scale-95 transition-transform min-h-[48px]">Pokaż {totalCount} wyników ➔</button>
           </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🚀 JASNY, PROFESJONALNY GLOBALNY HEADER (Zoptymalizowany pod Mobile) */}
      {/* ========================================================================= */}
      
      {/* --- 1. TOP BAR INFO (Ukryty na telefonach, widoczny od tabletów w górę) --- */}
      <div className="hidden sm:block bg-slate-50 text-slate-600 py-2 px-4 font-bold relative z-[60] border-b border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-row justify-between items-center text-center gap-3">
          <div className="flex items-center space-x-6 text-xs uppercase tracking-[0.2em]">
            <a href="tel:+48257888900" className="flex items-center gap-2 hover:text-red-600 transition-colors group text-slate-800">
              <span className="text-red-600 text-sm group-hover:animate-bounce">📞</span> <span className="tabular-nums tracking-wider">25 788 89 00</span>
            </a>
            <span className="hidden md:flex items-center gap-2 text-slate-500">
              <span className="text-emerald-500">✓</span> Ekspercki Dobór Części
            </span>
          </div>
          
          <div className="flex items-center gap-2 bg-red-50 px-4 py-1 rounded-full border border-red-100 text-red-800">
            <span className="text-[10px] uppercase tracking-widest hidden md:inline">Wysyłamy dzisiaj. Zamów w:</span>
            <span suppressHydrationWarning className="text-red-600 font-black tabular-nums text-sm tracking-widest">
              ⏳ {isMounted ? `${String(timeLeft.hours).padStart(2, '0')}:${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')}` : '00:00:00'}
            </span>
          </div>
        </div>
      </div>

      {/* --- 2. GŁÓWNY HEADER Z WYSZUKIWARKĄ (Skompresowany na Mobile) --- */}
      <header className="bg-white relative z-50 shadow-sm border-b border-slate-100 py-3 md:py-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-row items-center justify-between gap-3 md:gap-8">
          
          {/* Mniejsze Logo na mobile dla oszczędności miejsca */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" aria-label="CentrumRolnictwa.pl - Strona Główna">
              <img 
                src="https://centrumrolnictwa-cdn.b-cdn.net/logo/logo-centrumrolnictwapl-2-1.jpeg" 
                alt="CentrumRolnictwa.pl" 
                className="h-10 sm:h-14 md:h-20 w-auto transition-transform hover:scale-105 duration-300" 
                fetchPriority="high" 
              />
            </Link>
          </div>

          {/* Wyszukiwarka - Zajmuje resztę szerokości od razu obok Logo na telefonie */}
          <div className="flex-1 w-full relative z-50">
             <SearchBar />
          </div>

          <nav className="hidden md:flex items-center space-x-6 text-slate-800">
            <div className="hidden xl:block text-right mr-4">
               <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">
                 Do darmowej: <span className="text-red-600 font-black">{(freeShippingThreshold - cartValue).toFixed(2)} zł</span>
               </p>
               <div className="w-40 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                 <div className="h-full bg-red-600 transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
               </div>
            </div>

            <Link href="/konto" aria-label="Twoje Konto" className="flex flex-col items-center cursor-pointer hover:text-red-600 transition-all group">
              <div className="p-3 bg-slate-50 rounded-full group-hover:bg-red-50 transition-colors border border-slate-200">
                 <svg className="w-5 h-5 group-hover:scale-110 transition-transform text-slate-600 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              </div>
              <span className="text-[9px] font-black mt-1.5 uppercase tracking-widest text-slate-500">Konto</span>
            </Link>
            
            <Link href="/koszyk" aria-label="Twój Koszyk" className="flex flex-col items-center cursor-pointer hover:text-red-600 transition-all relative group">
              <div className="p-3 bg-slate-50 rounded-full group-hover:bg-red-50 transition-colors relative border border-slate-200">
                 <div className="absolute -top-1.5 -right-2 bg-red-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md border-2 border-white group-hover:animate-bounce">2</div>
                 <svg className="w-5 h-5 group-hover:scale-110 transition-transform text-slate-600 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              </div>
              <span className="text-[10px] font-black mt-1.5 uppercase tracking-widest text-slate-800">
                {cartTotalItems > 0 ? `${cartValue.toFixed(2)} zł` : '0.00 zł'}
              </span>
            </Link>
          </nav>
        </div>
      </header>

      {/* --- 3. MEGA MENU DESKTOP (JASNE, CZYSTE, E-COMMERCE) --- */}
      <div className="hidden lg:block bg-white relative z-40 border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center">
          <Link href="/kategorie" className="flex items-center gap-2 py-4 px-6 font-black text-white bg-slate-900 uppercase text-[11px] tracking-widest hover:bg-red-600 transition-colors shrink-0 z-10 relative">
            <span>☰</span> Pełny Katalog 2026
          </Link>
          
          <ul className="flex flex-1 items-center justify-center gap-6 xl:gap-8 px-4">
            {MEGA_MENU_DATA.map((cat) => (
              <li key={cat.slug} className="group text-center py-5">
                <Link href={`/kategoria/${cat.slug}`} className="block font-black text-slate-800 hover:text-red-600 transition-all uppercase text-[11px] xl:text-[12px] tracking-[0.2em] whitespace-nowrap">
                  <span className="mr-2 text-xl align-middle grayscale group-hover:grayscale-0 transition-all">{cat.icon}</span> {cat.name}
                </Link>

                {cat.columns && cat.columns.length > 0 && (
                  <div className="absolute left-0 right-0 mx-auto w-full max-w-7xl mt-4 bg-white border border-slate-100 shadow-[0_30px_60px_rgba(0,0,0,0.12)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 rounded-2xl p-8 z-50 text-left text-slate-900">
                    <div className="grid grid-cols-4 gap-8">
                      {cat.columns.map(col => (
                        <div key={col.slug}>
                          <Link href={`/kategoria/${cat.slug}/${col.slug}`} className="text-red-600 font-black uppercase tracking-widest text-xs border-b-2 border-red-100 pb-2 mb-4 block hover:text-slate-900 transition-colors">
                            {col.title}
                          </Link>
                          <ul className="space-y-2.5">
                            {col.links.map(link => {
                              const linkSlug = generateSlug(link);
                              return (
                                <li key={linkSlug}>
                                  <Link href={`/kategoria/${cat.slug}/${col.slug}/${linkSlug}`} className="text-sm font-medium text-slate-600 hover:text-red-600 hover:translate-x-1 inline-block transition-all">
                                    {link}
                                  </Link>
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      ))}
                      <div className="col-span-4 lg:col-span-1 lg:col-start-4 bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col justify-between">
                         <div>
                            <span className="bg-red-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-md mb-4 inline-block shadow-sm">Polecane dla mechanika</span>
                            <h4 className="font-black uppercase text-lg text-slate-900 leading-tight mb-2">Chemia i Oleje</h4>
                            <p className="text-xs text-slate-500 font-medium">Zabezpiecz maszynę na sezon. Zamów komplet smarów i płynów z szybką wysyłką.</p>
                         </div>
                         <Link href={`/kategoria/${cat.slug}`} className="mt-4 text-[10px] font-black text-slate-900 uppercase tracking-widest hover:text-red-600 flex items-center gap-1 transition-colors">
                           Zobacz cały dział <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
                         </Link>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🚀 WIDOK GŁÓWNY KATEGORII */}
      {/* ========================================================================= */}

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
              <div className="bg-white rounded-[32px] lg:rounded-[40px] p-6 lg:p-12 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-600 to-orange-500"></div>
                
                <span className="text-5xl lg:text-6xl mb-6 block drop-shadow-sm">⚙️</span>
                
                <h2 className="text-2xl lg:text-3xl font-black text-slate-900 uppercase tracking-tight mb-3">
                  Pusty magazyn? To tylko pozory.
                </h2>
                
                <p className="text-slate-600 font-medium text-sm lg:text-base max-w-2xl mx-auto mb-8 leading-relaxed">
                  {searchQ 
                    ? <>Nie znaleźliśmy w tej kategorii nic pod frazą <strong className="text-slate-900">"{searchQ}"</strong>. Producenci często aktualizują numery OEM lub część występuje pod inną nazwą.</>
                    : <>Prawdopodobnie użyłeś zbyt wielu filtrów naraz. W rolnictwie detale mają znaczenie, ale czasem warto spojrzeć szerzej na całą kategorię.</>
                  }
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl mb-10">
                  <a href="tel:+48123456789" className="bg-red-600 text-white px-6 py-4 rounded-xl font-black text-[11px] lg:text-xs uppercase tracking-widest hover:bg-red-700 transition-colors flex items-center justify-center gap-2 shadow-md min-h-[48px]">
                    <span className="text-base">📞</span> Zadzwoń – dobierzemy część
                  </a>
                  <button onClick={() => { setSearchQ(''); setMinPrice(''); setMaxPrice(''); router.push(`/kategoria/${fullPath}`); }} className="bg-slate-100 text-slate-800 px-6 py-4 rounded-xl font-black text-[11px] lg:text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 min-h-[48px]">
                    <span className="text-base">🔄</span> Zresetuj wszystkie filtry
                  </button>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 lg:p-6 w-full max-w-xl text-left">
                  <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                    <span className="text-red-600">●</span> Szukaj ponownie w całym sklepie
                  </h3>
                  <div className="flex gap-2 mt-4">
                    <input type="text" placeholder="Wpisz numer OEM lub nazwę..." className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 outline-none focus:border-red-600 bg-white" value={searchQ} onChange={(e) => setSearchQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && updateUrlParams('q', searchQ)} />
                    <button onClick={() => updateUrlParams('q', searchQ)} className="bg-slate-900 text-white px-5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-colors">Szukaj</button>
                  </div>
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

          {/* ZMIANA: Pływający przycisk filtrów wyżej (bottom-20) aby nie wchodził na paski */}
          <div className="lg:hidden mt-8 flex justify-center sticky bottom-20 z-[45]">
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

      {/* --- MOBILE BOTTOM NAVIGATION --- */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 z-[70] flex justify-between items-center px-6 py-3 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] pb-safe" aria-label="Nawigacja mobilna">
        <a href="tel:+48257888900" className="flex flex-col items-center text-slate-400 hover:text-red-600 transition-colors">
          <span className="text-xl mb-1">📞</span>
          <span className="text-[9px] font-black uppercase tracking-widest">Zadzwoń</span>
        </a>
        <Link href="/kategorie" className="flex flex-col items-center text-red-600">
          <span className="text-xl mb-1">☰</span>
          <span className="text-[9px] font-black uppercase tracking-widest">Działy</span>
        </Link>
        <Link href="/konto" className="flex flex-col items-center text-slate-400 hover:text-slate-900 transition-colors">
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          <span className="text-[9px] font-black uppercase tracking-widest">Konto</span>
        </Link>
        <button onClick={() => setCartOpen(true)} className="flex flex-col items-center text-slate-400 hover:text-slate-900 transition-colors relative">
          {cartTotalItems > 0 && <div className="absolute -top-1 -right-2 bg-red-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white">{cartTotalItems}</div>}
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
          <span className="text-[9px] font-black uppercase tracking-widest">Koszyk</span>
        </button>
      </nav>

      {/* --- STOPKA --- */}
      <footer className="bg-slate-900 text-white py-16 border-t-4 border-red-600 pb-32 md:pb-16 mt-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12">
          <div>
            <img src="https://centrumrolnictwa-cdn.b-cdn.net/logo/logo-centrumrolnictwapl-2-1.jpeg" alt="CentrumRolnictwa Logo" className="h-10 w-auto mb-6 brightness-0 invert" loading="lazy" />
            <p className="text-[10px] font-bold text-slate-400 uppercase leading-loose tracking-widest">
              Niezawodny Sklep Rolniczy.<br/> Części, maszyny, doradztwo.
            </p>
          </div>
          <div>
             <h4 className="text-white font-black mb-6 uppercase text-[11px] tracking-widest">Sklep</h4>
             <ul className="space-y-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {QUICK_SILOS.slice(0, 4).map(cat => (
                  <li key={cat.slug}><Link href={`/kategoria/${cat.slug}`} className="hover:text-red-500 transition-colors">{cat.name}</Link></li>
                ))}
             </ul>
          </div>
          <div className="md:col-span-2 bg-slate-800/50 p-8 rounded-[32px] border border-slate-700 flex flex-col justify-center">
             <h4 className="text-slate-300 font-black mb-4 uppercase text-[10px] tracking-[0.2em]">Infolinia i Doradztwo Techniczne</h4>
             <a href="tel:+48257888900" className="font-black text-3xl md:text-4xl text-white tracking-tighter tabular-nums mb-3 hover:text-red-500 transition-colors w-fit">25 788 89 00</a>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Czynne Pn-Pt: 8:00 - 16:00
             </p>
          </div>
        </div>
      </footer>
    </div>
  );
}