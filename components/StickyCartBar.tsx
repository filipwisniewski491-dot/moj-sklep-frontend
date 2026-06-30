'use client';

import React from 'react';
import { useCart } from '@/store/useCart';

// Cienki pasek "Przejdź do koszyka" - pojawia się TYLKO gdy koszyk niepusty.
// Mobile: nad dolnym menu. Desktop: na dole ekranu. Otwiera CartDrawer.
export default function StickyCartBar() {
  const { items, setIsOpen } = useCart() as any;

  const count = items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
  const value = items?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || 0;

  if (count === 0) return null;

  return (
    <button
      onClick={() => setIsOpen(true)}
      aria-label="Przejdź do koszyka"
      className="hidden md:block fixed left-0 right-0 bottom-0 z-[80] bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-[0_-4px_20px_rgba(0,0,0,0.15)] transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between">
        <span className="flex items-center gap-2 font-black text-[11px] sm:text-xs uppercase tracking-widest">
          <span className="text-base">🛒</span>
          Przejdź do koszyka
          <span className="bg-white/25 px-2 py-0.5 rounded-full text-[10px]">{count}</span>
        </span>
        <span className="flex items-center gap-2 font-black text-xs sm:text-sm tabular-nums">
          {value.toFixed(2)} zł
          <span className="text-base">→</span>
        </span>
      </div>
    </button>
  );
}