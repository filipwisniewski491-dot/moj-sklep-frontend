'use client';
import React, { useState, useEffect } from 'react';
import { useCart } from '@/store/useCart';
import Link from 'next/link';

export default function CartPage() {
  const { items, removeItem, addItem, totalPrice } = useCart() as any;
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minut w sekundach
  const [isCrossSellAdded, setIsCrossSellAdded] = useState(false);

  // Licznik rezerwacji
  useEffect(() => {
    if (items.length === 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [items.length]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAddCrossSell = () => {
    addItem({
      id: 'cross-sell-zmywacz',
      name: 'Zmywacz uniwersalny (Brake Cleaner) 500ml',
      price: 12.50,
      image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=200&auto=format&fit=crop', // Przykładowe zdjęcie
      quantity: 1,
    });
    setIsCrossSellAdded(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <header className="bg-white border-b py-6 px-4 mb-6 shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-red-600 font-black uppercase text-xs hover:underline">← Kontynuuj zakupy</Link>
          <h1 className="text-xl font-black uppercase tracking-tighter">Twój Koszyk</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4">
        {items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-slate-300 shadow-sm">
            <div className="text-6xl mb-6 animate-bounce">🚜</div>
            <h2 className="text-2xl font-black mb-4 uppercase tracking-tight">Twój koszyk jest pusty</h2>
            <p className="text-slate-500 mb-8 font-medium">Czas uzupełnić zapasy w gospodarstwie!</p>
            <Link href="/kategorie" className="bg-red-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg hover:shadow-red-600/30 inline-block active:scale-95">Wróć do sklepu ➔</Link>
          </div>
        ) : (
          <>
            {/* Pasek rezerwacji FOMO */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 flex items-center justify-center gap-3 shadow-sm transition-opacity">
               <span className="text-amber-500 text-xl animate-pulse">⏳</span>
               <p className="text-[11px] md:text-xs font-black uppercase tracking-widest text-amber-800">
                 Ceny i stany magazynowe zarezerwowane przez: <span className="text-red-600 ml-1 text-sm">{formatTime(timeLeft)}</span>
               </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              
              <div className="lg:col-span-2 space-y-6">
                {/* LISTA PRODUKTÓW */}
                <div className="space-y-4">
                  {items.map((item: any) => (
                    <div key={item.id} className="bg-white p-4 md:p-6 rounded-[32px] border border-slate-100 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 shadow-sm group">
                      <div className="w-24 h-24 bg-slate-50 rounded-2xl border border-slate-100 p-2 shrink-0 flex items-center justify-center">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="max-w-full max-h-full object-contain mix-blend-multiply" />
                        ) : (
                          <span className="text-[8px] font-black uppercase text-slate-300">Brak</span>
                        )}
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <h3 className="font-bold text-slate-800 leading-tight text-sm">{item.name}</h3>
                        <p className="text-slate-400 font-black uppercase tracking-widest text-[9px] mt-2 bg-slate-50 inline-block px-2 py-1 rounded">Ilość: {item.quantity} szt.</p>
                      </div>
                      <div className="text-center sm:text-right w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end border-t sm:border-0 border-slate-50 pt-3 sm:pt-0 mt-2 sm:mt-0">
                        <p className="font-black text-xl tracking-tighter text-slate-900">{(item.price * item.quantity).toFixed(2)} <span className="text-[10px] text-slate-500 uppercase">zł</span></p>
                        <button onClick={() => removeItem(item.id)} className="text-slate-400 hover:text-red-600 text-[10px] font-black uppercase tracking-widest mt-2 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-red-50 transition-colors">✕ Usuń</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* MODUŁ ONE-CLICK CROSS-SELL */}
                {!isCrossSellAdded && (
                  <div className="bg-slate-900 rounded-[32px] p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-center gap-6">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-600 rounded-full blur-3xl opacity-20"></div>
                    <div className="w-20 h-20 bg-white rounded-2xl shrink-0 flex items-center justify-center overflow-hidden border-2 border-slate-700">
                      <img src="https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=200&auto=format&fit=crop" alt="Zmywacz" className="w-full h-full object-cover opacity-90" />
                    </div>
                    <div className="flex-1 text-center sm:text-left relative z-10">
                      <p className="text-amber-400 text-[9px] font-black uppercase tracking-widest mb-1">Produkt Impulsowy</p>
                      <h4 className="font-bold text-sm mb-1 leading-tight">Zmywacz uniwersalny (Brake Cleaner) 500ml</h4>
                      <p className="text-slate-400 text-xs font-medium">Brakujący element w każdym warsztacie. Wrzucasz za jednym zamachem?</p>
                    </div>
                    <div className="text-center sm:text-right shrink-0 relative z-10 w-full sm:w-auto">
                      <p className="font-black text-2xl text-white mb-2">12.50 <span className="text-[10px] text-slate-400 uppercase">zł</span></p>
                      <button onClick={handleAddCrossSell} className="w-full sm:w-auto bg-red-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 transition-transform active:scale-95 shadow-md">
                        + Dodaj do koszyka
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* PODSUMOWANIE (SIDEBAR) */}
              <div className="bg-white border border-slate-200 p-8 rounded-[40px] h-fit sticky top-28 shadow-xl">
                <h3 className="text-[11px] font-black mb-6 uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-4">Podsumowanie</h3>
                <div className="space-y-4 mb-8 text-sm font-bold">
                  <div className="flex justify-between text-slate-600">
                    <span>Wartość produktów:</span>
                    <span className="text-slate-900">{totalPrice.toFixed(2)} zł</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Dostawa:</span>
                    <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md tracking-widest uppercase text-[9px]">Wyliczana w kasie</span>
                  </div>
                  <div className="pt-6 border-t border-dashed border-slate-200 flex justify-between items-end">
                    <span className="font-black text-slate-900 uppercase text-[10px] tracking-widest mb-1">Łącznie brutto:</span>
                    <span className="text-4xl font-black text-slate-900 tracking-tighter">{totalPrice.toFixed(2)} <span className="text-sm text-slate-400 font-bold uppercase">zł</span></span>
                  </div>
                </div>
                <Link href="/kasa" className="w-full flex justify-center items-center bg-red-600 py-5 rounded-2xl font-black text-[11px] md:text-sm uppercase tracking-widest text-white hover:bg-red-700 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-red-600/30">
                  DALEJ DO DOSTAWY ➔
                </Link>
                <div className="mt-6 flex flex-wrap justify-center gap-3 items-center opacity-60 grayscale">
                  <img src="https://centrumrolnictwa-cdn.b-cdn.net/logo/blik.svg" alt="BLIK" className="h-4 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Szybkie płatności i pobranie</span>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}