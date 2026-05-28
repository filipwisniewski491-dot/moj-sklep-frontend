'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import MegaMenu from '@/components/MegaMenu';
import MobileBottomNav from '@/components/MobileBottomNav';
import { useCart } from '@/store/useCart';

export default function OrdersPage() {
  const { items } = useCart();
  const cartValue = items?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || 0;
  const freeShippingThreshold = 500;
  const progressPercent = Math.min((cartValue / freeShippingThreshold) * 100, 100);

  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setOrders([]); 
      } catch (error) {
        console.error("Błąd pobierania zamówień", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

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
          Moje Zamówienia
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-1/4 shrink-0">
             <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm sticky top-8">
                <nav className="space-y-2">
                   <Link href="/konto" className="flex items-center gap-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-bold text-[11px] uppercase tracking-widest p-4 rounded-xl transition-colors">
                     <span className="text-lg">📊</span> Pulpit i Skarbonka
                   </Link>
                   <Link href="/konto/zamowienia" className="flex items-center gap-3 bg-red-50 text-red-700 font-black text-[11px] uppercase tracking-widest p-4 rounded-xl border border-red-100">
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
                </nav>
             </div>
          </aside>

          <div className="w-full lg:w-3/4">
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm min-h-[400px]">
               {isLoading ? (
                 <div className="w-full h-full flex flex-col items-center justify-center py-20 text-slate-400">
                   <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                   <p className="font-bold text-xs uppercase tracking-widest">Wczytywanie historii...</p>
                 </div>
               ) : orders.length === 0 ? (
                 <div className="w-full h-full flex flex-col items-center justify-center py-20 text-center">
                   <div className="text-6xl mb-4 grayscale opacity-50">📦</div>
                   <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Brak zamówień</h2>
                   <p className="text-slate-500 font-medium text-sm mb-6 max-w-md">
                     Wygląda na to, że nie złożyłeś jeszcze żadnego zamówienia w naszym sklepie.
                   </p>
                   <Link href="/kategorie" className="bg-slate-900 hover:bg-red-600 text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md">
                     Przejdź do katalogu ➔
                   </Link>
                 </div>
               ) : (
                 <div className="space-y-6">
                   {orders.map((order: any) => (
                      <div key={order.id} className="border border-slate-200 rounded-2xl p-6 hover:border-red-200 transition-colors"></div>
                   ))}
                 </div>
               )}
            </div>
          </div>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}