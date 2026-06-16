'use client'; 

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/store/useCart';
import { trackViewSearchResults } from '@/lib/analytics'; 
import { useGarage } from '@/store/useGarage'; // 1. IMPORT STANU GARAŻU

const PHRASES = [
  "Wpisz numer OEM części...",
  "Szukaj części do Zetora...",
  "Wpisz kod SKU produktu...",
  "Jakiej części dzisiaj szukasz?",
  "Wpisz nazwę maszyny..."
];

export default function SearchBar() {
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // 2. POBIERAMY STAN GARAŻU
  const { isActive, brand, model } = useGarage();

  // --- 1. INTELIGENTNY PLACEHOLDER (Animacja pisania) ---
  const [placeholderText, setPlaceholderText] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (query.length > 0) return;

    const typingSpeed = isDeleting ? 40 : 80;
    const currentPhrase = PHRASES[phraseIndex];

    const timeout = setTimeout(() => {
      if (!isDeleting && placeholderText === currentPhrase) {
        setTimeout(() => setIsDeleting(true), 2500);
      } else if (isDeleting && placeholderText === '') {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % PHRASES.length);
      } else {
        setPlaceholderText(
          currentPhrase.substring(0, placeholderText.length + (isDeleting ? -1 : 1))
        );
      }
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [placeholderText, isDeleting, phraseIndex, query.length]);


  // --- 2. MECHANIZM "WELCOME BACK" (Odzyskiwanie koszyka) ---
  const { items, setIsOpen: setCartOpen } = useCart() as any;
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = sessionStorage.getItem('centrumrolnictwa_welcome_shown');
    
    if (items?.length > 0 && !hasSeenWelcome) {
      const timer = setTimeout(() => {
        setShowWelcomeBack(true);
        sessionStorage.setItem('centrumrolnictwa_welcome_shown', 'true');
      }, 1500);

      const hideTimer = setTimeout(() => {
        setShowWelcomeBack(false);
      }, 7500);

      return () => { clearTimeout(timer); clearTimeout(hideTimer); };
    }
  }, [items?.length]);


  // Zamykanie wyników przy kliknięciu poza wyszukiwarką
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- 3. LOGIKA WYSZUKIWANIA (MeiliSearch / API) z obsługą Garażu ---
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        // MAGIA GARAŻU: Ciche doklejenie maszyny do wyszukiwania
        const searchQuery = isActive ? `${query} ${brand} ${model}` : query;
        
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        const json = await res.json();
        setResults(json.data || json.products || []); 
        setIsOpen(true);
      } catch (error) {
        console.error('Błąd wyszukiwania', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, isActive, brand, model]); // Zależność od garażu

  // DATA LAYER: Obsługa intencji wyszukiwania
  const handleSearchSubmit = () => {
    if (query.length >= 2) {
      const searchQuery = isActive ? `${query} ${brand} ${model}` : query;
      trackViewSearchResults(searchQuery);
      setIsOpen(false);
      
      // Przekazanie parametrów garażu do URL pełnej strony wyników
      const url = new URL(`/kategorie`, window.location.origin);
      url.searchParams.set('q', query);
      if (isActive) {
        url.searchParams.set('marka', brand);
        url.searchParams.set('model', model);
      }
      router.push(url.pathname + url.search);
    }
  };

  return (
    <>
      <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[9999] transition-all duration-500 ease-out ${showWelcomeBack ? 'translate-y-0 opacity-100' : '-translate-y-24 opacity-0 pointer-events-none'}`}>
        <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => { setShowWelcomeBack(false); setCartOpen(true); }}>
          <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-lg shadow-inner shrink-0">🛒</div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-0.5">Witaj z powrotem!</p>
            <p className="text-xs font-bold">Masz {items?.length} nieopłacone pozycje w koszyku.</p>
          </div>
          <span className="text-slate-400 ml-4 font-bold">➔</span>
        </div>
      </div>

      <div className="relative w-full z-50 group" ref={searchRef}>
        <div className="relative flex items-center">
          <input 
            type="text" 
            placeholder={placeholderText + (query.length === 0 && !isDeleting ? '|' : '')} 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setIsOpen(true)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()} 
            className="w-full bg-slate-50 border-2 border-slate-200 focus:border-red-600 focus:bg-white rounded-2xl py-3.5 px-6 pr-14 outline-none transition-all text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-medium shadow-inner"
          />
          <button 
            onClick={handleSearchSubmit} 
            className="absolute right-2 bg-slate-900 text-white w-10 h-10 rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center shadow-md active:scale-95 cursor-pointer"
          >
            {isSearching ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span className="text-sm leading-none">🔍</span>
            )}
          </button>
        </div>

        {isOpen && (
          <div className="absolute top-full mt-3 w-full bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden before:absolute before:top-0 before:left-0 before:w-full before:h-1 before:bg-gradient-to-r before:from-red-600 before:to-red-400">
            {results.length > 0 ? (
              <div className="flex flex-col">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Wyniki wyszukiwania {isActive && <span className="text-red-600 ml-1">dla {brand} {model}</span>}
                  </span>
                  <span className="text-[10px] font-bold bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600">Znaleziono: {results.length}</span>
                </div>
                <ul className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                  {results.map((product: any) => {
                    const img = product.image || product.external_images?.[0] || product.images?.[0]?.url_thumbnail || product.images?.[0]?.url;
                    return (
                      <li key={product.id || product.sku} className="border-b border-slate-50 last:border-0 hover:bg-red-50/30 transition-colors">
                        <Link 
                          href={`/produkt/${product.slug || product.sku || product.id}`}
                          onClick={() => {
                            const searchQuery = isActive ? `${query} ${brand} ${model}` : query;
                            trackViewSearchResults(searchQuery);
                            setIsOpen(false);
                          }} 
                          className="flex items-center gap-5 p-4 md:p-5"
                        >
                          <div className="w-14 h-14 bg-white rounded-xl border border-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden p-1">
                            {img ? <img src={img} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" /> : <span className="text-[8px] font-black uppercase text-slate-300">Brak</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs md:text-sm font-bold text-slate-800 leading-tight truncate">{product.name || product.title}</h4>
                            <p className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-widest">SKU: {product.sku}</p>
                          </div>
                          <div className="text-right flex-shrink-0 pl-4">
                            <span className="font-black text-slate-900 tracking-tighter">{(product.price || 0).toFixed(2)} <span className="text-[10px] font-bold text-slate-400">zł</span></span>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                  <button 
                    onClick={handleSearchSubmit}
                    className="text-[10px] font-black uppercase tracking-widest text-red-600 hover:text-red-700 transition-colors"
                  >
                    Zobacz wszystkie wyniki ➔
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-10 text-center flex flex-col items-center justify-center">
                <span className="text-4xl mb-4 grayscale opacity-40">🚜</span>
                <p className="text-slate-900 font-black uppercase tracking-tight mb-2">Brak części w magazynie</p>
                <p className="text-slate-500 text-xs font-medium max-w-xs leading-relaxed">
                  Nie znaleźliśmy wyników dla "<span className="text-slate-900 font-bold">{query}</span>" 
                  {isActive && <span className="text-red-600 font-bold"> pasujących do {brand} {model}</span>}. 
                  Spróbuj wpisać numer OEM lub ogólną nazwę podzespołu.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}