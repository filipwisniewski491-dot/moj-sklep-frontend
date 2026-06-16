'use client';

import React from 'react';

export default function ReturnsPage() {
  return (
    <>
      <h1 className="text-3xl md:text-4xl font-black uppercase text-slate-900 tracking-tight mb-8">
        Zwroty i Reklamacje
      </h1>

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
    </>
  );
}