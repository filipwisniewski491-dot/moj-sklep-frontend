'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/store/useCart';
import { getUserTier } from '@/lib/cashbackEngine';

export default function StickyBottomBuy({ product, mainImageUrl }: { product: any, mainImageUrl: string | null }) {
  const [showSticky, setShowSticky] = useState(false);
  const { addItem, setIsOpen } = useCart();
  const { currentTier } = getUserTier(105000);

  const numPrice = typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0;
  const priceAfterDiscount = numPrice * (1 - currentTier.discountPercent);
  const [mainPrice, centsPrice] = priceAfterDiscount.toFixed(2).split('.');
  const hasCents = centsPrice !== '00';

  useEffect(() => {
    const handleScroll = () => {
      setShowSticky(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll(); 
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAddToCartMain = () => {
    addItem({ id: product.id || product.sku || 'main', name: product.name, price: priceAfterDiscount, image: mainImageUrl || '', quantity: 1, crossSell: [], category: '' });
    setIsOpen(true);
  };

  return (
    <div className={`fixed bottom-[calc(env(safe-area-inset-bottom,0px)+60px)] md:bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-5px_20px_rgba(0,0,0,0.08)] z-40 transform transition-transform duration-300 px-4 py-2.5 md:py-3.5 ${showSticky ? 'translate-y-0' : 'translate-y-[150%] md:translate-y-[120%]'}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="hidden md:flex items-center gap-4">
          {mainImageUrl && (
            <div className="relative w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
              <img src={mainImageUrl.includes('b-cdn.net') ? `${mainImageUrl.split('?')[0]}?width=100&format=webp&quality=65` : mainImageUrl} alt={product.name} className="w-full h-full object-contain p-1 mix-blend-multiply" />
            </div>
          )}
          <div>
            <p className="text-sm font-black text-slate-900 line-clamp-1 max-w-sm tracking-tight">{product.name}</p>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">SKU: {product.sku}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto justify-between md:justify-end">
          <div className="hidden lg:flex items-center gap-2 border-r pr-6 border-slate-100 text-[11px] text-slate-600 font-bold">
             📞 Zadzwoń: <span className="font-black text-slate-900">+48 500 600 700</span>
          </div>
          
          <div className="text-left md:text-right shrink-0">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Cena z VAT:</p>
            <div className="flex items-baseline gap-0.5">
              <span className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{mainPrice}</span>
              {hasCents && <span className="text-sm font-bold text-slate-600 leading-none">.{centsPrice}</span>}
              <span className="text-xs font-bold text-slate-600 ml-0.5 leading-none">zł</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => console.log('Szybki BLIK')} className="hidden md:flex relative z-50 bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] uppercase tracking-widest px-4 py-4 rounded-xl transition-all shadow-md items-center justify-center gap-1.5 cursor-pointer">
               <span className="bg-white text-black px-1.5 py-0.5 rounded text-[9px] italic leading-none">BLIK</span>
            </button>
            
            <button onClick={handleAddToCartMain} className="relative z-50 bg-red-600 hover:bg-red-700 text-white font-black text-[11px] md:text-xs uppercase tracking-widest px-6 md:px-8 py-3.5 md:py-4 rounded-xl transition-all shadow-lg shadow-red-600/30 shrink-0 hover:scale-[1.02] active:scale-95 cursor-pointer">
              DODAJ <span className="hidden sm:inline">DO KOSZYKA</span> ➔
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}