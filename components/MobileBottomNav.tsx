'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/store/useCart';

export default function MobileBottomNav() {
  const { items, setIsOpen } = useCart();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (items) {
      const total = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
      setCartCount(total);
    }
  }, [items]);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 z-[70] flex justify-between items-end px-2 pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+8px)] shadow-[0_-10px_40px_rgba(0,0,0,0.08)]" aria-label="Nawigacja mobilna">
      <a href="tel:+48257888900" className="flex flex-col items-center w-[20%] pb-1 text-slate-400 hover:text-red-600 transition-colors">
        <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
        <span className="text-[8px] font-black uppercase tracking-widest">Kontakt</span>
      </a>
      <Link href="/kategorie" className="flex flex-col items-center w-[20%] pb-1 text-slate-400 hover:text-red-600 transition-colors">
        <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        <span className="text-[8px] font-black uppercase tracking-widest">Działy</span>
      </Link>
      
      <Link href="/" className="flex flex-col items-center w-[20%] relative -top-3 group z-50">
        <div className="bg-white p-1 rounded-full shadow-[0_5px_15px_rgba(0,0,0,0.15)] border border-slate-100 group-hover:scale-105 transition-transform flex items-center justify-center -mb-0.5">
           <div className="bg-white w-11 h-11 rounded-full overflow-hidden flex items-center justify-center border border-slate-200">
             <img src="https://centrumrolnictwa-cdn.b-cdn.net/logo/logo-centrumrolnictwapl-2-1.jpeg" alt="Logo" className="w-8 h-8 object-contain" />
           </div>
        </div>
        <span className="text-[7.5px] font-black tracking-tighter text-slate-900 mt-1 leading-tight text-center uppercase">
          Centrum<br/>Rolnictwa<span className="text-red-600">.pl</span>
        </span>
      </Link>
      
      <Link href="/konto" className="flex flex-col items-center w-[20%] pb-1 text-slate-400 hover:text-slate-900 transition-colors">
        <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
        <span className="text-[8px] font-black uppercase tracking-widest">Konto</span>
      </Link>
      <button onClick={() => setIsOpen?.(true)} className="flex flex-col items-center w-[20%] pb-1 text-slate-400 hover:text-red-600 transition-colors relative cursor-pointer z-50">
        {cartCount > 0 && <div className="absolute -top-1 right-[10%] bg-red-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm animate-bounce">{cartCount}</div>}
        <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 014 0z"></path></svg>
        <span className="text-[8px] font-black uppercase tracking-widest">Koszyk</span>
      </button>
    </nav>
  );
}