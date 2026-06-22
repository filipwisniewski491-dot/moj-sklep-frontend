'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import dynamic from 'next/dynamic';
import { useCart } from '@/store/useCart';

const DynamicMegaMenu = dynamic(() => import('@/components/MegaMenu'), { ssr: false });

export default function Header() {
  const { items, setIsOpen: setCartOpen } = useCart() as any;
  const cartTotalItems = items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
  const cartValue = items?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || 0;
  
  const freeShippingThreshold = 500;
  const progressPercent = Math.min((cartValue / freeShippingThreshold) * 100, 100);

  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false); 

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

    const checkScreenSize = () => setIsDesktop(window.innerWidth >= 768);
    checkScreenSize(); 
    window.addEventListener('resize', checkScreenSize);

    return () => {
      clearInterval(timer);
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  const isShippingToday = isMounted && new Date().getHours() < 15;

  return (
    <>
      <div className="bg-slate-900 sm:bg-slate-50 text-white sm:text-slate-600 font-bold relative z-[60] border-b border-slate-800 sm:border-slate-200 h-[37px] sm:h-[49px] flex flex-col justify-center overflow-hidden">
        
        <div className="sm:hidden flex justify-center items-center text-[10px] uppercase tracking-widest text-center px-2">
           <span className="text-amber-400 mr-1.5 text-[12px] shrink-0">⏳</span>
           <span className="truncate">{isShippingToday ? 'ZAMÓW TERAZ = WYSYŁKA DZIŚ' : 'WYSYŁKA JUTRO RANO'}</span>
           <span className="mx-1.5 text-slate-500 shrink-0">|</span>
           <span className="text-emerald-400 mr-1 text-[12px] shrink-0">🚚</span> 
           <span className="truncate">DARMOWA OD 500 ZŁ</span>
        </div>

        <div className="hidden sm:flex max-w-7xl mx-auto flex-row justify-between items-center text-center w-full px-4 gap-3">
          <div className="flex items-center space-x-6 text-xs uppercase tracking-[0.2em]">
            <a href="tel:+48257888900" className="flex items-center gap-2 hover:text-red-600 transition-colors group text-slate-800">
              <span className="text-red-600 text-sm group-hover:animate-bounce">📞</span> <span className="tabular-nums tracking-wider">25 788 89 00</span>
            </a>
            <span className="hidden md:flex items-center gap-2 text-slate-600">
              <span className="text-emerald-500 font-black">✓</span> Ekspercki Dobór Części
            </span>
          </div>
          <div className="flex items-center gap-2 bg-red-50 px-4 py-1 rounded-full border border-red-100 text-red-800">
            <span className="text-[10px] uppercase tracking-widest hidden md:inline font-black">
              {isShippingToday ? 'Wysyłamy dzisiaj. Zamów w:' : 'Wysyłka jutro rano. Zamów w:'}
            </span>
            <span suppressHydrationWarning className="text-red-600 font-black tabular-nums text-sm tracking-widest min-w-[75px] inline-block text-right">
              ⏳ {isMounted ? `${String(timeLeft.hours).padStart(2, '0')}:${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')}` : '00:00:00'}
            </span>
          </div>
        </div>
      </div>

      <header className="bg-white relative z-50 shadow-sm border-b border-slate-100 py-3 md:py-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-row items-center justify-between gap-3 md:gap-8">
          
          <div className="flex-shrink-0 flex items-center min-h-[48px]">
            <Link href="/" aria-label="CentrumRolnictwa.pl - Strona Główna" className="flex flex-col items-center justify-center group transition-transform hover:scale-105 duration-300 min-h-[48px] min-w-[48px] p-1">
              <img 
                src="https://centrumrolnictwa-cdn.b-cdn.net/logo/logo-centrumrolnictwapl-2-1.jpeg?width=200&format=webp&quality=65" 
                alt="" 
                width="150"
                height="121"
                className="w-24 sm:w-28 md:w-36 h-auto aspect-[150/121] object-contain mb-0.5" 
              />
              <span className="font-black text-[11px] sm:text-xs md:text-sm tracking-tighter text-slate-900 leading-none uppercase mt-1">
                CentrumRolnictwa<span className="text-red-600">.pl</span>
              </span>
            </Link>
          </div>

          <div className="flex-1 w-full relative z-50">
             <SearchBar />
          </div>
          <nav className="hidden md:flex items-center space-x-6 text-slate-800">
            <div className="hidden xl:block text-right mr-4">
               <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">
                 Do darmowej: <span className="text-red-600 font-black">{Math.max(0, freeShippingThreshold - cartValue).toFixed(2)} zł</span>
               </p>
               <div className="w-40 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                 <div className="h-full bg-red-600 transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
               </div>
            </div>
            
            <Link href="/konto" aria-label="Twoje Konto" className="flex flex-col items-center justify-center cursor-pointer hover:text-red-600 transition-all group min-w-[48px] min-h-[48px]">
              <div className="p-3 bg-slate-50 rounded-full group-hover:bg-red-50 transition-colors border border-slate-200">
                 <svg className="w-5 h-5 transition-transform text-slate-600 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              </div>
              <span className="text-[10px] font-black mt-1.5 uppercase tracking-widest text-slate-600 group-hover:text-slate-900">Konto</span>
            </Link>

            <button onClick={() => setCartOpen(true)} aria-label="Twój Koszyk" className="flex flex-col items-center justify-center cursor-pointer hover:text-red-600 transition-all relative group min-w-[48px] min-h-[48px]">
              <div className="p-3 bg-slate-50 rounded-full group-hover:bg-red-50 transition-colors relative border border-slate-200">
                 {cartTotalItems > 0 && <div className="absolute -top-1.5 -right-2 bg-red-600 text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md border-2 border-white animate-bounce">{cartTotalItems}</div>}
                 <svg className="w-5 h-5 transition-transform text-slate-600 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 014 0z"></path></svg>
              </div>
              <span className="text-[10px] font-black mt-1.5 uppercase tracking-widest text-slate-800">
                {cartTotalItems > 0 ? `${cartValue.toFixed(2)} zł` : '0.00 zł'}
              </span>
            </button>

          </nav>
        </div>
      </header>
      
      {isDesktop && <DynamicMegaMenu />}
    </>
  );
}