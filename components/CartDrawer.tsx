'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/store/useCart';
import { getUserTier, CONSTANT_CASHBACK_PERCENT } from '@/lib/cashbackEngine';

const bunnyLoader = ({ src, width }: { src: string; width: number }) => {
  if (!src.includes('b-cdn.net')) return src;
  const cleanSrc = src.split('?')[0]; 
  return `${cleanSrc}?width=${width}&format=webp`;
};

const FREE_SHIPPING_THRESHOLD = 500;

export default function CartDrawer() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, isOpen, setIsOpen, addItem } = useCart() as any;
  const [crossSellItems, setCrossSellItems] = useState<any[]>([]);
  const [loadingCrossSell, setLoadingCrossSell] = useState(false);

  // SYMULACJA ZALOGOWANEGO KLIENTA
  const userTotalSpent = 105000; 
  const { currentTier } = getUserTier(userTotalSpent);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || items.length === 0) return;
    setCrossSellItems([
      { sku: 'FALLBACK-1', name: 'Zmywacz uniwersalny do hamulców', price: 14.99, image: '' }
    ]);
  }, [isOpen, items]);

  if (!isOpen) return null;

  const totalBrutto = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  
  // OBLICZENIA Z SILNIKA
  const discountAmount = totalBrutto * currentTier.discountPercent;
  const totalAfterDiscount = totalBrutto - discountAmount;
  const cashbackEarned = totalAfterDiscount * CONSTANT_CASHBACK_PERCENT;

  const amountToFreeShipping = FREE_SHIPPING_THRESHOLD - totalBrutto;
  const progressPercent = Math.min(100, (totalBrutto / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <div className="fixed inset-0 z-[150] animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      <div className="absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300 overflow-hidden">
        
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🛒</span>
              <h2 className="font-black text-slate-900 uppercase text-xs tracking-wider">Twój Koszyk</h2>
              <span className="bg-slate-900 text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                {items.reduce((sum: number, item: any) => sum + item.quantity, 0)} szt.
              </span>
            </div>
            {currentTier.level > 1 && (
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1">
                🏆 Twój status: {currentTier.name} (-{currentTier.discountPercent * 100}%)
              </p>
            )}
          </div>
          <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-black flex items-center justify-center transition-colors">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-white flex flex-col gap-6">
          {items.length > 0 && (
            <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl shadow-inner shrink-0">
              {amountToFreeShipping > 0 ? (
                <p className="text-[11px] font-bold text-slate-700 mb-2">Do darmowej dostawy brakuje: <span className="text-red-600 font-black">{amountToFreeShipping.toFixed(2)} zł</span></p>
              ) : (
                <p className="text-[11px] font-black text-emerald-700 mb-2">Gratulacje! Masz <span className="underline">DARMOWĄ DOSTAWĘ</span>.</p>
              )}
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-500 ${amountToFreeShipping > 0 ? 'bg-red-600' : 'bg-emerald-500'}`} style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          )}

          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
              <span className="text-4xl mb-3 block">🚜</span>
              <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-1">Koszyk jest pusty</h3>
              <button onClick={() => setIsOpen(false)} className="mt-4 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-red-600 transition-colors">Wróć do zakupów</button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 shrink-0">
              {items.map((item: any) => (
                <div key={item.id} className="py-4 flex gap-3 items-center">
                  <div className="relative w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 p-1 flex items-center justify-center">
                    {item.image ? <Image loader={bunnyLoader} src={item.image} alt={item.name} fill className="object-contain p-1 mix-blend-multiply" /> : <span className="text-[8px] font-black text-slate-200">FOTO</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 text-xs truncate uppercase leading-tight mb-1" title={item.name}>{item.name}</h4>
                    <p className="text-[10px] font-black text-slate-400 mb-2">{item.price.toFixed(2)} zł</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center bg-slate-900 text-white rounded-md h-7 p-0.5 shadow-inner">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-6 h-full font-black text-xs hover:text-red-500">-</button>
                        <span className="px-2 text-[10px] font-black min-w-[20px] text-center text-red-500">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-6 h-full font-black text-xs hover:text-emerald-500">+</button>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="text-[9px] font-black text-slate-400 hover:text-red-600 uppercase tracking-widest transition-colors">Usuń</button>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-black text-slate-900 text-sm">{(item.price * item.quantity).toFixed(2)} zł</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t border-slate-200 bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.03)] space-y-4 shrink-0">
            
            <div className="space-y-1.5 border-b border-slate-100 pb-4 text-[11px] font-bold text-slate-400">
              <div className="flex justify-between items-center">
                <span>Wartość w koszyku:</span>
                <span className="text-slate-700">{totalBrutto.toFixed(2)} zł</span>
              </div>
              
              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-red-600 font-black bg-red-50 p-1.5 rounded -mx-1.5">
                  <span>Twój stały rabat (-{currentTier.discountPercent * 100}%):</span>
                  <span>-{discountAmount.toFixed(2)} zł</span>
                </div>
              )}

              <div className="flex justify-between items-baseline pt-2">
                <span className="text-slate-900 font-black uppercase text-xs tracking-wider">Suma (Brutto):</span>
                <span className="text-2xl font-black text-slate-900 tracking-tighter">{totalAfterDiscount.toFixed(2)} <span className="text-xs font-bold text-slate-400">zł</span></span>
              </div>
            </div>

            <div className="bg-slate-900 text-white rounded-xl p-3 flex items-center justify-between shadow-inner border border-slate-800">
              <span className="text-[10px] uppercase tracking-widest font-bold">Zyskujesz do Skarbonki:</span>
              <span className="text-sm font-black text-emerald-400">+{cashbackEarned.toFixed(2)} zł</span>
            </div>

            <button 
              onClick={() => { setIsOpen(false); router.push('/zamowienie'); }}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-red-600/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95"
            >
              <span>Przejdź do kasy</span>
              <span className="text-lg">➔</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}