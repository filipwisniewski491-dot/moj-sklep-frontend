'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
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

const ProductCard = ({ product, isListView, idx }: { product: any, isListView: boolean, idx: number }) => {
  const { addItem, setIsOpen } = useCart() as any;
  const [qty, setQty] = useState(1);

  const imageUrl = (() => {
    if (product.external_images && product.external_images !== "null") {
      try {
        const parsed = typeof product.external_images === 'string' ? JSON.parse(product.external_images) : product.external_images;
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
      } catch (e) {}
    }
    const bcImage = product.images?.[0];
    return bcImage?.url_standard || bcImage?.url || bcImage?.src || null;
  })();

  const price = typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0;
  const netPrice = price / 1.23; 
  const sku = product.sku || "BRAK SKU";
  
  const currentHour = new Date().getHours();
  const isShippingToday = currentHour < 12;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    addItem({ 
      id: product.id || sku, 
      name: product.name, 
      price: price, 
      image: imageUrl || '', 
      quantity: qty,
      crossSell: [], 
      category: '' 
    });
    setIsOpen(true);
  };

  return (
    <div className={`group bg-white border border-slate-100 rounded-[32px] lg:rounded-[40px] p-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] transition-all duration-300 flex relative ${isListView ? 'flex-row gap-4 lg:gap-6 items-center w-full' : 'flex-col h-full'}`}>
      <Link href={`/produkt/${product.slug || sku}`} className="absolute inset-0 z-0"></Link>

      <div className={`absolute top-4 right-4 z-10 flex items-center gap-1.5 px-2 py-1 lg:px-2.5 lg:py-1 rounded-lg border shadow-sm ${isShippingToday ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isShippingToday ? 'bg-emerald-500' : 'bg-orange-500'}`}></span>
        <span className="text-[7px] lg:text-[8px] font-black uppercase tracking-widest hidden sm:inline">
          {isShippingToday ? 'Wysyłka dziś' : 'Wysyłka jutro'}
        </span>
      </div>

      <div className={`bg-slate-50 rounded-[24px] lg:rounded-[32px] overflow-hidden relative flex items-center justify-center border border-slate-50 shadow-inner shrink-0 pointer-events-none ${isListView ? 'w-28 h-28 lg:w-36 lg:h-36 p-4' : 'aspect-square mb-3 lg:mb-4 p-4 lg:p-8 w-full'}`}>
        {imageUrl ? (
          <div className="relative w-full h-full">
            <Image loader={imageUrl.includes('b-cdn.net') ? bunnyLoader : undefined} src={imageUrl} alt={product.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" priority={idx < 4} className="object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center opacity-20 group-hover:opacity-40 transition-opacity">
            <svg className="w-8 h-8 lg:w-16 lg:h-16 mb-2" fill="currentColor" viewBox="0 0 24 24"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.73,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>
            <span className="text-[8px] lg:text-[10px] font-black uppercase tracking-widest text-center">Brak zdjęcia</span>
          </div>
        )}
        <div className="absolute top-2 left-2 lg:top-3 lg:left-3 bg-white/90 backdrop-blur-md px-1.5 py-0.5 lg:px-2 lg:py-0.5 rounded-full text-[6px] lg:text-[8px] font-black uppercase tracking-widest border border-slate-100 text-slate-500">SKU: {sku}</div>
      </div>
      
      <div className={`flex flex-col pt-1 w-full pointer-events-none ${isListView ? 'justify-center pr-3 lg:pr-4' : 'px-3 pb-4 lg:px-6 lg:pb-5 flex-1'}`}>
        <h2 className="font-black text-slate-800 leading-snug mb-2 group-hover:text-red-600 transition-colors line-clamp-2 text-xs lg:text-sm tracking-normal">{product.name}</h2>
        
        <div className={`flex ${isListView ? 'flex-row items-center justify-between gap-6' : 'flex-col gap-3'} pt-3 lg:pt-4 border-t border-slate-50 w-full pointer-events-auto z-10 ${isListView ? 'mt-0' : 'mt-auto'}`}>
          <div className="flex flex-col">
            <span className="text-[8px] lg:text-[9px] font-black text-slate-400 mb-0.5 tracking-tight whitespace-nowrap">
              {new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(netPrice)} zł netto
            </span>
            <span className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight whitespace-nowrap">
              {new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price)} <span className="text-[9px] lg:text-xs font-bold text-slate-400">zł</span>
            </span>
          </div>
          
          <div className={`flex items-center gap-1.5 ${isListView ? 'w-[200px]' : 'w-full'}`}>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl h-10 lg:h-11 px-1 flex-1">
              <button onClick={(e) => { e.preventDefault(); setQty(Math.max(1, qty - 1)); }} className="w-1/3 h-full font-black text-slate-400 hover:text-red-600 flex items-center justify-center">-</button>
              <input type="number" value={qty} onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))} className="w-1/3 text-center bg-transparent text-[10px] lg:text-xs font-black text-slate-900 outline-none appearance-none p-0 m-0" />
              <button onClick={(e) => { e.preventDefault(); setQty(qty + 1); }} className="w-1/3 h-full font-black text-slate-400 hover:text-emerald-600 flex items-center justify-center">+</button>
            </div>
            <button onClick={handleAddToCart} className="bg-slate-900 text-white px-3 lg:px-4 h-10 lg:h-11 rounded-xl flex items-center justify-center font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:scale-105 active:scale-95 transition-all shadow-md shrink-0">
              <span className="text-sm">🛒</span>
              <span className="ml-1.5 hidden min-[360px]:inline">Dodaj</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductSkeleton = ({ isListView }: { isListView: boolean }) => (
  <div className={`bg-white border border-slate-100 rounded-[40px] p-4 flex animate-pulse ${isListView ? 'flex-row gap-6 items-center w-full' : 'flex-col h-full'}`}>
    <div className={`bg-slate-100 rounded-[32px] ${isListView ? 'w-24 h-24 flex-shrink-0' : 'aspect-square mb-4 w-full'}`} />
    <div className="px-2 pb-2 space-y-3 flex-1 flex flex-col w-full">
      <div className="h-4 bg-slate-200 rounded-md w-3/4" />
      <div className="h-3 bg-slate-100 rounded-md w-1/2" />
      <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-center w-full">
        <div className="space-y-1.5">
          <div className="h-3 bg-slate-100 rounded-md w-12" />
          <div className="h-6 bg-slate-200 rounded-md w-20" />
        </div>
        <div className="w-12 h-12 bg-slate-200 rounded-2xl" />
      </div>
    </div>
  </div>
);

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-200/60 last:border-none py-4">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left py-2 group">
        <span className="font-bold text-slate-800 text-sm md:text-base group-hover:text-red-600 transition-colors">{question}</span>
        <svg className={`w-5 h-5 text-slate-400 transition-transform duration-300 flex-shrink-0 ml-4 ${isOpen ? 'rotate-180 text-red-600' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
      </button>
      <div className={`grid transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden text-slate-600 font-medium text-sm leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-inner">{answer}</div>
      </div>
    </div>
  );
};

