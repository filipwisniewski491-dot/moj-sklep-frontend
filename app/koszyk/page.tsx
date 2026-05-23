'use client';
import React from 'react';
import { useCart } from '@/store/useCart';
import Link from 'next/link';

export default function CartPage() {
  const { items, removeItem, totalPrice } = useCart();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <header className="bg-white border-b py-6 px-4 mb-10 shadow-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-red-600 font-black uppercase">← Kontynuuj zakupy</Link>
          <h1 className="text-xl font-black uppercase tracking-tighter">Twój Koszyk</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4">
        {items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
            <div className="text-6xl mb-6">🚜</div>
            <h2 className="text-2xl font-black mb-4">Twój koszyk jest pusty</h2>
            <p className="text-slate-500 mb-8">Czas uzupełnić zapasy w gospodarstwie!</p>
            <Link href="/" className="bg-red-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-red-700 transition-all">Wróć do sklepu</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* LISTA PRODUKTÓW */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center gap-6 shadow-sm">
                  <img src={item.image} alt={item.name} className="w-24 h-24 object-contain bg-slate-50 rounded-xl" />
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 leading-tight">{item.name}</h3>
                    <p className="text-slate-400 text-xs mt-1">Sztuk: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-xl">{(item.price * item.quantity).toFixed(2)} zł</p>
                    <button onClick={() => removeItem(item.id)} className="text-red-500 text-xs font-bold uppercase mt-2 hover:underline">Usuń</button>
                  </div>
                </div>
              ))}
            </div>

            {/* PODSUMOWANIE (SIDEBAR) */}
            <div className="bg-slate-900 text-white p-8 rounded-[40px] h-fit sticky top-24 shadow-2xl">
              <h3 className="text-xl font-black mb-6 uppercase border-b border-slate-800 pb-4">Podsumowanie</h3>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-slate-400">
                  <span>Wartość produktów:</span>
                  <span>{totalPrice.toFixed(2)} zł</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Dostawa:</span>
                  <span className="text-green-400 font-bold tracking-widest uppercase text-[10px]">Gratis od VIP</span>
                </div>
                <div className="pt-4 border-t border-slate-800 flex justify-between items-end">
                  <span className="font-bold">Łącznie brutto:</span>
                  <span className="text-4xl font-black text-red-500">{totalPrice.toFixed(2)} zł</span>
                </div>
              </div>
              <button className="w-full bg-red-600 py-6 rounded-2xl font-black text-xl hover:bg-red-700 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-red-600/30">
                PRZEJDŹ DO PŁATNOŚCI
              </button>
              <p className="text-[10px] text-center mt-6 text-slate-500 uppercase tracking-widest font-bold">Bezpieczne płatności BLIK / Przelew24</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}