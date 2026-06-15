'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/store/useCart';
import { getUserTier, CONSTANT_CASHBACK_PERCENT } from '@/lib/cashbackEngine';
import { trackViewItem, trackCopySku, trackSupportContact } from '@/lib/analytics'; 

export default function ProductBuyPanel({ product, mainImageUrl, attributes }: { product: any, mainImageUrl: string | null, attributes: any }) {
  const { addItem, setIsOpen } = useCart();
  const [timeLeftStr, setTimeLeftStr] = useState('');
  const [isShippingToday, setIsShippingToday] = useState(true);
  const [skuCopied, setSkuCopied] = useState(false);

  const { currentTier } = getUserTier(105000);
  const numPrice = typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0;
  const priceAfterDiscount = numPrice * (1 - currentTier.discountPercent);
  const cashbackEarned = priceAfterDiscount * CONSTANT_CASHBACK_PERCENT;
  const [mainPrice, centsPrice] = priceAfterDiscount.toFixed(2).split('.');
  const hasCents = centsPrice !== '00';

  // DATA LAYER: Rejestracja wyświetlenia produktu
  useEffect(() => {
    trackViewItem({
      item_id: product.sku || product.id,
      item_name: product.name,
      price: priceAfterDiscount,
      item_category: product.category_text || 'Kategoria nienazwana',
    }, priceAfterDiscount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id, product.sku]);

  useEffect(() => {
    const calcTime = () => {
      const now = new Date();
      const target = new Date();
      target.setHours(15, 0, 0, 0);
      if (now.getHours() >= 15) target.setDate(target.getDate() + 1);
      const diff = target.getTime() - now.getTime();
      setTimeLeftStr(`${Math.floor(diff / 3600000)}g ${Math.floor((diff % 3600000) / 60000)}m`);
      setIsShippingToday(now.getHours() < 15);
    };
    calcTime();
    const interval = setInterval(calcTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleAddToCart = () => {
    addItem({ 
      id: product.id || product.sku, 
      name: product.name, 
      price: priceAfterDiscount, 
      image: mainImageUrl || '', 
      quantity: 1, 
      crossSell: [], 
      category: product.category_text || '' 
    });
    setIsOpen(true);
  };

  const handleCopySku = () => {
    if(product.sku) {
      navigator.clipboard.writeText(product.sku);
      setSkuCopied(true);
      // DATA LAYER: Mikro-intencja (Kopiowanie SKU)
      trackCopySku(product.sku, product.name);
      setTimeout(() => setSkuCopied(false), 2000);
    }
  };

  const getCleanCompatibility = () => {
    const rawMatch = attributes['Pasuje do marki'] || attributes['Marka maszyny'] || attributes['Pasuje do'];
    const rawModel = attributes['Pasuje do modelu'] || attributes['Model maszyny'] || attributes['Model'];
    const ignoredBrands = ['GRANIT', 'KRAMP', 'GRENE', 'BAP', 'BEPCO', 'WARYŃSKI', 'ROLMUS', 'KERBL', 'SAPHIR Oryginał', 'Saphir'];
    
    let isMatchValid = rawMatch && !ignoredBrands.some((b: string) => rawMatch.toUpperCase().includes(b.toUpperCase()));
    let isModelValid = rawModel && !ignoredBrands.some((b: string) => rawModel.toUpperCase().includes(b.toUpperCase()));

    if (!isMatchValid && !isModelValid) return null;
    return `${isMatchValid ? rawMatch : ''} ${isModelValid ? rawModel : ''}`.trim();
  };

  const cleanCompatibility = getCleanCompatibility();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 border-b border-slate-100 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span> W Magazynie</span>
          <button onClick={handleCopySku} className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border transition-all flex items-center gap-1 cursor-pointer ${skuCopied ? 'bg-green-600 text-white border-green-600' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}>
            SKU: {product.sku} {skuCopied ? '✓ Skopiowano' : '📋'}
          </button>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
          <div className="flex text-yellow-500 text-xs">★★★★★</div>
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">4.8/5.0</span>
        </div>
      </div>

      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6 mt-6">
        <div className="flex flex-col">
          {currentTier.level > 1 && (
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-slate-900 text-amber-300 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest shadow-sm">
                VIP -{currentTier.discountPercent * 100}%
              </span>
              <span className="text-xs text-slate-600 line-through font-bold">{numPrice.toFixed(2)} zł</span>
            </div>
          )}
          <div className="flex items-baseline gap-1">
            <span className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter">{mainPrice}</span>
            {hasCents && <span className="text-3xl font-bold text-slate-600">.{centsPrice}</span>}
            <span className="text-2xl font-bold text-slate-600 ml-1">zł</span>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">Brutto (VAT 23%)</p>
            {cashbackEarned >= 0 && (
              <>
                <div className="w-px h-3 bg-slate-200"></div>
                <p className="text-emerald-700 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                  <span>💰</span> +{cashbackEarned.toFixed(2)} zł
                </p>
              </>
            )}
          </div>
        </div>
        
        <div className="flex-1 md:max-w-[280px] flex flex-col gap-2">
          <button onClick={handleAddToCart} className="w-full bg-red-600 text-white py-5 rounded-2xl font-black text-base lg:text-lg uppercase tracking-widest hover:bg-red-700 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-red-600/30 flex items-center justify-center gap-3">
            <span>DODAJ DO KOSZYKA ➔</span>
          </button>
          <button onClick={() => console.log('Szybki BLIK')} className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2">
            Kup błyskawicznie z <span className="bg-white text-black px-1.5 py-0.5 rounded text-[10px] italic">BLIK</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-8 border-b border-slate-100 pb-8">
        <span className="flex items-center gap-1.5">🔒 Bezpieczne płatności</span>
        <span className="text-slate-400">•</span>
        <span className="flex items-center gap-1.5">💳 BLIK / PayU</span>
        <span className="text-slate-400">•</span>
        <span className="flex items-center gap-1.5">🔄 14 dni na zwrot</span>
      </div>

      {cleanCompatibility && (
        <div className="mb-6 bg-emerald-50 border border-emerald-100 p-5 rounded-2xl flex items-start gap-4">
           <div className="text-2xl">✅</div>
           <div>
              <p className="text-[10px] font-black uppercase text-emerald-800 tracking-widest mb-1">Gwarancja dopasowania</p>
              <p className="text-sm font-bold text-emerald-950 leading-snug">
                Element sprawdzony. Pasuje do: <span className="font-black">{cleanCompatibility}</span>
              </p>
           </div>
        </div>
      )}

      <div className="bg-slate-50 text-slate-800 p-5 rounded-2xl mb-4 border border-slate-200 flex items-start gap-4">
         <div className="text-2xl mt-0.5">📦</div>
         <div>
            <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-slate-600 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
              Ekspresowa Wysyłka
            </p>
            <p className="text-sm font-bold leading-tight">
              {isShippingToday 
                ? `Zamów w ciągu ${timeLeftStr}, a wyślemy paczkę JESZCZE DZISIAJ!` 
                : `Wysyłka JUTRO RANO. Czas na zamówienie: ${timeLeftStr}`}
            </p>
         </div>
      </div>

      <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-5 relative overflow-hidden group">
        <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-slate-100 shadow-sm shrink-0">
          <img src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=60&w=150&auto=format&fit=crop" alt="Doradca techniczny" loading="lazy" className="w-full h-full object-cover object-top" />
        </div>
        <div className="flex-1">
          <p className="font-black uppercase text-[9px] text-red-700 tracking-widest mb-0.5">Twój opiekun techniczny</p>
          <p className="font-bold text-slate-800 text-xs leading-tight mb-2">Chcesz upewnić się, czy część na pewno pasuje?</p>
          <a 
            href="tel:+48500600700" 
            onClick={() => trackSupportContact('phone')} 
            className="inline-flex items-center gap-1.5 font-black text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest transition-colors"
          >
            📞 +48 500 600 700
          </a>
        </div>
      </div>
    </>
  );
}