const SearchableSelect = ({ label, options, value, onChange, placeholder }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) { if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false); }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  const filteredOptions = Object.entries(options).filter(([val]) => val.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex-1 relative" ref={wrapperRef}>
      <h3 className="text-slate-400 font-black uppercase text-[10px] tracking-widest mb-3">{label}</h3>
      <div className="w-full bg-slate-800 border border-slate-700 text-white text-sm font-bold rounded-xl px-4 py-3.5 flex justify-between items-center cursor-pointer transition-colors hover:border-red-500 shadow-inner" onClick={() => setIsOpen(!isOpen)}>
        <span className={value ? "text-white line-clamp-1" : "text-slate-500"}>{value || placeholder}</span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-slate-700 bg-slate-800/90 backdrop-blur-md">
            <input type="text" className="w-full bg-slate-900 border border-slate-700 text-white text-xs px-3 py-2.5 rounded-lg outline-none focus:border-red-600 placeholder:text-slate-500 transition-colors" placeholder="Wpisz, aby wyszukać..." value={searchTerm} onClick={(e) => e.stopPropagation()} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="max-h-56 overflow-y-auto custom-scrollbar">
            <div className={`px-4 py-3 text-xs font-bold cursor-pointer transition-colors ${!value ? 'bg-red-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`} onClick={() => { onChange(''); setIsOpen(false); setSearchTerm(''); }}>Wyczyść wybór</div>
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-4 text-xs text-slate-500 italic text-center">Brak wyników</div>
            ) : (
              filteredOptions.map(([val, count]) => (
                <div key={val} className={`px-4 py-3 text-xs font-bold cursor-pointer transition-colors flex justify-between items-center border-t border-slate-700/50 ${value === val ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`} onClick={() => { onChange(val); setIsOpen(false); setSearchTerm(''); }}>
                  <span className="line-clamp-1 pr-2">{val}</span>
                  <span className="text-[9px] bg-slate-900/80 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700">{count as number}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function CategoryClient({ initialData, initialFilters, fullPath }: { initialData: any, initialFilters: any, fullPath: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { items, setIsOpen: setCartOpen } = useCart() as any;
  const cartTotalItems = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
  
  // INICJALIZACJA STANÓW DANYMI Z SERWERA (Zamiast zaczynać od null)
  const [categoryData, setCategoryData] = useState<any>(initialData?.category || null);
  const [products, setProducts] = useState<any[]>(initialData?.products || []);
  const [filters, setFilters] = useState<Record<string, Record<string, number>>>(initialFilters || {});
  
  const [breadcrumbs, setBreadcrumbs] = useState<any[]>(initialData?.breadcrumbs || []);
  const [subcategories, setSubcategories] = useState<string[]>(initialData?.subcategories || []);
  const [depth, setDepth] = useState<number>(initialData?.depth || 1);
  const [totalCount, setTotalCount] = useState(initialData?.totalCount || 0);
  
  let rawFaqs = initialData?.category?.faqs || initialData?.faqs || [];
  if (typeof rawFaqs === 'string') { try { rawFaqs = JSON.parse(rawFaqs); } catch(e) { rawFaqs = []; } }
  const [faqs, setFaqs] = useState<any[]>(rawFaqs);

  // ZMIANA: Zaczynamy z false, bo dane już mamy!
  const [loading, setLoading] = useState(false);
  const [filtersLoading, setFiltersLoading] = useState(false);
  
  const [displayLimit, setDisplayLimit] = useState(24);
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [searchQ, setSearchQ] = useState(searchParams.get('q') || '');
  const [filterSearchQuery, setFilterSearchQuery] = useState<Record<string, string>>({});

  const [expandedFilters, setExpandedFilters] = useState<Record<string, boolean>>({});
  const [savedGarage, setSavedGarage] = useState<{ make: string; model: string } | null>(null);
  const [isListView, setIsListView] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [showSliderArrows, setShowSliderArrows] = useState(false);

  const sliderRef = useRef<HTMLDivElement>(null);
  
  // REF DO ZAPOBIEGANIA FETCHOWANIU PRZY PIERWSZYM WEJŚCIU
  const isFirstRenderCategory = useRef(true);
  const isFirstRenderFilters = useRef(true);

  useEffect(() => {
    const checkSlider = () => {
      if (sliderRef.current) setShowSliderArrows(sliderRef.current.scrollWidth > sliderRef.current.clientWidth);
    };
    setTimeout(checkSlider, 50);
    window.addEventListener('resize', checkSlider);
    return () => window.removeEventListener('resize', checkSlider);
  }, [subcategories]);

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

  // Ten useEffect odpala się TYLKO gdy zmieniasz filtry w przeglądarce, 
  // pomija pierwsze wejście (bo masz już dane z serwera).
  useEffect(() => {
    if (isFirstRenderCategory.current) {
        isFirstRenderCategory.current = false;
        return; // Pomijamy fetch na start!
    }

    async function fetchCategoryData() {
      setLoading(true);
      try {
        const queryStr = new URLSearchParams(searchParams.toString());
        queryStr.set('fullPath', fullPath);
        queryStr.set('limit', displayLimit.toString());

        const res = await fetch(`/api/search?${queryStr.toString()}`);
        const json = await res.json();

        setCategoryData(json.category || null);
        setProducts(json.products || []);
        setBreadcrumbs(json.breadcrumbs || []);
        setSubcategories(json.subcategories || []);
        setTotalCount(json.totalCount || 0);
        setDepth(json.depth || 1);
        
        const rFaqs = json.category?.faqs || json.faqs || [];
        if (Array.isArray(rFaqs)) setFaqs(rFaqs);
        else if (typeof rFaqs === 'string') { try { setFaqs(JSON.parse(rFaqs)); } catch (e) {} }

      } catch (error) { console.error("Błąd pobierania:", error); } finally { setLoading(false); }
    }
    fetchCategoryData();
  }, [fullPath, searchParams, displayLimit]);

  // Filtry też pobieramy z klienta TYLKO przy zmianie, pierwsze ładują się z serwera.
  useEffect(() => {
    if (isFirstRenderFilters.current && Object.keys(initialFilters || {}).length > 0) {
        isFirstRenderFilters.current = false;
        return; 
    }

    async function fetchFiltersAsync() {
      setFiltersLoading(true);
      try {
        const queryStr = new URLSearchParams(searchParams.toString());
        queryStr.set('fullPath', fullPath);
        
        const res = await fetch(`/api/filters?${queryStr.toString()}`);
        const json = await res.json();
        setFilters(json.filters || {});
      } catch (error) {
        console.error("Błąd ładowania filtrów:", error);
      } finally {
        setFiltersLoading(false);
      }
    }
    fetchFiltersAsync();
  }, [fullPath, searchParams]);

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

  const toggleFilter = (filterKey: string, filterValue: string) => {
    const currentVal = searchParams.get(filterKey);
    updateUrlParams(filterKey, currentVal === filterValue ? null : filterValue);
  };

  const toggleFilterExpand = (key: string) => {
    setExpandedFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const applyPriceFilter = () => {
    const currentParams = new URLSearchParams(searchParams.toString());
    if (minPrice) currentParams.set('minPrice', minPrice); else currentParams.delete('minPrice');
    if (maxPrice) currentParams.set('maxPrice', maxPrice); else currentParams.delete('maxPrice');
    router.push(`/kategoria/${fullPath}?${currentParams.toString()}`, { scroll: false });
    setIsMobileFiltersOpen(false);
  };

  const handleFilterSearch = (key: string, value: string) => {
    setFilterSearchQuery(prev => ({ ...prev, [key]: value }));
  };

  const handleLoadMore = () => {
    setDisplayLimit(prev => prev + 24);
  };

  const scrollSlider = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const nonMachineryKeywords = ['zootechnika', 'zwierzęta', 'higiena', 'odzież', 'zabawki', 'warsztat', 'gospodarstwo', 'oleje'];
  
  const isMachinery = !breadcrumbs.some(b => nonMachineryKeywords.some(kw => {
     const textToSearch = typeof b === 'string' ? b : (b.name || '');
     return textToSearch.toLowerCase().includes(kw);
  }));

  const garageMake = filters['Pasuje do marki'] || {};
  const garageModel = filters['Pasuje do modelu'] || {};
  
  const techFilters = { ...filters };
  Object.keys(techFilters).forEach(key => {
    const lowerKey = key.toLowerCase();
    if (lowerKey === 'pasuje do marki' || lowerKey === 'pasuje do modelu' || lowerKey === 'marka') {
      delete techFilters[key];
    }
  });

  const filterCoverage = Object.keys(techFilters).map(key => {
    const totalProductsWithFilter = Object.values(techFilters[key]).reduce((sum, count) => sum + count, 0);
    return { key, coverage: totalProductsWithFilter };
  });
  filterCoverage.sort((a, b) => b.coverage - a.coverage);

  let techFilterKeys: string[] = [];
  if (depth === 1) {
     techFilterKeys = filterCoverage.slice(0, 5).map(f => f.key);
  } else if (depth === 2) {
     techFilterKeys = filterCoverage.slice(0, 5).map(f => f.key);
  } else {
     techFilterKeys = filterCoverage.map(f => f.key);
  }

  let activeFiltersCount = 0;
  searchParams.forEach((val, key) => {
    if (!['limit', 'q', 'sort', 'Pasuje do marki', 'Pasuje do modelu'].includes(key)) activeFiltersCount++;
  });

  let displayH1 = categoryData?.h1_dynamic;
  if (!displayH1 && breadcrumbs.length > 0) {
      const lastCrumb = breadcrumbs[breadcrumbs.length - 1];
      displayH1 = typeof lastCrumb === 'string' ? lastCrumb : lastCrumb.name;
  }
  if (!displayH1) displayH1 = "Kategoria";

  const brandLabel = searchParams.get('Pasuje do marki');
  const modelLabel = searchParams.get('Pasuje do modelu');
  
  if (brandLabel && !displayH1.toLowerCase().includes(brandLabel.toLowerCase())) {
    displayH1 += ` DO ${brandLabel.toUpperCase()}`;
    if (modelLabel) displayH1 += ` ${modelLabel.toUpperCase()}`;
  }

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
            <button onClick={() => updateUrlParams(filterKey, null)} className="text-[9px] text-red-600 font-black uppercase hover:underline bg-red-50 px-2 py-1 rounded-md">
              Wyczyść ✕
            </button>
          )}
        </div>
        
        {isLongList && (
          <div className="relative mb-3">
            <input type="text" placeholder={`Szukaj w ${filterKey.toLowerCase()}...`} className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-[10px] font-bold text-slate-700 outline-none focus:border-red-600 transition-colors" value={filterSearchQuery[filterKey] || ''} onChange={(e) => handleFilterSearch(filterKey, e.target.value)} />
            <span className="absolute right-3 top-2 text-slate-300 text-xs">🔍</span>
          </div>
        )}
        
        <div className={`space-y-2 ${isExpanded ? 'max-h-[300px] overflow-y-auto pr-2 custom-scrollbar' : ''}`}>
          {displayEntries.length === 0 ? (
            <div className="text-[9px] text-slate-400 uppercase font-black tracking-widest py-2">Brak wyników</div>
          ) : (
            displayEntries.map(([val, count]) => {
              const isChecked = searchParams.get(filterKey) === val;
              return (
                <label key={val} className="flex items-center justify-between cursor-pointer group" onClick={() => toggleFilter(filterKey, val)}>
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 border-2 rounded-md flex items-center justify-center transition-all flex-shrink-0 ${isChecked ? 'border-red-600 bg-red-50' : 'border-slate-200 bg-slate-50 group-hover:border-red-400'}`}>
                      {isChecked && <div className="w-2.5 h-2.5 bg-red-600 rounded-[2px]"></div>}
                    </div>
                    <span className={`text-sm transition-colors line-clamp-1 ${isChecked ? 'text-red-600 font-black' : 'text-slate-600 font-medium group-hover:text-slate-900'}`}>{val}</span>
                  </div>
                  <span className="text-[9px] font-black text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full flex-shrink-0">{count}</span>
                </label>
              );
            })
          )}
        </div>

        {isLongList && !isExpanded && (
          <button onClick={() => toggleFilterExpand(filterKey)} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-red-600 mt-2 flex items-center gap-1 w-full pt-2 border-t border-slate-50">
            <span>+ Pokaż więcej ({sortedEntries.length - 5})</span>
          </button>
        )}
        {isLongList && isExpanded && (
          <button onClick={() => { toggleFilterExpand(filterKey); handleFilterSearch(filterKey, ''); }} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-red-600 mt-2 flex items-center gap-1 w-full pt-2 border-t border-slate-50">
            <span>- Zwiń listę</span>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      
      <header className="border-b py-4 px-6 bg-white sticky top-0 z-[60] shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center w-full">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-black text-xl tracking-tighter hover:text-red-600 transition-colors">
              CentrumRolnictwa<span className="text-slate-400">.pl</span>
            </Link>
          </div>
          <button onClick={() => setCartOpen(true)} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors relative shadow-inner border border-slate-100">
             <span className="text-xl">🛒</span>
             {cartTotalItems > 0 && (
               <span className="absolute -top-1 -right-1 bg-red-600 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-md shadow-red-600/30">
                 {cartTotalItems}
               </span>
             )}
          </button>
        </div>
      </header>

      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[45] w-full max-w-[90%] flex justify-center">
        <button onClick={() => setIsMobileFiltersOpen(true)} className="bg-slate-900 text-white px-8 py-4 rounded-full font-black text-[11px] uppercase tracking-widest shadow-[0_10px_40px_rgba(0,0,0,0.3)] flex items-center justify-center gap-3 w-full border border-slate-700 transition-transform active:scale-95">
          FILTRUJ I SORTUJ
          {activeFiltersCount > 0 && <span className="bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] ml-1">{activeFiltersCount}</span>}
        </button>
      </div>

      <div className="bg-white border-b pt-8 pb-6 px-6 relative z-20">
        <div className="max-w-7xl mx-auto">
          {breadcrumbs.length > 0 && (
            <nav className="flex text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 gap-2 items-center flex-wrap">
              <Link href="/" className="hover:text-red-600 transition-colors">Start</Link>
              {breadcrumbs.map((crumb, idx) => {
                const crumbPath = typeof crumb === 'string' ? crumb : crumb.path;
                const crumbName = typeof crumb === 'string' ? crumb : crumb.name;
                return (
                  <React.Fragment key={idx}>
                    <span className="text-slate-200">/</span>
                    <Link href={`/kategoria/${crumbPath}`} className="hover:text-red-600 transition-colors">
                      {crumbName}
                    </Link>
                  </React.Fragment>
                );
              })}
            </nav>
          )}

          {savedGarage && (
            <div className="mb-4 bg-slate-900 text-white w-fit px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-slate-800 shadow-md">
              <span className="text-emerald-500 animate-pulse">●</span> Filtry aktywne dla: {savedGarage.make} {savedGarage.model}
              <button onClick={clearGarage} className="text-red-500 hover:text-red-400 font-bold ml-2">Wyczyść ✕</button>
            </div>
          )}
          
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black uppercase italic text-slate-900 mb-4 max-w-4xl leading-tight">
            {displayH1}
          </h1>
          {categoryData?.top_seo_text && (
             <p className="text-slate-600 font-medium max-w-3xl text-sm lg:text-base mb-8">{categoryData.top_seo_text}</p>
          )}

          {subcategories.length > 0 && (
            <div className="mb-10 relative">
              <div className="flex justify-between items-end mb-3 px-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Podkategorie</span>
                {showSliderArrows && subcategories.length > 5 && (
                  <span className="text-[9px] font-bold uppercase tracking-widest text-red-500 animate-pulse flex items-center gap-1 hidden md:flex">
                    Przesuń, by zobaczyć więcej ➔
                  </span>
                )}
              </div>
              
              <div className="relative group">
                {showSliderArrows && subcategories.length > 5 && (
                  <button onClick={() => scrollSlider('left')} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 bg-white border border-slate-200 shadow-lg text-slate-600 rounded-full w-10 h-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex hover:text-red-600 hover:border-red-600">
                    ‹
                  </button>
                )}

                <div 
                  ref={sliderRef} 
                  className={subcategories.length <= 5 
                    ? "flex flex-wrap gap-2 lg:gap-3" 
                    : "grid grid-rows-2 grid-flow-col auto-cols-max gap-3 pb-4 overflow-x-auto scrollbar-hide snap-x relative z-0 pr-12"}
                >
                  {subcategories.map(sub => {
                    const subHref = `/kategoria/${fullPath}/${generateSlug(sub)}`;
                    return (
                      <Link key={sub} href={subHref} className="snap-start shrink-0 border whitespace-nowrap text-center py-3 px-5 rounded-xl transition-all flex items-center justify-center shadow-sm hover:shadow-md hover:-translate-y-0.5 bg-white border-slate-200 hover:border-red-400 text-slate-700">
                        <span className="text-[11px] font-black uppercase tracking-widest transition-colors">{sub}</span>
                      </Link>
                    );
                  })}
                </div>

                {showSliderArrows && subcategories.length > 5 && (
                  <>
                    <div className="absolute right-0 top-0 bottom-4 w-16 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none"></div>
                    <button onClick={() => scrollSlider('right')} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 bg-white border border-slate-200 shadow-lg text-slate-600 rounded-full w-10 h-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex hover:text-red-600 hover:border-red-600">
                      ›
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {(!isMachinery && depth === 1) ? null : (
            <div className="bg-slate-900 rounded-[32px] p-6 lg:p-8 flex flex-col lg:flex-row gap-6 items-start lg:items-center shadow-xl mb-4 relative overflow-visible">
              <div className="absolute -right-10 -top-10 text-9xl opacity-5 pointer-events-none">🚜</div>
              <div className="w-full lg:w-1/3 z-10">
                <h3 className="text-white font-black uppercase text-[10px] tracking-widest mb-3">Znasz numer części?</h3>
                <form onSubmit={(e) => { e.preventDefault(); updateUrlParams('q', searchQ); }} className="relative">
                  <input type="text" placeholder="Wpisz nr OEM lub nazwę..." className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:border-red-600 transition-colors placeholder:text-slate-500 shadow-inner" value={searchQ} onChange={(e) => setSearchQ(e.target.value)} />
                  <button type="submit" className="absolute right-2 top-2 bg-red-600 hover:bg-red-500 text-white p-1.5 rounded-lg transition-colors shadow-md">🔍</button>
                </form>
              </div>
              <div className="hidden lg:block w-px h-16 bg-slate-700 z-10"></div>
              <div className="w-full lg:w-2/3 flex flex-col sm:flex-row gap-4 z-20">
                  <SearchableSelect label="Wybierz markę" placeholder={filtersLoading ? "Ładowanie marek..." : "Wszystkie marki"} options={garageMake} value={searchParams.get('Pasuje do marki') || ''} onChange={(val: string) => updateUrlParams('Pasuje do marki', val)} />
                  <SearchableSelect label="Wybierz model" placeholder={filtersLoading ? "Ładowanie modeli..." : "Wszystkie modele"} options={garageModel} value={searchParams.get('Pasuje do modelu') || ''} onChange={(val: string) => updateUrlParams('Pasuje do modelu', val)} />
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-slate-100 mt-2 relative z-10 hidden lg:flex">
            <div className="flex items-center gap-4">
              <div className="h-1 w-12 bg-red-600"></div>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Katalog: {totalCount} części</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200 shadow-inner">
                <button onClick={() => setIsListView(false)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${!isListView ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Siatka 🔳</button>
                <button onClick={() => setIsListView(true)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${isListView ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Lista ☰</button>
              </div>
              <select className="bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-black uppercase tracking-widest rounded-xl px-4 py-2.5 outline-none focus:border-red-600 cursor-pointer shadow-sm" value={searchParams.get('sort') || ''} onChange={(e) => updateUrlParams('sort', e.target.value)}>
                <option value="">Sortowanie Domyślne</option>
                <option value="price_asc">Cena: rosnąco</option>
                <option value="price_desc">Cena: malejąco</option>
                <option value="name_asc">Nazwa: A-Z</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6 lg:py-12 flex flex-col lg:flex-row gap-12 relative z-10">
        
        {/* BOCCZNY PASEK FILTRÓW */}
        <aside className={`${isMobileFiltersOpen ? 'fixed inset-0 z-[100] bg-white flex flex-col' : 'hidden lg:block w-full lg:w-72 flex-shrink-0'}`}>
          <div className={`${isMobileFiltersOpen ? 'flex-1 overflow-y-auto p-5 pb-32 custom-scrollbar' : 'space-y-6'}`}>
            
            {isMobileFiltersOpen && (
               <div className="sticky top-0 bg-slate-900 text-white p-5 flex justify-between items-center z-10 shadow-md mb-6">
                  <span className="font-black uppercase tracking-widest text-sm">Filtry</span>
                  <button onClick={() => setIsMobileFiltersOpen(false)} className="bg-slate-800 hover:bg-red-600 px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-colors">✕ Zamknij</button>
               </div>
            )}

            {!isMobileFiltersOpen && (
              <div className="bg-slate-900 p-6 rounded-[24px] text-white overflow-hidden relative shadow-md">
                 <div className="absolute -right-4 -bottom-4 text-7xl opacity-10 pointer-events-none">📞</div>
                 <h3 className="font-black uppercase text-[10px] tracking-widest mb-2 text-red-500">Szukasz czegoś nietypowego?</h3>
                 <p className="text-[10px] font-medium text-slate-300 leading-relaxed mb-4">Zadzwoń do technika. Dobierzemy część po numerze katalogowym.</p>
                 <Link href="/kontakt" className="block w-full bg-white text-slate-900 text-center py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm">Zadzwoń do eksperta</Link>
              </div>
            )}

            {isMobileFiltersOpen && (
              <div className="mb-8 border-b border-slate-100 pb-8 space-y-6">
                 <div>
                   <h4 className="font-black text-[11px] uppercase tracking-wider text-slate-900 mb-3">Sortowanie</h4>
                   <select className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-widest rounded-xl px-4 py-3 outline-none focus:border-red-600" value={searchParams.get('sort') || ''} onChange={(e) => updateUrlParams('sort', e.target.value)}>
                     <option value="">Najbardziej trafne</option>
                     <option value="price_asc">Cena: rosnąco</option>
                     <option value="price_desc">Cena: malejąco</option>
                     <option value="name_asc">Nazwa: A-Z</option>
                   </select>
                 </div>
                 <div>
                   <h4 className="font-black text-[11px] uppercase tracking-wider text-slate-900 mb-3">Układ widoku</h4>
                   <div className="flex gap-2">
                     <button onClick={() => setIsListView(false)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${!isListView ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>Siatka 🔳</button>
                     <button onClick={() => setIsListView(true)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${isListView ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>Lista ☰</button>
                   </div>
                 </div>
              </div>
            )}

            <div className={`bg-white rounded-[32px] border border-slate-100 shadow-sm ${!isMobileFiltersOpen ? 'p-6' : 'p-0 border-none shadow-none'}`}>
              {!isMobileFiltersOpen && (
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                  <h3 className="font-black uppercase text-[10px] tracking-widest text-slate-400">Filtry wyników</h3>
                  {searchParams.toString() && <button onClick={() => router.push(`/kategoria/${fullPath}`)} className="text-[9px] text-red-600 font-black uppercase hover:underline">Wyczyść wszystkie</button>}
                </div>
              )}

              <div className="mb-8 border-b border-slate-100 pb-6">
                <h4 className="font-black text-[11px] uppercase tracking-wider text-slate-900 mb-4">Cena (zł)</h4>
                <div className="flex gap-2 items-center">
                  <input type="number" placeholder="Od" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-red-600" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
                  <span className="text-slate-400 font-black">-</span>
                  <input type="number" placeholder="Do" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-red-600" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
                </div>
                <button onClick={applyPriceFilter} className="w-full mt-3 bg-slate-900 text-white py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors">Filtruj cenę</button>
              </div>

              <div className="space-y-8">
                {filtersLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="animate-pulse space-y-3">
                      <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
                      <div className="h-3 bg-slate-100 rounded w-full"></div>
                      <div className="h-3 bg-slate-100 rounded w-5/6"></div>
                      <div className="h-3 bg-slate-100 rounded w-4/6"></div>
                      <div className="h-3 bg-slate-100 rounded w-full"></div>
                    </div>
                  ))
                ) : (
                  techFilterKeys.map((filterKey) => renderFilterBlock(filterKey))
                )}
              </div>
            </div>
          </div>

          {isMobileFiltersOpen && (
             <div className="fixed bottom-0 left-0 w-full p-4 bg-white border-t z-10 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
                 <button onClick={() => setIsMobileFiltersOpen(false)} className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest active:scale-95 transition-transform">
                    Pokaż {products.length} wyników ➔
                 </button>
             </div>
          )}
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
                <p className="text-slate-500 font-medium text-sm max-w-md mx-auto mb-8">Prawdopodobnie przefiltrowałeś zbyt wąsko lub asortyment przeniósł się do podkategorii.</p>
                <div className="flex gap-4">
                  <button onClick={() => router.push(`/kategoria/${fullPath}`)} className="bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors">Wyczyść filtry</button>
                </div>
              </div>
            ) : (
              <div className={isListView ? "space-y-4 w-full" : "grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-8"}>
                {products.map((product: any, idx: number) => (
  <ProductCard key={`${product.id || product.sku}-${idx}`} product={product} isListView={isListView} idx={idx} />
))}
              </div>
            )}
          </div>

          {totalCount > 0 && !loading && (
            <div className="mt-16 flex flex-col items-center gap-4 border-t border-slate-100 pt-8">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Wyświetlono {products.length} z {totalCount} części</p>
              <div className="w-64 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-red-600 transition-all duration-500 rounded-full" style={{ width: `${Math.min(100, (products.length / totalCount) * 100)}%` }} />
              </div>
              {products.length < totalCount && (
                <button onClick={handleLoadMore} className="mt-2 bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-red-600 transition-all transform hover:scale-[1.02] shadow-md">
                  Załaduj kolejne produkty ➔
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* SEO i FAQ */}
      {(categoryData?.bottom_seo_text || faqs.length > 0) && !loading && (
        <section className="border-t border-slate-200/60 bg-white mt-12 py-16 px-6 relative z-10">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-16 items-start">
            {categoryData?.bottom_seo_text && (
              <div className="lg:col-span-2 space-y-6">
                <div className="h-1 w-16 bg-red-600 mb-6"></div>
                <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-slate-900">Poradnik techniczny i specyfikacja kategorii</h2>
                <div className="prose prose-slate prose-sm md:prose-base max-w-none text-slate-600 font-medium leading-relaxed prose-strong:font-black prose-strong:text-slate-900 prose-a:text-red-600 hover:prose-a:text-red-700" dangerouslySetInnerHTML={{ __html: categoryData.bottom_seo_text }} />
              </div>
            )}
            {faqs.length > 0 && (
              <div className={`bg-slate-50/60 p-6 md:p-8 rounded-[32px] border border-slate-100 shadow-sm ${!categoryData?.bottom_seo_text ? 'lg:col-span-3' : ''}`}>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                  Często zadawane pytania (FAQ)
                </h3>
                <div className="divide-y divide-slate-100">
                  {faqs.map((item: any, index: number) => (
                    <FAQItem key={index} question={item.question || item.q || 'Pytanie produktowe'} answer={item.answer || item.a || 'Szczegółowe informacje uzyskasz u doradcy.'} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}