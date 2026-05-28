'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import MegaMenu from '@/components/MegaMenu';
import MobileBottomNav from '@/components/MobileBottomNav';
import { useCart } from '@/store/useCart';

// Mockowane dane użytkownika
const MOCK_USER = {
  name: "Jan Kowalski",
  company: "Gospodarstwo Rolne Kowalski",
  email: "jan.kowalski@przyklad.pl",
  phone: "+48 123 456 789",
  nip: "1234567890",
  address: "ul. Rolna 12",
  city: "Agrograd",
  zip: "00-123"
};

export default function AccountSettingsPage() {
  const { items } = useCart();
  const cartValue = items?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || 0;
  const freeShippingThreshold = 500;
  const progressPercent = Math.min((cartValue / freeShippingThreshold) * 100, 100);

  const [isFetchingGus, setIsFetchingGus] = useState(false);

  // Symulacja pobierania z GUS
  const handleFetchGus = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsFetchingGus(true);
    setTimeout(() => {
      setIsFetchingGus(false);
      // Tutaj w przyszłości podepniemy uzupełnianie formularza z API
    }, 1500);
  };

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
          Ustawienia Konta
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
                   <Link href="/konto" className="flex items-center gap-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-bold text-[11px] uppercase tracking-widest p-4 rounded-xl transition-colors">
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
                   <Link href="/konto/ustawienia" className="flex items-center gap-3 bg-red-50 text-red-700 font-black text-[11px] uppercase tracking-widest p-4 rounded-xl border border-red-100">
                     <span className="text-lg">⚙️</span> Ustawienia Konta
                   </Link>
                   <button className="w-full mt-4 flex items-center gap-3 text-slate-400 hover:text-red-600 font-bold text-[11px] uppercase tracking-widest p-4 rounded-xl transition-colors border-t border-slate-50">
                     <span className="text-lg">🚪</span> Wyloguj się
                   </button>
                </nav>
             </div>
          </aside>

          {/* GŁÓWNA ZAWARTOŚĆ USTAWIEŃ */}
          <div className="w-full lg:w-3/4 flex flex-col gap-8">
            
            {/* 1. DANE FIRMY / FAKTUROWE */}
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
               <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
                 <h2 className="text-xl font-black uppercase text-slate-900">Dane do faktury</h2>
                 <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md">Zweryfikowane</span>
               </div>

               <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Moduł NIP z integracją GUS */}
                 <div className="md:col-span-2">
                   <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Numer NIP</label>
                   <div className="flex flex-col sm:flex-row gap-3">
                     <input type="text" defaultValue={MOCK_USER.nip} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:border-red-600 transition-colors text-slate-900" placeholder="Wpisz NIP firmy..." />
                     <button onClick={handleFetchGus} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md flex items-center justify-center min-w-[160px]">
                       {isFetchingGus ? (
                         <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                       ) : (
                         "Pobierz dane z GUS"
                       )}
                     </button>
                   </div>
                   <p className="text-[10px] text-slate-400 mt-2 font-medium">Podaj NIP i kliknij przycisk, a system automatycznie wypełni formularz aktualnymi danymi z bazy GUS.</p>
                 </div>

                 <div className="md:col-span-2">
                   <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Pełna nazwa firmy</label>
                   <input type="text" defaultValue={MOCK_USER.company} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:border-red-600 transition-colors text-slate-900" />
                 </div>

                 <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Ulica i numer</label>
                   <input type="text" defaultValue={MOCK_USER.address} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:border-red-600 transition-colors text-slate-900" />
                 </div>

                 <div className="flex gap-4">
                   <div className="w-1/3">
                     <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Kod</label>
                     <input type="text" defaultValue={MOCK_USER.zip} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:border-red-600 transition-colors text-slate-900" />
                   </div>
                   <div className="flex-1">
                     <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Miejscowość</label>
                     <input type="text" defaultValue={MOCK_USER.city} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:border-red-600 transition-colors text-slate-900" />
                   </div>
                 </div>

                 <div className="md:col-span-2 pt-4">
                   <button type="button" className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-600/30 hover:scale-[1.02] active:scale-95">
                     Zapisz dane do faktury
                   </button>
                 </div>
               </form>
            </div>

            {/* 2. KSIĄŻKA ADRESOWA */}
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
               <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
                 <h2 className="text-xl font-black uppercase text-slate-900">Książka Adresowa</h2>
                 <button className="text-[10px] font-black text-red-600 uppercase tracking-widest hover:underline">+ Dodaj nowy adres</button>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="border-2 border-slate-900 bg-slate-50 rounded-2xl p-5 relative">
                     <div className="absolute top-4 right-4 bg-slate-900 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest">Domyślny</div>
                     <h3 className="font-black text-slate-900 mb-1">Główny Warsztat</h3>
                     <p className="text-xs text-slate-600 mb-4">{MOCK_USER.name}<br/>{MOCK_USER.address}<br/>{MOCK_USER.zip} {MOCK_USER.city}</p>
                     <div className="flex gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                       <button className="hover:text-red-600 transition-colors">Edytuj</button>
                       <button className="hover:text-red-600 transition-colors">Usuń</button>
                     </div>
                  </div>

                  <div className="border border-slate-200 bg-white rounded-2xl p-5 relative hover:border-red-200 transition-colors">
                     <h3 className="font-black text-slate-900 mb-1">Dom (Inny adres)</h3>
                     <p className="text-xs text-slate-600 mb-4">Jan Kowalski<br/>ul. Słoneczna 4<br/>00-125 Agrograd</p>
                     <div className="flex gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                       <button className="hover:text-slate-900 transition-colors">Ustaw domyślny</button>
                       <button className="hover:text-red-600 transition-colors">Edytuj</button>
                     </div>
                  </div>
               </div>
            </div>

            {/* 3. DANE LOGOWANIA I KONTAKT */}
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
               <h2 className="text-xl font-black uppercase text-slate-900 mb-8 border-b border-slate-100 pb-4">Dane logowania i kontaktowe</h2>
               
               <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Adres E-mail</label>
                   <input type="email" defaultValue={MOCK_USER.email} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:border-red-600 transition-colors text-slate-900" />
                 </div>
                 <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Telefon (dla kuriera)</label>
                   <input type="tel" defaultValue={MOCK_USER.phone} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:border-red-600 transition-colors text-slate-900" />
                 </div>

                 <div className="md:col-span-2 border-t border-slate-100 pt-6 mt-2">
                   <h3 className="font-black text-sm uppercase text-slate-900 mb-4">Zmiana hasła</h3>
                 </div>
                 
                 <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Nowe hasło</label>
                   <input type="password" placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:border-red-600 transition-colors text-slate-900" />
                 </div>
                 <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Powtórz nowe hasło</label>
                   <input type="password" placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:border-red-600 transition-colors text-slate-900" />
                 </div>

                 <div className="md:col-span-2 pt-4 flex justify-between items-center">
                   <button type="button" className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md active:scale-95">
                     Zapisz zmiany
                   </button>
                   <button type="button" className="text-[10px] font-black text-red-600 uppercase tracking-widest hover:underline">
                     Usuń konto
                   </button>
                 </div>
               </form>
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