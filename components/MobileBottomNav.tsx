'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/store/useCart';

export default function MobileBottomNav() {
  const { items, setIsOpen } = useCart();
  const [cartCount, setCartCount] = useState(0);

  // Używamy useEffect, aby uniknąć problemów z hydratacją (SSR vs Client)
  useEffect(() => {
    if (items) {
      const total = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
      setCartCount(total);
    }
  }, [items]);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 z-[70] flex justify-between items-end px-3 pt-1 pb-[calc(env(safe-area-inset-bottom,0px)+8px)] shadow-[0_-10px_40px_rgba(0,0,0,0.08)]" aria-label="Nawigacja mobilna">
      
      {/* 1. Lewa strona - Kontakt */}
      <a href="tel:+48257888900" className="flex flex-col items-center w-[20%] pb-2 text-slate-400 hover:text-red-600 transition-colors">
        <span className="text-[22px] mb-1 leading-none">📞</span>
        <span className="text-[8px] font-black uppercase tracking-widest">Kontakt</span>
      </a>

      {/* 2. Lewa strona - Działy */}
      <Link href="/kategorie" className="flex flex-col items-center w-[20%] pb-2 text-slate-400 hover:text-red-600 transition-colors">
        <span className="text-[22px] mb-1 leading-none">☰</span>
        <span className="text-[8px] font-black uppercase tracking-widest">Działy</span>
      </Link>
      
      {/* 3. Środek - PŁYWAJĄCE LOGO */}
      <Link href="/" className="flex flex-col items-center w-[20%] relative -top-3 group z-50">
        <div className="bg-white p-1.5 rounded-full shadow-[0_5px_15px_rgba(0,0,0,0.15)] border border-slate-100 group-hover:scale-105 transition-transform flex items-center justify-center -mb-0.5">
           {/* POPRAWKA: Czyste białe tło, brak mix-blend-multiply, wymuszone wymiary w-10 h-10 */}
           <div className="bg-white w-12 h-12 rounded-full overflow-hidden flex items-center justify-center border border-slate-200">
             <img src="https://centrumrolnictwa-cdn.b-cdn.net/logo.png" alt="Start" className="w-10 h-10 object-contain" />
           </div>
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-900 mt-1">Start</span>
      </Link>
      
      {/* 4. Prawa strona - Konto */}
      <Link href="/konto" className="flex flex-col items-center w-[20%] pb-2 text-slate-400 hover:text-slate-900 transition-colors">
        <svg className="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
        </svg>
        <span className="text-[8px] font-black uppercase tracking-widest">Konto</span>
      </Link>

      {/* 5. Prawa strona - Koszyk */}
      <button onClick={() => setIsOpen?.(true)} className="flex flex-col items-center w-[20%] pb-2 text-slate-400 hover:text-red-600 transition-colors relative cursor-pointer z-50">
        {/* POPRAWKA: Dodana klasa animate-bounce do powiadomienia koszyka */}
        {cartCount > 0 && (
          <div className="absolute top-0 right-[15%] bg-red-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm animate-bounce">
            {cartCount}
          </div>
        )}
        <svg className="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 014 0z"></path>
        </svg>
        <span className="text-[8px] font-black uppercase tracking-widest">Koszyk</span>
      </button>

    </nav>
  );
}