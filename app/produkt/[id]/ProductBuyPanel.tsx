'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/store/useCart';
import { getUserTier, CONSTANT_CASHBACK_PERCENT } from '@/lib/cashbackEngine';

export default function ProductBuyPanel({ product, mainImageUrl, attributes }: { product: any, mainImageUrl: string | null, attributes: any }) {
  const { addItem, setIsOpen } = useCart();
  const [timeLeftStr, setTimeLeftStr] = useState('');
  const [skuCopied, setSkuCopied] = useState(false);

  const { currentTier } = getUserTier(105000); // Mock VIP
  const numPrice = typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0;
  const priceAfterDiscount = numPrice * (1 - currentTier.discountPercent);
  const cashbackEarned = priceAfterDiscount * CONSTANT_CASHBACK_PERCENT;
  const [mainPrice, centsPrice] = priceAfterDiscount.toFixed(2).split('.');

  useEffect(() => {
    const calcTime = () => {
      const target = new Date();
      target.setHours(15, 0, 0, 0);
      if (new Date().getHours() >= 15) target.setDate(target.getDate() + 1);
      const diff = target.getTime() - new Date().getTime();
      setTimeLeftStr(`${Math.floor(diff / 3600000)}g ${Math.floor((diff % 3600000) / 60000)}m`);
    };
    calcTime();
    const interval = setInterval(calcTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleAddToCart = () => {
    addItem({ id: product.id || product.sku, name: product.name, price: priceAfterDiscount, image: mainImageUrl || '', quantity: 1, crossSell: [], category: '' });
    setIsOpen(true);
  };

  return (
    <>
      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1">
            <span className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter">{mainPrice}</span>
            <span className="text-3xl font-bold text-slate-600">.{centsPrice}</span>
            <span className="text-2xl font-bold text-slate-600 ml-1">zł</span>
          </div>
          <p className="text-emerald-600 text-[10px] font-black uppercase mt-2">💰 +{cashbackEarned.toFixed(2)} zł Cashbacku</p>
        </div>
        
        <div className="flex-1 md:max-w-[280px] flex flex-col gap-2">
          <button onClick={handleAddToCart} className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-red-700 shadow-xl shadow-red-600/30">
            DODAJ DO KOSZYKA ➔
          </button>
        </div>
      </div>

      <div className="bg-slate-50 text-slate-800 p-5 rounded-2xl mb-4 border border-slate-200">
         <p className="text-[10px] font-black uppercase text-slate-600 mb-1">📦 Ekspresowa Wysyłka</p>
         <p className="text-sm font-bold">Zamów w ciągu {timeLeftStr}, a wyślemy paczkę JESZCZE DZISIAJ!</p>
      </div>
    </>
  );
}