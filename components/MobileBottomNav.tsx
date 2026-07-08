'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/store/useCart';
import MobileCategoryMenu from './MobileCategoryMenu';

export default function MobileBottomNav() {
  const { items, setIsOpen } = useCart() as any;
  const [cartCount, setCartCount] = useState(0);
  // Stan menu kategorii — trzymany tu, bo to „Działy" je otwiera.
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (items) {
      const total = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
      setCartCount(total);
    }
  }, [items]);

  return (
    <>
      {/* Pełnoekranowe menu kategorii (drill-down). Kontrolowane stąd przez „Działy". */}
      <MobileCategoryMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 z-[90] flex justify-between items-center px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-5px_20px_rgba(0,0,0,0.05)]" aria-label="Nawigacja mobilna">

        <a href="tel:+48257888900" aria-label="Zadzwoń do nas" className="flex flex-col items-center justify-center flex-1 min-h-[64px] text-slate-600 hover:text-red-600 transition-colors">
          <span className="text-xl mb-0.5">📞</span>
          <span className="text-[9px] font-black uppercase tracking-widest">Kontakt</span>
        </a>

        {/* DZIAŁY — otwiera menu kategorii (button, nie Link). aria-expanded dla dostępności. */}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Menu"
          aria-expanded={menuOpen}
          aria-haspopup="dialog"
          className="flex flex-col items-center justify-center flex-1 min-h-[64px] text-slate-600 hover:text-red-600 transition-colors cursor-pointer"
        >
          <span className="text-xl mb-0.5">☰</span>
          <span className="text-[9px] font-black uppercase tracking-widest">Działy</span>
        </button>

        <Link href="/" prefetch={false} aria-label="Strona Główna" className="flex flex-col items-center justify-center flex-1 relative -top-4 z-50">
          <div className="bg-white p-1 rounded-full shadow-lg border border-slate-100 flex items-center justify-center transition-transform hover:scale-105">
             <div className="bg-white w-12 h-12 rounded-full overflow-hidden flex items-center justify-center border border-slate-200 relative">
               <Image
                  src="https://centrumrolnictwa-cdn.b-cdn.net/logo.png?width=56&format=webp&quality=60"
                  alt=""
                  width={56}
                  height={45}
                  className="object-contain"
                  unoptimized
               />
             </div>
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-900 mt-1">Start</span>
        </Link>

        <Link href="/konto" prefetch={false} aria-label="Twoje konto" className="flex flex-col items-center justify-center flex-1 min-h-[64px] text-slate-600 hover:text-red-600 transition-colors">
          <svg className="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
          <span className="text-[9px] font-black uppercase tracking-widest">Konto</span>
        </Link>

        <button onClick={() => setIsOpen?.(true)} aria-label="Koszyk" className="flex flex-col items-center justify-center flex-1 min-h-[64px] text-slate-600 hover:text-red-600 transition-colors relative cursor-pointer">
          {cartCount > 0 && (
            <div className="absolute top-2 right-[20%] bg-red-600 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-md animate-bounce border border-white">
              {cartCount}
            </div>
          )}
          <svg className="w-6 h-6 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 014 0z"></path>
          </svg>
          <span className="text-[9px] font-black uppercase tracking-widest">Koszyk</span>
        </button>

      </nav>
    </>
  );
}