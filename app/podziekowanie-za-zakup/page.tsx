'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function ThankYouPage() {
  const searchParams = useSearchParams();
  const [isAccountCreated, setIsAccountCreated] = useState(false);
  const [password, setPassword] = useState('');

  // W docelowej wersji z Medusa.js, te dane będą pobierane z API na podstawie ID zamówienia z URL
  const orderId = searchParams.get('orderId') || `CR-${Math.floor(Math.random() * 1000000)}`;
  const email = searchParams.get('email') || 'klient@gospodarstwo.pl';
  const cashbackEarned = 25.50; // Mock: Wartość wyliczona po stronie serwera

  useEffect(() => {
    // ==========================================
    // MIEJSCE NA DOCELOWĄ ANALITYKĘ (TOP 1 WORLD)
    // ==========================================
    // Tutaj docelowo dodamy useEffect, który:
    // 1. Uderzy do API Medusy po szczegóły zamówienia (orderId).
    // 2. Jeśli zamówienie ma status 'PAID' i nie było jeszcze śledzone:
    //    -> Odpali trackPurchase() ze wszystkimi parametrami
    //    -> Wyśle First-Party Data do Google Ads (Rozszerzone Konwersje)
    //    -> Odpali tagi Meta CAPI
    
    console.log(`Zdarzenie zakupu gotowe do podpięcia pod backend dla zamówienia: ${orderId}`);
    
    // Zapobieganie podwójnemu śledzeniu (np. przy odświeżeniu strony)
    // zrealizujemy zapisując flagę w localStorage lub sprawdzając status w bazie.
  }, [orderId]);

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return;
    
    // Tutaj docelowy strzał do API: POST /auth/register
    // Przekazujemy zapisany w sesji email + nowe hasło
    setIsAccountCreated(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <header className="bg-white border-b py-6 px-4 shadow-sm mb-8">
        <div className="max-w-3xl mx-auto text-center">
          <Link href="/" className="font-black text-2xl tracking-tighter text-slate-900">
            CentrumRolnictwa<span className="text-red-600">.pl</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-xl border border-slate-100 text-center relative overflow-hidden">
          
          {/* Dekoracyjne tło */}
          <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
          <div className="absolute -left-20 -top-20 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

          <div className="relative z-10">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 shadow-inner border border-emerald-200">
              ✓
            </div>
            
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-4">
              Dziękujemy za zamówienie!
            </h1>
            
            <p className="text-slate-500 font-medium text-lg mb-2">
              Twoje zamówienie nr <strong className="text-slate-900">{orderId}</strong> zostało opłacone i przekazane do magazynu.
            </p>
            <p className="text-sm text-slate-400 font-medium mb-10">
              Potwierdzenie oraz fakturę wysłaliśmy na adres: <span className="font-bold text-slate-700">{email}</span>
            </p>

            {/* SEKCJA POST-PURCHASE: Rejestracja w 1 kliknięcie */}
            {!isAccountCreated ? (
              <div className="bg-slate-900 rounded-3xl p-8 text-left text-white shadow-2xl relative overflow-hidden transform transition-all hover:-translate-y-1">
                <div className="absolute right-0 bottom-0 w-32 h-32 bg-emerald-500 rounded-full blur-[60px] opacity-20"></div>
                
                <div className="flex flex-col md:flex-row gap-6 items-center relative z-10">
                  <div className="flex-1">
                    <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-1 block">Nie trać pieniędzy</span>
                    <h3 className="text-xl font-black mb-2 leading-tight">Zarobiłeś <span className="text-emerald-400">{cashbackEarned.toFixed(2)} zł</span> cashbacku!</h3>
                    <p className="text-slate-400 text-xs font-medium">
                      Masz już u nas wpisane dane dostawy. Ustaw tylko hasło, abyśmy mogli przypisać te środki do Twojej Skarbonki na kolejne naprawy.
                    </p>
                  </div>
                  
                  <div className="w-full md:w-auto shrink-0">
                    <form onSubmit={handleCreateAccount} className="flex flex-col gap-3">
                      <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Wpisz nowe hasło..." 
                        className="w-full md:w-64 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors text-sm text-white placeholder:text-slate-500"
                        required
                        minLength={6}
                      />
                      <button 
                        type="submit" 
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black uppercase tracking-widest text-[11px] py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                      >
                        Zapisz środki i załóż konto
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 flex items-center justify-center gap-4 animate-in fade-in zoom-in duration-500">
                <span className="text-3xl">🎉</span>
                <div className="text-left">
                  <p className="text-emerald-900 font-black uppercase tracking-widest text-sm mb-1">Konto aktywne!</p>
                  <p className="text-emerald-700 text-xs font-bold">Środki zostały dodane do Twojej Skarbonki.</p>
                </div>
              </div>
            )}

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-slate-100 pt-12 text-left">
              <div>
                <span className="text-2xl mb-3 block">📦</span>
                <h4 className="font-black uppercase tracking-widest text-[11px] text-slate-900 mb-1">Pakowanie</h4>
                <p className="text-xs text-slate-500 font-medium">Nasi magazynierzy właśnie kompletują Twoje części.</p>
              </div>
              <div>
                <span className="text-2xl mb-3 block">🚚</span>
                <h4 className="font-black uppercase tracking-widest text-[11px] text-slate-900 mb-1">Wysyłka</h4>
                <p className="text-xs text-slate-500 font-medium">Paczka zostanie przekazana kurierowi dzisiaj o 15:00.</p>
              </div>
              <div>
                <span className="text-2xl mb-3 block">📱</span>
                <h4 className="font-black uppercase tracking-widest text-[11px] text-slate-900 mb-1">Śledzenie</h4>
                <p className="text-xs text-slate-500 font-medium">Otrzymasz SMS z linkiem do śledzenia trasy kuriera.</p>
              </div>
            </div>

            <div className="mt-12">
              <Link href="/" className="inline-block bg-slate-100 hover:bg-slate-200 text-slate-800 font-black uppercase tracking-widest text-xs px-8 py-4 rounded-xl transition-colors">
                Wróć na stronę główną
              </Link>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}