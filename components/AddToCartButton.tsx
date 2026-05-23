'use client';

import React from 'react';
import { useCart } from '@/store/useCart';

export default function AddToCartButton({ product, mainImageUrl }: { product: any, mainImageUrl: string }) {
  const { addItem } = useCart();

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: mainImageUrl || '',
      quantity: 1
    });
  };

  return (
    <button 
      onClick={handleAddToCart}
      className="w-full bg-slate-900 text-white py-6 rounded-[24px] font-black text-lg uppercase tracking-widest hover:bg-red-600 transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-slate-900/20 flex items-center justify-center gap-3"
    >
      <span>DODAJ DO KOSZYKA</span>
      <span className="text-2xl">➔</span>
    </button>
  );
}