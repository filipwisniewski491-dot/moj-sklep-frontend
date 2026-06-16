'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MOCK_USER } from './layout';

const LOYALTY_TIERS = [
  { name: 'Standard', minSpent: 0, discount: '0%' },
  { name: 'Brązowy Partner', minSpent: 2000, discount: '2%' },
  { name: 'Srebrny Partner', minSpent: 5000, discount: '3%' },
  { name: 'Złoty Partner', minSpent: 10000, discount: '5%' },
  { name: 'Platynowy Partner', minSpent: 15000, discount: '7%' },
  { name: 'Diamentowy Partner', minSpent: 25000, discount: '9%' },
  { name: 'Konto Hurtowe', minSpent: 50000, discount: '10%' },
  { name: 'Partner VIP', minSpent: 100000, discount: '15%' }
];

export default function AccountDashboardPage() {
  const tierProgress = Math.min((MOCK_USER.currentSpent / MOCK_USER.nextTierGoal) * 100, 100);
  const [showRules, setShowRules] = useState(false);

  return (
    <>
      <h1 className="text-3xl md:text-4xl font-black uppercase text-slate-900 tracking-tight mb-2">Panel Klienta</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-emerald-600 rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl border border-emerald-500">
           <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-emerald-400 rounded-full blur-[80px] opacity-30 -mr-10 -mt-10"></div>
           <div className="relative z-10">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-100 mb-2 flex items-center gap-2">
               <span className="text-white text-lg">📈</span> Zaoszczędziłeś już
             </h3>
             <div className="flex items-baseline gap-1 mb-4">
               <span className="text-5xl font-black tracking-tighter">{MOCK_USER.totalSavedLifetime.toFixed(2)}</span>
               <span className="text-xl font-bold text-emerald-200">zł</span>
             </div>
             
             <div className="space-y-2 border-t border-emerald-500/50 pt-4 mt-2">
                <div className="flex justify-between items-center text-xs font-medium text-emerald-50">
                   <span>Stałe rabaty statusu:</span>
                   <span className="font-black text-white">{MOCK_USER.savedFromTier.toFixed(2)} zł</span>
                </div>
                <div className="flex justify-between items-center text-xs font-medium text-emerald-50">
                   <span>Odebrane ze Skarbonki:</span>
                   <span className="font-black text-white">{MOCK_USER.savedFromCashback.toFixed(2)} zł</span>
                </div>
             </div>
           </div>
         </div>

         <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl">
           <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-red-600 rounded-full blur-[80px] opacity-30 -mr-10 -mt-10"></div>
           <div className="relative z-10">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
               <span className="text-red-500 text-lg">💰</span> Skarbonka Warsztatowa
             </h3>
             <div className="flex items-baseline gap-1 mb-2">
               <span className="text-5xl font-black tracking-tighter">{MOCK_USER.cashbackBalance.toFixed(2)}</span>
               <span className="text-xl font-bold text-slate-400">zł</span>
             </div>
             <p className="text-[11px] text-slate-300 font-medium mb-6 leading-snug">
               Z każdego opłaconego zamówienia 2% wraca tutaj. Środki gotowe do użycia przy następnych zakupach.
             </p>
             <Link href="/kategorie" className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-black text-[10px] uppercase tracking-widest px-6 py-3.5 rounded-xl transition-colors">
               Wykorzystaj w sklepie ➔
             </Link>
           </div>
         </div>
      </div>

      <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm relative overflow-hidden">
         <div className="flex justify-between items-start mb-6">
           <div>
             <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
               <span className="text-amber-500 text-lg">🏆</span> Status Twojego Konta
             </h3>
             <div className="flex items-center gap-4">
               <span className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">{MOCK_USER.tier}</span>
               <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-sm border border-amber-200">
                 Rabat -3%
               </span>
             </div>
           </div>
           <button 
             onClick={() => setShowRules(!showRules)} 
             className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-600 transition-colors bg-slate-50 px-4 py-2 rounded-lg border border-slate-200"
           >
             {showRules ? "Ukryj zasady" : "Zobacz zasady ➔"}
           </button>
         </div>
         
         <div className="mb-2 flex justify-between text-[10px] font-bold text-slate-500 uppercase">
            <span>Wydano łącznie: {MOCK_USER.currentSpent} zł</span>
            <span>Cel: Złoty Partner ({MOCK_USER.nextTierGoal} zł)</span>
         </div>
         <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner mb-4">
            <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full" style={{ width: `${tierProgress}%` }}></div>
         </div>
         <p className="text-xs text-slate-600 font-medium">Brakuje Ci jeszcze <strong>{(MOCK_USER.nextTierGoal - MOCK_USER.currentSpent).toFixed(2)} zł</strong> aby zyskać stały rabat <strong className="text-slate-900">5% na wszystkie części</strong>.</p>

         {showRules && (
           <div className="mt-8 pt-8 border-t border-slate-100 animate-in fade-in slide-in-from-top-4 duration-300">
             <h4 className="font-black text-sm uppercase text-slate-900 mb-6">Jak to działa w 3 prostych krokach?</h4>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
               <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                 <span className="text-2xl mb-2 block">🛒</span>
                 <h5 className="font-black text-[11px] uppercase tracking-widest text-slate-900 mb-1">1. Kupujesz i płacisz</h5>
                 <p className="text-xs text-slate-600 font-medium">Robisz zakupy na gospodarstwo. Wartość zakupów automatycznie sumuje się na Twoim koncie.</p>
               </div>
               <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                 <span className="text-2xl mb-2 block">💰</span>
                 <h5 className="font-black text-[11px] uppercase tracking-widest text-slate-900 mb-1">2. 2% wraca do Skarbonki</h5>
                 <p className="text-xs text-slate-600 font-medium">Niezależnie od poziomu, zawsze 2% wartości każdego zamówienia wraca do Ciebie w formie środków na kolejne zakupy.</p>
               </div>
               <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                 <span className="text-2xl mb-2 block">⭐</span>
                 <h5 className="font-black text-[11px] uppercase tracking-widest text-slate-900 mb-1">3. Zdobywasz Stały Rabat</h5>
                 <p className="text-xs text-slate-600 font-medium">Przekraczasz progi z tabeli poniżej i zyskujesz wieczny rabat (nawet do -15%) przypisany na stałe do Twojego NIPu.</p>
               </div>
             </div>

             <h4 className="font-black text-sm uppercase text-slate-900 mb-4">Tabela Poziomów Lojalnościowych</h4>
             <div className="overflow-hidden rounded-2xl border border-slate-200">
               <table className="w-full text-left text-sm">
                 <thead className="bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest">
                   <tr>
                     <th className="p-4">Status Konta</th>
                     <th className="p-4">Wydana kwota (od)</th>
                     <th className="p-4 text-right">Twój stały rabat</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 bg-white">
                   {LOYALTY_TIERS.map((tier, idx) => {
                     const isCurrent = MOCK_USER.tier === tier.name;
                     return (
                       <tr key={idx} className={`transition-colors ${isCurrent ? 'bg-amber-50/50' : 'hover:bg-slate-50'}`}>
                         <td className="p-4 font-bold text-slate-900 flex items-center gap-2">
                           {isCurrent && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>}
                           {tier.name}
                         </td>
                         <td className="p-4 text-slate-600 font-medium">{tier.minSpent.toLocaleString('pl-PL')} zł</td>
                         <td className="p-4 text-right font-black text-red-600">{tier.discount}</td>
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
             </div>
           </div>
         )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex flex-col">
           <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-black uppercase text-slate-900">Ostatnie zamówienia</h3>
             <Link href="/konto/zamowienia" className="text-[10px] font-black text-red-600 uppercase tracking-widest hover:underline">Wszystkie ➔</Link>
           </div>
           
           <div className="space-y-4 flex-1">
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
             <Link href="/konto/garaz" className="border-2 border-dashed border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-900 font-black text-[10px] uppercase tracking-widest p-4 rounded-2xl transition-all flex items-center justify-center gap-2 mt-2">
               <span className="text-lg">+</span> Dodaj kolejną maszynę
             </Link>
           </div>
        </div>
      </div>
    </>
  );
}