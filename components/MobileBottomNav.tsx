'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/store/useCart';

export default function MobileBottomNav() {
  const { items, setIsOpen } = useCart();
  const [cartCount, setCartCount] = useState(0);

  // Używamy useEffect, aby uniknąć problemów z hydratacją na Vercelu
  useEffect(() => {
    if (items) {
      const total = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
      setCartCount(total);
    }
  }, [items]);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 z-[70] flex justify-between items-end px-2 pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+8px)] shadow-[0_-10px_40px_rgba(0,0,0,0.08)]" aria-label="Nawigacja mobilna">
      
      {/* 1. Kontakt */}
      <a href="tel:+48257888900" className="flex flex-col items-center w-[20%] pb-1 text-slate-400 hover:text-red-600 transition-colors">
        <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
        </svg>
        <span className="text-[8px] font-black uppercase tracking-widest">Kontakt</span>
      </a>

      {/* 2. Działy */}
      <Link href="/kategorie" className="flex flex-col items-center w-[20%] pb-1 text-slate-400 hover:text-red-600 transition-colors">
        <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
        </svg>
        <span className="text-[8px] font-black uppercase tracking-widest">Działy</span>
      </Link>
      
      {/* 3. Środek - Główny Przycisk Start (Zastępuje zepsute logo) */}
      <Link href="/" className="flex flex-col items-center w-[20%] relative -top-4 group z-50">
        <div className="bg-red-600 text-white w-14 h-14 rounded-full shadow-[0_10px_20px_rgba(220,38,38,0.3)] border-4 border-white group-hover:scale-105 transition-transform flex items-center justify-center">
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
           </svg>
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-900 mt-1">Start</span>
      </Link>
      
      {/* 4. Konto */}
      <Link href="/konto" className="flex flex-col items-center w-[20%] pb-1 text-slate-400 hover:text-slate-900 transition-colors">
        <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
        </svg>
        <span className="text-[8px] font-black uppercase tracking-widest">Konto</span>
      </Link>

      {/* 5. Koszyk (z podskakującym powiadomieniem) */}
      <button onClick={() => setIsOpen?.(true)} className="flex flex-col items-center w-[20%] pb-1 text-slate-400 hover:text-red-600 transition-colors relative cursor-pointer z-50">
        {cartCount > 0 && (
          <div className="absolute -top-1 right-[10%] bg-red-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm animate-bounce">
            {cartCount}
          </div>
        )}
        <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 014 0z"></path>
        </svg>
        <span className="text-[8px] font-black uppercase tracking-widest">Koszyk</span>
      </button>

    </nav>
  );
}