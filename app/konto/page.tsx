'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import MegaMenu from '@/components/MegaMenu';
import MobileBottomNav from '@/components/MobileBottomNav';
import { useCart } from '@/store/useCart';

// Mockowane dane użytkownika (do czasu wpięcia backendu)
const MOCK_USER = {
  name: "Jan Kowalski",
  company: "Gospodarstwo Rolne Kowalski",
  tier: "Srebrny Partner",
  cashbackBalance: 124.50, // Złotówki w skarbonce
  nextTierGoal: 5000,
  currentSpent: 3850,
  savedVehicles: [
    { id: 1, make: "Ursus", model: "C-360" },
    { id: 2, make: "Zetor", model: "7211" }
  ],
  recentOrders: [
    { id: "CR-2026-1042", date: "24.05.2026", total: 450.00, status: "Wysłane", cashback: 9.00 },
    { id: "CR-2026-0988", date: "12.04.2026", total: 1250.00, status: "Dostarczone", cashback: 25.00 }
  ]
};

export default function AccountPage() {
  const { items } = useCart();
  const cartValue = items?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || 0;
  const freeShippingThreshold = 500;
  const progressPercent = Math.min((cartValue / freeShippingThreshold) * 100, 100);
  
  const tierProgress = Math.min((MOCK_USER.currentSpent / MOCK_USER.nextTierGoal) * 100, 100);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 md:pb-0">
      {/* GLOBALNY HEADER */}
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
            <div className="hidden xl:block text-right mr-4">
               <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">
                 Do darmowej: <span className="text-red-600 font-black">{Math.max(0, freeShippingThreshold - cartValue).toFixed(2)} zł</span>
               </p>
               <div className="w-40 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                 <div className="h-full bg-red-600 transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
               </div>
            </div>
            <Link href="/konto" aria-label="Twoje Konto" className="flex flex-col items-center cursor-pointer text-red-600 transition-all group">
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
          Panel Klienta
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* MENU BOCZNE KONTA */}
          <aside className="w-full lg:w-1/4 shrink-0">
             <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm sticky top-8">
                <div className="border-b border-slate-100 pb-6 mb-6 text-center">
                   <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl shadow-inner border border-slate-200">
                     👨‍🌾
                   </div>
                   <h2 className="font-black text-lg text-slate-900 leading-tight">{MOCK_USER.name}</h2>
                   <p className="text-xs text-slate-500 font-bold mt-1">{MOCK_USER.company}</p>
                </div>
                
                <nav className="space-y-2">
                   <Link href="/konto" className="flex items-center gap-3 bg-red-50 text-red-700 font-black text-[11px] uppercase tracking-widest p-4 rounded-xl border border-red-100">
                     <span className="text-lg">📊</span> Pulpit i Skarbonka
                   </Link>
                   <Link href="/konto/zamowienia" className="flex items-center gap-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-bold text-[11px] uppercase tracking-widest p-4 rounded-xl transition-colors">
                     <span className="text-lg">📦</span> Moje zamówienia
                   </Link>
                   <Link href="/konto/garaz" className="flex items-center gap-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-bold text-[11px] uppercase tracking-widest p-4 rounded-xl transition-colors">
                     <span className="text-lg">🚜</span> Mój Garaż Maszyn
                   </Link>
                   <Link href="/konto/zwroty" className="flex items-center gap-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-bold text-[11px] uppercase tracking-widest p-4 rounded-xl transition-colors">
                     <span className="text-lg">🔄</span> Zwroty i Reklamacje
                   </Link>
                   <Link href="/konto/ustawienia" className="flex items-center gap-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-bold text-[11px] uppercase tracking-widest p-4 rounded-xl transition-colors">
                     <span className="text-lg">⚙️</span> Ustawienia Konta
                   </Link>
                   <button className="w-full mt-4 flex items-center gap-3 text-slate-400 hover:text-red-600 font-bold text-[11px] uppercase tracking-widest p-4 rounded-xl transition-colors border-t border-slate-50">
                     <span className="text-lg">🚪</span> Wyloguj się
                   </button>
                </nav>
             </div>
          </aside>

          {/* GŁÓWNA ZAWARTOŚĆ DASHBOARDU */}
          <div className="w-full lg:w-3/4 flex flex-col gap-8">
            
            {/* WIDGETY GÓRNE: SKARBONKA I STATUS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               
               {/* Skarbonka (Cashback) */}
               <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl">
                 <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-red-600 rounded-full blur-[80px] opacity-30 -mr-10 -mt-10"></div>
                 <div className="relative z-10">
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                     <span className="text-emerald-400 text-lg">💰</span> Skarbonka Warsztatowa
                   </h3>
                   <div className="flex items-baseline gap-1 mb-2">
                     <span className="text-5xl font-black tracking-tighter">{MOCK_USER.cashbackBalance.toFixed(2)}</span>
                     <span className="text-xl font-bold text-slate-400">zł</span>
                   </div>
                   <p className="text-xs text-slate-300 font-medium mb-6">Zgromadzone środki gotowe do obniżenia kwoty Twojego następnego zamówienia.</p>
                   <Link href="/kategorie" className="inline-block bg-red-600 hover:bg-red-500 text-white font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-xl transition-colors">
                     Wykorzystaj środki ➔
                   </Link>
                 </div>
               </div>

               {/* Grywalizacja B2B (Status Klienta) */}
               <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm relative overflow-hidden">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
                   <span className="text-amber-500 text-lg">🏆</span> Status Konta
                 </h3>
                 <div className="flex justify-between items-end mb-4">
                    <span className="text-2xl font-black text-slate-900 uppercase tracking-tight">{MOCK_USER.tier}</span>
                    <span className="bg-amber-100 text-amber-800 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md">Stały Rabat: 2%</span>
                 </div>
                 
                 <div className="mb-2 flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                    <span>Wydano: {MOCK_USER.currentSpent} zł</span>
                    <span>Cel: Złoty Partner ({MOCK_USER.nextTierGoal} zł)</span>
                 </div>
                 <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner mb-4">
                    <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full" style={{ width: `${tierProgress}%` }}></div>
                 </div>
                 <p className="text-xs text-slate-600 font-medium">Brakuje Ci jeszcze <strong>{(MOCK_USER.nextTierGoal - MOCK_USER.currentSpent).toFixed(2)} zł</strong> aby zyskać stały rabat <strong className="text-slate-900">5% na wszystkie części</strong> oraz darmowe zwroty kurierem.</p>
               </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* OSTATNIE ZAMÓWIENIA */}
              <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
                 <div className="flex justify-between items-center mb-6">
                   <h3 className="text-lg font-black uppercase text-slate-900">Ostatnie zamówienia</h3>
                   <Link href="/konto/zamowienia" className="text-[10px] font-black text-red-600 uppercase tracking-widest hover:underline">Wszystkie ➔</Link>
                 </div>
                 
                 <div className="space-y-4">
                   {MOCK_USER.recentOrders.map((order, idx) => (
                     <div key={idx} className="flex justify-between items-center p-4 rounded-2xl border border-slate-100 hover:border-red-100 hover:bg-red-50/30 transition-colors group">
                       <div>
                         <p className="text-[11px] font-black uppercase text-slate-900 mb-0.5">{order.id}</p>
                         <p className="text-[10px] text-slate-500 font-bold mb-1">Data: {order.date}</p>
                         <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-slate-200 bg-white text-slate-600">{order.status}</span>
                       </div>
                       <div className="text-right">
                         <p className="text-sm font-black text-slate-900">{order.total.toFixed(2)} zł</p>
                         <p className="text-[9px] font-bold text-emerald-600 mt-1">+ {order.cashback.toFixed(2)} zł do skarbonki</p>
                       </div>
                     </div>
                   ))}
                 </div>
              </div>

              {/* MÓJ GARAŻ (Szybkie wyszukiwanie podzespołów) */}
              <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
                 <div className="flex justify-between items-center mb-6">
                   <h3 className="text-lg font-black uppercase text-slate-900">Mój Garaż</h3>
                   <Link href="/konto/garaz" className="text-[10px] font-black text-red-600 uppercase tracking-widest hover:underline">Zarządzaj ➔</Link>
                 </div>
                 <p className="text-xs text-slate-500 font-medium mb-5">Kliknij w maszynę, aby błyskawicznie wyfiltrować pasujące do niej części w sklepie.</p>
                 
                 <div className="grid grid-cols-1 gap-3">
                   {MOCK_USER.savedVehicles.map(vehicle => (
                     <Link key={vehicle.id} href={`/kategoria/czesci-do-ciagnikow?Pasuje+do+marki=${vehicle.make}&Pasuje+do+modelu=${vehicle.model}`} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-900 hover:bg-slate-900 hover:text-white transition-all group">
                       <div className="text-3xl grayscale group-hover:grayscale-0 transition-all">🚜</div>
                       <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-400">Twój ciągnik</p>
                         <p className="text-sm font-black uppercase">{vehicle.make} {vehicle.model}</p>
                       </div>
                       <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity font-black">➔</div>
                     </Link>
                   ))}
                   <button className="border-2 border-dashed border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-900 font-black text-[10px] uppercase tracking-widest p-4 rounded-2xl transition-all flex items-center justify-center gap-2 mt-2">
                     <span className="text-lg">+</span> Dodaj kolejną maszynę
                   </button>
                 </div>
              </div>

            </div>

          </div>
        </div>
      </main>

      <MobileBottomNav />

      <footer className="bg-slate-900 text-white py-16 border-t-4 border-red-600 pb-32 md:pb-16 mt-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12">
          <div>
            <img src="https://centrumrolnictwa-cdn.b-cdn.net/logo/logo-centrumrolnictwapl-2-1.jpeg" alt="CentrumRolnictwa Logo" className="h-10 w-auto mb-6 brightness-0 invert" loading="lazy" />
            <p className="text-[10px] font-bold text-slate-400 uppercase leading-loose tracking-widest">
              Niezawodny Sklep Rolniczy.<br/> Części, maszyny, doradztwo.
            </p>
          </div>
          <div>
             <h4 className="text-white font-black mb-6 uppercase text-[11px] tracking-widest">Obsługa Klienta</h4>
             <ul className="space-y-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <li><Link href="/konto" className="hover:text-red-500 transition-colors">Moje Konto</Link></li>
                <li><Link href="/konto/zamowienia" className="hover:text-red-500 transition-colors">Śledzenie zamówienia</Link></li>
                <li><Link href="/zwroty" className="hover:text-red-500 transition-colors">Zwroty i Reklamacje</Link></li>
             </ul>
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