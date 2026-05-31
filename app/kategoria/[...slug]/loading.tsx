// app/[...slug]/loading.tsx
import React from 'react';

export default function Loading() {
  return (
    {/* POPRAWKA Z MARGINESEM DOLNYM (pb-36) DLA EKRANU ŁADOWANIA */}
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col items-center justify-center pb-36 md:pb-0">
      <div className="bg-white rounded-[40px] p-16 text-center border border-slate-100 shadow-xl flex flex-col items-center justify-center animate-pulse w-full max-w-md mx-4">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-50"></div>
          <span className="text-6xl relative z-10 block animate-bounce">🚜</span>
        </div>
        
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest mb-3">
          Przeszukuję magazyn...
        </h2>
        <p className="text-slate-500 font-medium text-xs max-w-xs mx-auto mb-6 uppercase tracking-wider">
          Pobieram najnowsze stany magazynowe i dopasowuję filtry do maszyn.
        </p>
        
        <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
          <div className="h-full bg-red-600 rounded-full w-full origin-left animate-[pulse_1s_ease-in-out_infinite]"></div>
        </div>
      </div>
    </div>
  );
}