'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/store/useCart';

const bunnyLoader = ({ src, width }: { src: string; width: number }) => {
  if (!src.includes('b-cdn.net')) return src;
  const cleanSrc = src.split('?')[0]; 
  const optimalWidth = width > 384 ? 384 : width;
  return `${cleanSrc}?width=${optimalWidth}&format=webp`;
};

const ProductCard = React.memo(({ product, isListView, idx }: { product: any, isListView: boolean, idx: number }) => {
  const { addItem, setIsOpen } = useCart() as any;
  const [qty, setQty] = useState(1);

  const imageUrl = product.external_images?.[0] || product.images?.[0]?.url_standard || product.images?.[0]?.url || product.images?.[0]?.src || null;
  const price = typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0;
  const netPrice = price / 1.23; 
  const sku = product.sku || "BRAK SKU";
  
  const isShippingToday = true; 
  const hash = sku.charCodeAt(0) || 0;
  const rating = "4.8"; 
  const reviewsCount = 12 + (hash % 10); 
  
  const isLcpElement = idx === 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    addItem({ id: product.id || sku, name: product.name, price: price, image: imageUrl || '', quantity: qty, crossSell: [], category: '' });
    setIsOpen(true);
  };

  return (
    <div className={`group bg-white border border-slate-100 rounded-[32px] lg:rounded-[40px] p-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] transition-all duration-300 flex relative ${isListView ? 'flex-row gap-4 lg:gap-6 items-center w-full' : 'flex-col h-full'}`}>
      
      <Link href={`/produkt/${product.slug || sku}`} aria-label={`Przejdź do: ${product.name} (SKU: ${sku})`} className="absolute inset-0 z-0"></Link>

      <div className={`absolute top-3 right-3 lg:top-4 lg:right-4 z-10 flex flex-col gap-1 items-end`}>
        {isShippingToday ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[8px] lg:text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Wysyłka dziś</span>
          </div>
        ) : null}
      </div>

      <div className={`bg-slate-50 rounded-[24px] lg:rounded-[32px] overflow-hidden relative flex items-center justify-center border border-slate-50 shadow-inner shrink-0 pointer-events-none ${isListView ? 'w-28 h-28 lg:w-36 lg:h-36 p-4' : 'aspect-square mb-3 lg:mb-4 p-4 lg:p-8 w-full'}`}>
        {imageUrl ? (
          <div className="relative w-full h-full">
            <Image 
              loader={imageUrl.includes('b-cdn.net') ? bunnyLoader : undefined} 
              src={imageUrl} 
              alt={product.name || 'Zdjęcie produktu'} 
              fill 
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" 
              priority={isLcpElement}
              fetchPriority={isLcpElement ? "high" : "auto"}
              loading={isLcpElement ? "eager" : "lazy"}
              className="object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" 
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center opacity-20 group-hover:opacity-40 transition-opacity">
            <span className="text-[8px] lg:text-[10px] font-black uppercase tracking-widest text-center">Brak zdjęcia</span>
          </div>
        )}
      </div>
      
      <div className={`flex flex-col pt-1 w-full pointer-events-none ${isListView ? 'justify-center pr-3 lg:pr-4' : 'px-3 pb-4 lg:px-6 lg:pb-5 flex-1'}`}>
        <div className="flex justify-between items-center mb-1.5">
          <div className="flex items-center gap-1 text-[10px] lg:text-[11px] text-amber-400 font-black">★ {rating} <span className="text-slate-500 font-medium text-[9px] lg:text-[10px]">({reviewsCount})</span></div>
        </div>

        <h2 className="font-black text-slate-800 leading-snug mb-2 group-hover:text-red-600 transition-colors line-clamp-2 text-xs lg:text-sm tracking-normal">{product.name}</h2>
        
        <div className={`flex ${isListView ? 'flex-row items-center justify-between gap-6' : 'flex-col gap-3'} pt-3 lg:pt-4 border-t border-slate-50 w-full pointer-events-auto z-10 ${isListView ? 'mt-0' : 'mt-auto'}`}>
          <div className="flex flex-col">
            <span className="text-[8px] lg:text-[9px] font-black text-slate-500 mb-0.5 tracking-tight whitespace-nowrap">{new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(netPrice)} zł netto</span>
            <span className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight whitespace-nowrap">{new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price)} <span className="text-[9px] lg:text-xs font-bold text-slate-500">zł</span></span>
          </div>
          
          <div className={`flex items-center gap-1.5 ${isListView ? 'w-[200px]' : 'w-full'}`}>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-1 flex-1 min-h-[48px]">
              <button aria-label="Zmniejsz ilość" onClick={(e) => { e.preventDefault(); setQty(Math.max(1, qty - 1)); }} className="min-w-[48px] min-h-[48px] flex-1 font-black text-slate-500 hover:text-red-600 flex items-center justify-center cursor-pointer">-</button>
              <input aria-label="Ilość" type="number" value={qty} onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))} className="w-full text-center bg-transparent text-[11px] lg:text-xs font-black text-slate-900 outline-none appearance-none p-0 m-0 min-h-[48px] min-w-[48px]" />
              <button aria-label="Zwiększ ilość" onClick={(e) => { e.preventDefault(); setQty(qty + 1); }} className="min-w-[48px] min-h-[48px] flex-1 font-black text-slate-500 hover:text-emerald-600 flex items-center justify-center cursor-pointer">+</button>
            </div>
            <button aria-label="Dodaj do koszyka" onClick={handleAddToCart} className="bg-slate-900 text-white px-3 lg:px-4 rounded-xl flex items-center justify-center font-black text-[10px] uppercase tracking-widest hover:bg-red-600 active:scale-95 transition-all shadow-md shrink-0 cursor-pointer relative z-50 min-h-[48px] min-w-[48px]">
              <span className="text-sm">🛒</span><span className="ml-1.5 hidden min-[360px]:inline">Dodaj</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';
export default ProductCard;