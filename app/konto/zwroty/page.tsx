'use client';

import React from 'react';
import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import MegaMenu from '@/components/MegaMenu';
import MobileBottomNav from '@/components/MobileBottomNav';

export default function ReturnsPage() {
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
        <h1 className="text-3xl md:text-4xl font-black uppercase text-slate-900 tracking-tight mb-8">
          Zwroty i Reklamacje
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-1/4 shrink-0">
             <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm sticky top-8">
                <nav className="space-y-2">
                   <Link href="/konto" className="flex items-center gap-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-bold text-[11px] uppercase tracking-widest p-4 rounded-xl transition-colors">
                     <span className="text-lg">📊</span> Pulpit i Skarbonka
                   </Link>
                   <Link href="/konto/zamowienia" className="flex items-center gap-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-bold text-[11px] uppercase tracking-widest p-4 rounded-xl transition-colors">
                     <span className="text-lg">📦</span> Moje zamówienia
                   </Link>
                   <Link href="/konto/garaz" className="flex items-center gap-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-bold text-[11px] uppercase tracking-widest p-4 rounded-xl transition-colors">
                     <span className="text-lg">🚜</span> Mój Garaż Maszyn
                   </Link>
                   <Link href="/konto/zwroty" className="flex items-center gap-3 bg-red-50 text-red-700 font-black text-[11px] uppercase tracking-widest p-4 rounded-xl border border-red-100">
                     <span className="text-lg">🔄</span> Zwroty i Reklamacje
                   </Link>
                   <Link href="/konto/ustawienia" className="flex items-center gap-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-bold text-[11px] uppercase tracking-widest p-4 rounded-xl transition-colors">
                     <span className="text-lg">⚙️</span> Ustawienia Konta
                   </Link>
                </nav>
             </div>
          </aside>

          <div className="w-full lg:w-3/4 flex flex-col gap-8">
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm min-h-[400px] flex flex-col items-center justify-center text-center">
               <div className="text-6xl mb-4 grayscale opacity-50">🔄</div>
               <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Brak otwartych zgłoszeń</h2>
               <p className="text-slate-500 font-medium text-sm mb-8 max-w-md">
                 Masz prawo do darmowego zwrotu nieużywanych części przez 14 dni od momentu odebrania paczki.
               </p>
               <button className="bg-slate-900 hover:bg-red-600 text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md">
                 Zgłoś nowy zwrot ➔
               </button>
            </div>
          </div>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}