'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const bunnyLoader = ({ src, width }: { src: string; width: number }) => {
  if (!src.includes('b-cdn.net')) return src;
  const cleanSrc = src.split('?')[0]; 
  return `${cleanSrc}?width=${width}&format=webp`;
};

interface CrossSellModuleProps {
  skus: string[];
}

export default function CrossSellModule({ skus }: CrossSellModuleProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!skus || skus.length === 0) {
      setLoading(false);
      return;
    }

    async function fetchCrossSells() {
      try {
        const queryParams = new URLSearchParams({ skus: skus.join(',') });
        const res = await fetch(`/api/cross-sell?${queryParams.toString()}`);
        const json = await res.json();
        setProducts(json.products || []);
      } catch (error) {
        console.error("Błąd ładowania cross-selli:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCrossSells();
  }, [skus]);

  const updateInlineQty = (sku: string, delta: number) => {
    setCartQuantities(prev => {
      const current = prev[sku] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [sku]: next };
    });
  };

  if (loading) {
    return (
      <div className="mt-12 bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm animate-pulse h-64 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="mt-16 bg-white rounded-[40px] p-8 md:p-12 border border-slate-100 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 relative z-10 gap-4">
        <div>
          <h3 className="text-[11px] font-black uppercase tracking-widest text-red-600 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
            Ekspert Serwisu Zaleca
          </h3>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">Niezbędne materiały eksploatacyjne</h2>
          <p className="text-slate-500 font-medium text-sm mt-1 max-w-lg">Dodaj do koszyka w zestawie, aby uniknąć przerw w pracy i mieć chemię warsztatową zawsze pod ręką.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        {products.map((product) => {
          const price = parseFloat(product.price) || 0;
          const netPrice = price / 1.23;
          const qty = cartQuantities[product.sku] || 0;

          return (
            <div key={product.sku} className="group bg-slate-50 border border-slate-100 rounded-3xl p-2 hover:shadow-lg transition-all duration-300 flex flex-col relative">
              <div className="aspect-[4/3] bg-white rounded-2xl overflow-hidden relative flex items-center justify-center p-4 border border-slate-50 shadow-inner">
                {product.image ? (
                  <Image loader={product.image.includes('b-cdn.net') ? bunnyLoader : undefined} src={product.image} alt={product.name} fill className="object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Brak zdjęcia</span>
                )}
                <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border border-slate-100 text-slate-500">SKU: {product.sku}</div>
              </div>
              
              <div className="px-4 pb-4 pt-3 flex-1 flex flex-col">
                {/* 🚀 ZMIANA: Zablokowano pobieranie w tle linków z sugerowanych produktów */}
                <Link href={`/produkt/${product.slug}`} prefetch={false}>
                  <h3 className="font-bold text-slate-800 leading-tight group-hover:text-red-600 transition-colors line-clamp-2 text-xs tracking-tight min-h-[34px]">{product.name}</h3>
                </Link>
                
                <div className="mt-auto flex justify-between items-end pt-3 border-t border-slate-200/60">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 tracking-tight">{new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2 }).format(netPrice)} zł netto</span>
                    <span className="text-lg font-black text-slate-900 tracking-tighter leading-none">{new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2 }).format(price)} <span className="text-[10px] font-bold text-slate-400">zł</span></span>
                  </div>
                  
                  {qty > 0 ? (
                    <div className="flex items-center bg-slate-900 text-white rounded-xl h-10 p-1 shadow-inner animate-in zoom-in-50 duration-200">
                      <button onClick={() => updateInlineQty(product.sku, -1)} className="w-6 h-full font-black text-xs hover:text-red-500">-</button>
                      <span className="px-1.5 text-[10px] font-black min-w-[16px] text-center text-red-500">{qty}</span>
                      <button onClick={() => updateInlineQty(product.sku, 1)} className="w-6 h-full font-black text-xs hover:text-emerald-500">+</button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => updateInlineQty(product.sku, 1)}
                      className="bg-slate-900 text-white w-10 h-10 rounded-xl flex items-center justify-center group-hover:bg-red-600 transition-all transform group-hover:rotate-12 shadow-md"
                    >
                      <span className="text-sm">🛒</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}