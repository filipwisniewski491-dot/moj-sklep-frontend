'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SearchBar from '@/components/SearchBar';
import MegaMenu from '@/components/MegaMenu';
import MobileBottomNav from '@/components/MobileBottomNav';
import { useCart } from '@/store/useCart';

// Centralizujemy mockowane dane (docelowo z API)
export const MOCK_USER = {
  name: "Jan Kowalski",
  company: "Gospodarstwo Rolne Kowalski",
  tier: "Srebrny Partner",
  cashbackBalance: 124.50,
  nextTierGoal: 5000,
  currentSpent: 3850,
  totalSavedLifetime: 1450.00,
  savedFromTier: 1100.00,
  savedFromCashback: 350.00,
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { items } = useCart();
  const cartValue = items?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || 0;
  const freeShippingThreshold = 500;
  const progressPercent = Math.min((cartValue / freeShippingThreshold) * 100, 100);

  // Funkcja pomocnicza do aktywnego linku
  const navLinkClass = (path: string) => {
    const isActive = pathname === path;
    return `flex items-center gap-3 font-bold text-[11px] uppercase tracking-widest p-4 rounded-xl transition-colors ${
      isActive 
        ? 'bg-red-50 text-red-700 border border-red-100' 
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
    }`;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 md:pb-0">
      <header className="bg-white relative z-50 shadow-sm border-b border-slate-100 py-3 md:py-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-row items-center justify-between gap-3 md:gap-8">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" aria-label="CentrumRolnictwa.pl - Strona Główna">
              <img src="https://centrumrolnictwa-cdn.b-cdn.net/logo/logo-centrumrolnictwapl-2-1.jpeg" alt="CentrumRolnictwa.pl" className="h-10 sm:h-14 md:h-20 w-auto transition-transform hover:scale-105 duration-300" fetchPriority="high" />
            </Link>
          </div>
          <div className="flex-1 w-full relative z-50">
             <SearchBar />
          </div>
          <nav className="hidden md:flex items-center space-x-6 text-slate-800">
             <Link href="/konto" className="flex flex-col items-center cursor-pointer text-red-600 transition-all group">
               <div className="p-3 bg-red-50 border-red-200 rounded-full transition-colors border shadow-inner">
                  <svg className="w-5 h-5 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
               </div>
               <span className="text-[9px] font-black mt-1.5 uppercase tracking-widest">Moje Konto</span>
             </Link>
          </nav>
        </div>
      </header>
      
      <MegaMenu />

      <main className="max-w-7xl mx-auto px-4 py-8 lg:py-12 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* MENU BOCZNE KONTA - WSPÓLNE DLA WSZYSTKICH ZAKŁADEK */}
          <aside className="w-full lg:w-1/4 shrink-0">
             <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm sticky top-8">
                <div className="border-b border-slate-100 pb-6 mb-6 text-center">
                   <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl shadow-inner border border-slate-200">👨‍🌾</div>
                   <h2 className="font-black text-lg text-slate-900 leading-tight">{MOCK_USER.name}</h2>
                   <p className="text-xs text-slate-500 font-bold mt-1">{MOCK_USER.company}</p>
                </div>
                
                <nav className="space-y-2">
                   <Link href="/konto" className={navLinkClass('/konto')}>
                     <span className="text-lg">📊</span> Pulpit i Skarbonka
                   </Link>
                   <Link href="/konto/zamowienia" className={navLinkClass('/konto/zamowienia')}>
                     <span className="text-lg">📦</span> Moje zamówienia
                   </Link>
                   <Link href="/konto/garaz" className={navLinkClass('/konto/garaz')}>
                     <span className="text-lg">🚜</span> Mój Garaż Maszyn
                   </Link>
                   <Link href="/konto/zwroty" className={navLinkClass('/konto/zwroty')}>
                     <span className="text-lg">🔄</span> Zwroty i Reklamacje
                   </Link>
                   <Link href="/konto/ustawienia" className={navLinkClass('/konto/ustawienia')}>
                     <span className="text-lg">⚙️</span> Ustawienia Konta
                   </Link>
                   <button className="w-full mt-4 flex items-center gap-3 text-slate-400 hover:text-red-600 font-bold text-[11px] uppercase tracking-widest p-4 rounded-xl transition-colors border-t border-slate-50">
                     <span className="text-lg">🚪</span> Wyloguj się
                   </button>
                </nav>
             </div>
          </aside>

          {/* DYNAMICZNA TREŚĆ STRON WSTRZYKIWANA TUTAJ */}
          <div className="w-full lg:w-3/4 flex flex-col gap-8">
             {children}
          </div>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}