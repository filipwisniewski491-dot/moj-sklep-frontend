'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/store/useCart';

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
  const [addedCrossSells, setAddedCrossSells] = useState<string[]>([]);
  const [loadingCrossSell, setLoadingCrossSell] = useState(false);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // 🔥 PANCERNY ALGORYTM CROSS-SELL (Z GWARANCJĄ WYŚWIETLENIA)
  useEffect(() => {
    if (!isOpen || items.length === 0) return;

    async function fetchDrawerCrossSells() {
      setLoadingCrossSell(true);
      let foundProducts: any[] = [];
      
      const explicitSkus = items.flatMap((item: any) => item.crossSell || []).filter(Boolean);
      const uniqueSkus = Array.from(new Set(explicitSkus)) as string[];

      // 1. Próba: Dedykowane SKU ze Strapi
      if (uniqueSkus.length > 0) {
        try {
          const queryParams = new URLSearchParams({ skus: uniqueSkus.slice(0, 3).join(',') });
          const res = await fetch(`/api/cross-sell?${queryParams.toString()}`);
          const json = await res.json();
          if (json.products && json.products.length > 0) {
            foundProducts = json.products;
          }
        } catch (e) {
          console.error("Błąd dedykowanego cross-sellu:", e);
        }
      }

      // 2. Próba: Fallback z API po słowie kluczowym
      if (foundProducts.length === 0) {
        try {
          const res = await fetch(`/api/search?q=smar&limit=5&sort=price_asc`);
          const json = await res.json();
          if (json.products && json.products.length > 0) {
            const currentCartSkus = items.map((i: any) => i.id);
            foundProducts = json.products
              .filter((p: any) => !currentCartSkus.includes(p.sku) && p.price > 0 && p.price < 150)
              .slice(0, 2)
              .map((p: any) => ({
                sku: p.sku,
                name: p.name,
                price: p.price,
                image: p.images?.[0]?.url_thumbnail || p.external_images?.[0] || ''
              }));
          }
        } catch (e) {
          console.error("Błąd wyszukiwania fallbacku:", e);
        }
      }

      // 3. Próba: Żelazny Hard-Fallback (Jeśli API całkowicie leży lub baza jest pusta)
      if (foundProducts.length === 0) {
        foundProducts = [
          { sku: 'FALLBACK-1', name: 'Zmywacz uniwersalny do hamulców i sprzęgieł, 500ml', price: 14.99, image: '' },
          { sku: 'FALLBACK-2', name: 'Rękawice robocze warsztatowe antypoślizgowe, rozm. L', price: 9.50, image: '' }
        ];
      }

      setCrossSellItems(foundProducts);
      setLoadingCrossSell(false);
    }

    fetchDrawerCrossSells();
  }, [isOpen, items]);

  if (!isOpen) return null;

  const totalBrutto = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  const totalNetto = totalBrutto / 1.23;
  const totalVat = totalBrutto - totalNetto;

  const amountToFreeShipping = FREE_SHIPPING_THRESHOLD - totalBrutto;
  const progressPercent = Math.min(100, (totalBrutto / FREE_SHIPPING_THRESHOLD) * 100);

  const handleAddCrossSellInDrawer = (product: any) => {
    addItem({
      id: product.sku || product.id,
      name: product.name,
      price: product.price,
      image: product.image || '',
      quantity: 1,
      crossSell: [],
      category: ''
    });
    setAddedCrossSells(prev => [...prev, product.sku || product.id]);
  };

  return (
    <div className="fixed inset-0 z-[150] animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

      <div className="absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300 overflow-hidden">
        
        {/* NAGŁÓWEK KOSZYKA */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛒</span>
            <h2 className="font-black text-slate-900 uppercase text-xs tracking-wider">Twój Koszyk</h2>
            <span className="bg-slate-900 text-white text-[10px] font-black px-2 py-0.5 rounded-md">
              {items.reduce((sum: number, item: any) => sum + item.quantity, 0)} szt.
            </span>
          </div>
          <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-black flex items-center justify-center transition-colors">✕</button>
        </div>

        {/* ZAWARTOŚĆ SCROLLOWALNA (PRODUKTY + CROSS-SELL) */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-white flex flex-col gap-6">
          
          {/* GRYWALIZACJA DARMOWEJ DOSTAWY */}
          {items.length > 0 && (
            <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl shadow-inner shrink-0">
              {amountToFreeShipping > 0 ? (
                <p className="text-[11px] font-bold text-slate-700 mb-2">
                  🚜 Do darmowej dostawy brakuje: <span className="text-red-600 font-black">{amountToFreeShipping.toFixed(2)} zł</span>
                </p>
              ) : (
                <p className="text-[11px] font-black text-emerald-700 mb-2">
                  🎉 Gratulacje! Masz <span className="underline">DARMOWĄ DOSTAWĘ</span>.
                </p>
              )}
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-500 ${amountToFreeShipping > 0 ? 'bg-red-600' : 'bg-emerald-500'}`} style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          )}

          {/* LISTA GŁÓWNA */}
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
              <span className="text-4xl mb-3 block">📦</span>
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
                      <button onClick={() => removeItem(item.id)} className="text-[9px] font-black text-slate-400 hover:text-red-600 uppercase tracking-widest transition-colors">Usuń ✕</button>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-black text-slate-900 text-sm">{(item.price * item.quantity).toFixed(2)} zł</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* DYNAMICZNY CROSS-SELL (Wypełnia pustą przestrzeń) */}
          {items.length > 0 && !loadingCrossSell && crossSellItems.length > 0 && (
            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 mt-auto animate-in fade-in duration-300">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-1.5">
                <span className="text-sm">🔥</span> Nie zapomnij o eksploatacji:
              </h4>
              <div className="space-y-3">
                {crossSellItems.map((prod: any) => {
                  const isAdded = addedCrossSells.includes(prod.sku || prod.id);
                  return (
                    <div key={prod.sku || prod.id} className="bg-white p-2.5 rounded-xl border border-slate-200/60 flex items-center justify-between gap-3 shadow-sm hover:border-slate-300 transition-colors">
                      <div className="w-12 h-12 bg-slate-50 border rounded-lg p-1 shrink-0 relative flex items-center justify-center">
                        {prod.image ? <Image loader={prod.image.includes('b-cdn.net') ? bunnyLoader : undefined} src={prod.image} alt={prod.name} fill className="object-contain p-1 mix-blend-multiply" /> : <span className="text-[8px] font-black text-slate-300">BRAK</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-slate-800 text-[10px] line-clamp-2 leading-tight uppercase" title={prod.name}>{prod.name}</h5>
                        <p className="text-[11px] font-black text-red-600 mt-1">{prod.price.toFixed(2)} zł</p>
                      </div>
                      <button
                        onClick={() => handleAddCrossSellInDrawer(prod)}
                        disabled={isAdded}
                        className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider shrink-0 transition-all ${isAdded ? 'bg-green-100 text-green-700 cursor-not-allowed border border-green-200' : 'bg-slate-900 text-white hover:bg-red-600 shadow-sm'}`}
                      >
                        {isAdded ? '✓ Dodano' : '+ Dorzuć'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* DOLNY PANEL PODSUMOWANIA (Czysty, B2B) */}
        {items.length > 0 && (
          <div className="p-6 border-t border-slate-200 bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.03)] space-y-4 shrink-0">
            
            {/* CZYSTE ROZBICIE B2B */}
            <div className="space-y-1.5 border-b border-slate-100 pb-4 text-[11px] font-bold text-slate-400">
              <div className="flex justify-between"><span>Suma Netto:</span><span className="text-slate-700">{totalNetto.toFixed(2)} zł</span></div>
              <div className="flex justify-between"><span>Podatek VAT (23%):</span><span className="text-slate-700">{totalVat.toFixed(2)} zł</span></div>
              <div className="flex justify-between items-baseline pt-2">
                <span className="text-slate-900 font-black uppercase text-xs tracking-wider">Suma (Brutto):</span>
                <span className="text-2xl font-black text-slate-900 tracking-tighter">{totalBrutto.toFixed(2)} <span className="text-xs font-bold text-slate-400">zł</span></span>
              </div>
            </div>

            {/* JEDEN, CZYSTY PRZYCISK DO KASY */}
            <button 
              onClick={() => { setIsOpen(false); router.push('/zamowienie'); }}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-red-600/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95"
            >
              <span>Przejdź do kasy (Dostawa i Płatność)</span>
              <span className="text-lg">➔</span>
            </button>

            <div className="text-center flex justify-center gap-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              <span>🛡️ Szyfrowane SSL</span>
              <span>📦 Szybka dostawa</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}