'use client'; // To mówi Next.js, że ten kod działa w przeglądarce klienta

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Efekt "Debounce" - czekamy ułamek sekundy po wpisaniu litery, żeby nie zalać serwera zapytaniami
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${query}`);
        const json = await res.json();
        setResults(json.data || []);
        setIsOpen(true);
      } catch (error) {
        console.error('Błąd wyszukiwania', error);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300 milisekund opóźnienia

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="relative w-full z-50">
      <input 
        type="text" 
        placeholder="Wpisz nazwę, np. Terrarium..." 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.length >= 2 && setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)} // Opóźnienie, żeby dało się kliknąć w link
        className="w-full bg-slate-100 border-2 border-transparent focus:border-red-500 focus:bg-white rounded-full py-3 px-6 pr-12 outline-none transition-all text-sm font-medium"
      />
      <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors">
        {isSearching ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <span>🔍</span>
        )}
      </button>

      {/* ROZWIJANE MENU Z WYNIKAMI */}
      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
          {results.length > 0 ? (
            <ul className="max-h-96 overflow-y-auto">
              {results.map((product: any) => {
                const img = product.images?.[0]?.url_thumbnail;
                return (
                  <li key={product.id} className="border-b border-slate-50 last:border-0">
                    <Link 
                      href={`/produkt/${product.id}`}
                      className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-12 h-12 bg-white rounded-lg border border-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {img ? <img src={img} alt={product.name} className="w-full h-full object-contain" /> : <span className="text-[8px] text-slate-300">BRAK</span>}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-slate-800 leading-tight">{product.name}</h4>
                        <p className="text-[10px] text-slate-400 mt-1">SKU: {product.sku}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-black text-slate-900">{product.price.toFixed(2)} zł</span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-6 text-center text-slate-500 text-sm font-medium">
              Brak wyników dla "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}