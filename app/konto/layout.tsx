'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SearchBar from '@/components/SearchBar';
import MegaMenu from '@/components/MegaMenu';
import MobileBottomNav from '@/components/MobileBottomNav';
import { useCart } from '@/store/useCart';

export const MOCK_USER = {
  name: "Jan Kowalski",
  company: "Gospodarstwo Rolne Kowalski",
  email: "jan.kowalski@przyklad.pl",
  phone: "+48 123 456 789",
  nip: "1234567890",
  address: "ul. Rolna 12",
  city: "Agrograd",
  zip: "00-123",
  tier: "Srebrny Partner",
  cashbackBalance: 124.50,
  nextTierGoal: 5000,
  currentSpent: 3850,
  totalSavedLifetime: 1450.00,
  savedFromTier: 1100.00,
  savedFromCashback: 350.00,
  savedVehicles: [
    { id: 1, make: "Ursus", model: "C-360" },
    { id: 2, make: "Zetor", model: "7211" }
  ],
  recentOrders: [
    { id: "CR-2026-1042", date: "24.05.2026", total: 450.00, status: "Wysłane", cashback: 9.00 },
    { id: "CR-2026-0988", date: "12.04.2026", total: 1250.00, status: "Dostarczone", cashback: 25.00 }
  ]
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { items } = useCart() as any;
  const cartValue = items?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || 0;
  const freeShippingThreshold = 500;
  const progressPercent = Math.min((cartValue / freeShippingThreshold) * 100, 100);

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
              <img src="https://centrumrolnictwa-cdn.b-cdn.net/logo/logo-centrumrolnictwapl-2-1.jpeg" alt="CentrumRolnictwa.pl" className="h-10 sm:h-14 md:h-20 w-auto transition-transform hover:scale-105 duration-300" />
            </Link>
          </div>
          <div className="flex-1 w-full relative z-50">
             <SearchBar />
          </div>
          <nav className="hidden md:flex items-center space-x-6 text-slate-800">
            <div className="hidden xl:block text-right mr-4">
               <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">
                 Do darmowej: <span className="text-red-600 font-black">{Math.max(0, freeShippingThreshold - cartValue).toFixed(2)} zł</span>
               </p>
               <div className="w-40 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                 <div className="h-full bg-red-600 transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
               </div>
            </div>
            <Link href="/konto" className="flex flex-col items-center cursor-pointer text-red-600 transition-all group">
              <div className="p-3 bg-red-50 border-red-200 rounded-full transition-colors border shadow-inner">
                 <span className="text-lg leading-none">👨‍🌾</span>
              </div>
              <span className="text-[9px] font-black mt-1.5 uppercase tracking-widest">Moje Konto</span>
            </Link>
          </nav>
        </div>
      </header>
      
      <MegaMenu />

      <main className="max-w-7xl mx-auto px-4 py-8 lg:py-12 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">
          
          <aside className="w-full lg:w-1/4 shrink-0">
             <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm sticky top-8">
                <div className="border-b border-slate-100 pb-6 mb-6 text-center">
                   <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl shadow-inner border border-slate-200">👨‍🌾</div>
                   <h2 className="font-black text-lg text-slate-900 leading-tight">{MOCK_USER.name}</h2>
                   <p className="text-xs text-slate-500 font-bold mt-1">{MOCK_USER.company}</p>
                </div>
                
                <nav className="space-y-2">
                   <Link href="/konto" className={navLinkClass('/konto')}><span className="text-lg">📊</span> Pulpit i Skarbonka</Link>
                   <Link href="/konto/zamowienia" className={navLinkClass('/konto/zamowienia')}><span className="text-lg">📦</span> Moje zamówienia</Link>
                   <Link href="/konto/garaz" className={navLinkClass('/konto/garaz')}><span className="text-lg">🚜</span> Mój Garaż Maszyn</Link>
                   <Link href="/konto/zwroty" className={navLinkClass('/konto/zwroty')}><span className="text-lg">🔄</span> Zwroty i Reklamacje</Link>
                   <Link href="/konto/ustawienia" className={navLinkClass('/konto/ustawienia')}><span className="text-lg">⚙️</span> Ustawienia Konta</Link>
                   <button className="w-full mt-4 flex items-center gap-3 text-slate-400 hover:text-red-600 font-bold text-[11px] uppercase tracking-widest p-4 rounded-xl transition-colors border-t border-slate-50">
                     <span className="text-lg">🚪</span> Wyloguj się
                   </button>
                </nav>
             </div>
          </aside>

          {/* DYNAMICZNA TREŚĆ PODSTRON */}
          <div className="w-full lg:w-3/4 flex flex-col gap-8">
             {children}
          </div>
        </div>
      </main>

      <MobileBottomNav />

      <footer className="bg-slate-900 text-white py-16 border-t-4 border-red-600 pb-32 md:pb-16 mt-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12">
          <div>
            <img src="https://centrumrolnictwa-cdn.b-cdn.net/logo/logo-centrumrolnictwapl-2-1.jpeg" alt="CentrumRolnictwa Logo" className="h-10 w-auto mb-6 brightness-0 invert" />
            <p className="text-[10px] font-bold text-slate-400 uppercase leading-loose tracking-widest">
              Niezawodny Sklep Rolniczy.<br/> Części, maszyny, doradztwo.
            </p>
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