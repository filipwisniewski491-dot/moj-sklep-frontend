'use client';

import React, { useState } from 'react';
import { MOCK_USER } from '../layout';

export default function AccountSettingsPage() {
  const [isFetchingGus, setIsFetchingGus] = useState(false);

  const handleFetchGus = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsFetchingGus(true);
    setTimeout(() => {
      setIsFetchingGus(false);
    }, 1500);
  };

  return (
    <>
      <h1 className="text-3xl md:text-4xl font-black uppercase text-slate-900 tracking-tight mb-8">
        Ustawienia Konta
      </h1>

      <div className="flex flex-col gap-8">
        <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
           <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
             <h2 className="text-xl font-black uppercase text-slate-900">Dane do faktury</h2>
             <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md">Zweryfikowane</span>
           </div>

           <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
    </>
  );
}