'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/store/useCart';
import { getUserTier } from '@/lib/cashbackEngine';

const bunnyLoader = ({ src, width }: { src: string; width: number }) => {
  if (!src.includes('b-cdn.net')) return src;
  const cleanSrc = src.split('?')[0]; 
  return `${cleanSrc}?width=${Math.min(width, 750)}&format=webp&quality=65&sharpen=false`;
};

// Kafelek "Inni oglądali też"
const MiniProductCard = ({ product }: { product: any }) => {
  const { addItem, setIsOpen } = useCart();
  const imageUrl = product.image || product.external_images?.[0] || product.images?.[0]?.url_standard || product.images?.[0]?.url || product.images?.[0]?.src || null;
  const price = typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0;
  const sku = product.sku || "BRAK SKU";

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    addItem({ id: product.documentId || product.id || sku, name: product.name, price: price, image: imageUrl || '', quantity: 1, crossSell: [], category: '' });
    if (setIsOpen) setIsOpen(true);
  };

  return (
    <div className="group bg-white border border-slate-100 rounded-[32px] hover:shadow-xl transition-all duration-300 flex flex-col h-full overflow-hidden relative">
      <Link href={`/produkt/${product.slug || sku}`} className="flex flex-col flex-1 p-2 relative z-0">
        <div className="bg-slate-50 rounded-[24px] overflow-hidden relative flex items-center justify-center aspect-square mb-3 p-4">
          {imageUrl ? (
            <Image loader={imageUrl.includes('b-cdn.net') ? bunnyLoader : undefined} src={imageUrl} alt={product.name} fill sizes="(max-width: 768px) 50vw, 200px" quality={60} className="object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Brak pliku</span>
          )}
        </div>
        <div className="px-3 flex-1 flex flex-col">
          <h3 className="font-bold text-slate-800 leading-snug mb-2 group-hover:text-red-600 transition-colors line-clamp-2 text-xs tracking-tight">{product.name}</h3>
        </div>
      </Link>
      <div className="px-5 pb-5 pt-3 border-t border-slate-50 flex items-end justify-between bg-white mt-auto relative z-20 pointer-events-auto">
        <div className="flex flex-col">
          <span className="text-xl font-black text-slate-900 tracking-tighter leading-none">{new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2 }).format(price)} <span className="text-[9px] font-bold text-slate-600">zł</span></span>
        </div>
        <button onClick={handleAddToCart} className="bg-slate-900 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-red-600 active:scale-95 transition-all shadow-md shrink-0 cursor-pointer relative z-50">
          <span className="text-sm">🛒</span>
        </button>
      </div>
    </div>
  );
};

export default function ProductRecommendations({ product, mainImageUrl }: { product: any, mainImageUrl: string | null }) {
  const { addItem, setIsOpen } = useCart();
  const { currentTier } = getUserTier(105000); // Mock VIP

  // Twarde mocki aby zapobiec błędom 500 z nieaktywnej Medusy na serwerze Vercela
  const [relatedProducts] = useState<any[]>([
    { id: "bundle-1", sku: "OEM-TEST-4", name: "Filtr Oleju Silnikowego PP-8.4", price: 24.99, image: "https://centrumrolnictwa-cdn.b-cdn.net/logo/logo-centrumrolnictwapl-2-1.jpeg" },
    { id: "bundle-2", sku: "OEM-TEST-3", name: "Siedzenie Dwuczęściowe do Ciągnika", price: 340.00, image: "https://centrumrolnictwa-cdn.b-cdn.net/logo/logo-centrumrolnictwapl-2-1.jpeg" }
  ]);

  const bundleProduct = relatedProducts[0];
  const othersViewedProducts = relatedProducts;

  const numPrice = typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0;
  const priceAfterDiscount = numPrice * (1 - currentTier.discountPercent);

  const bundleProductPrice = bundleProduct ? (typeof bundleProduct.price === 'number' ? bundleProduct.price : parseFloat(bundleProduct.price) || 0) : 0;
  const bundleProductPriceAfterDiscount = bundleProductPrice * (1 - currentTier.discountPercent);
  const bundleTotalPrice = bundleProduct ? (priceAfterDiscount + bundleProductPriceAfterDiscount) : 0;
  const bundleDiscountPrice = bundleProduct ? (bundleTotalPrice * 0.95) : 0;

  const handleAddBundle = () => {
    if (addItem && bundleProduct) {
      addItem({ id: product.documentId || product.id || product.sku || 'main', name: product.name, price: priceAfterDiscount, image: mainImageUrl || '', quantity: 1, crossSell: [], category: '' });
      const bundleImg = bundleProduct.image || bundleProduct.external_images?.[0] || bundleProduct.images?.[0]?.url_standard || bundleProduct.images?.[0]?.url || bundleProduct.images?.[0]?.src || null;
      addItem({ id: bundleProduct.documentId || bundleProduct.id || bundleProduct.sku || 'bundle', name: bundleProduct.name, price: bundleProductPriceAfterDiscount * 0.95, image: bundleImg || '', quantity: 1, crossSell: [], category: '' });
      if (setIsOpen) setIsOpen(true);
    }
  };

  if (!bundleProduct) return null;

  return (
    <>
      <section className="mt-16 bg-white rounded-[32px] p-6 lg:p-10 border-2 border-red-600 shadow-xl relative overflow-hidden">
         <div className="absolute top-0 right-0 bg-red-600 text-white px-6 py-2 rounded-bl-3xl font-black text-[10px] uppercase tracking-widest shadow-md">
           Kup w zestawie i oszczędź 5%
         </div>
         <h3 className="text-xl lg:text-2xl font-black text-slate-900 uppercase tracking-tight mb-8">Często kupowane razem</h3>
         <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            <div className="flex items-center gap-4 flex-1 w-full lg:w-auto">
              <div className="w-24 h-24 bg-slate-50 rounded-2xl relative border border-slate-100 p-2 shrink-0">
                {mainImageUrl ? <img src={mainImageUrl.includes('b-cdn.net') ? `${mainImageUrl.split('?')[0]}?width=200&format=webp&quality=65` : mainImageUrl} alt="Wybrany artykuł" className="w-full h-full object-contain mix-blend-multiply" /> : <div className="w-full h-full bg-slate-100 rounded-xl"></div>}
              </div>
              <div>
                <span className="bg-red-100 text-red-800 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest mb-1 block w-fit">Ten produkt</span>
                <p className="text-xs font-bold text-slate-800 line-clamp-2">{product.name}</p>
                <p className="text-sm font-black text-slate-900 mt-1">{priceAfterDiscount.toFixed(2)} zł</p>
              </div>
            </div>

            <div className="text-3xl font-black text-slate-400">＋</div>

            <div className="flex items-center gap-4 flex-1 w-full lg:w-auto">
              <div className="w-24 h-24 bg-slate-50 rounded-2xl relative border border-slate-100 p-2 shrink-0">
                 {(() => {
                    const bImg = bundleProduct.image || bundleProduct.external_images?.[0] || bundleProduct.images?.[0]?.url_standard || bundleProduct.images?.[0]?.url || bundleProduct.images?.[0]?.src;
                    return bImg ? <img src={bImg.includes('b-cdn.net') ? `${bImg.split('?')[0]}?width=200&format=webp&quality=65` : bImg} alt="Polecany zestaw" className="w-full h-full object-contain mix-blend-multiply" /> : <div className="w-full h-full bg-slate-100 rounded-xl"></div>;
                 })()}
              </div>
              <div>
                <span className="bg-slate-100 text-slate-600 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest mb-1 block w-fit">Rekomendowane</span>
                <p className="text-xs font-bold text-slate-800 line-clamp-2">{bundleProduct.name}</p>
                <p className="text-sm font-black text-slate-900 mt-1">{bundleProductPriceAfterDiscount.toFixed(2)} zł</p>
              </div>
            </div>
            
            <div className="text-3xl font-black text-slate-400 hidden lg:block">＝</div>
            <div className="w-full h-px bg-slate-100 lg:hidden"></div>
            
            <div className="flex flex-col items-center lg:items-end w-full lg:w-auto shrink-0 bg-red-50 p-6 rounded-2xl border border-red-100">
               <p className="line-through text-slate-500 font-bold text-sm mb-1">{bundleTotalPrice.toFixed(2)} zł</p>
               <p className="text-3xl lg:text-4xl font-black text-red-600 tracking-tighter leading-none mb-4">{bundleDiscountPrice.toFixed(2)} <span className="text-lg">zł</span></p>
               <button onClick={handleAddBundle} className="relative z-50 w-full lg:w-auto bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] uppercase tracking-widest px-8 py-4 rounded-xl transition-all shadow-md hover:scale-[1.02] active:scale-95 cursor-pointer">
                 DODAJ ZESTAW ➔
               </button>
            </div>
         </div>
      </section>

      <section className="mt-12 bg-white rounded-[40px] p-8 md:p-12 border border-slate-100 shadow-sm relative overflow-hidden">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 relative z-10 gap-4">
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-red-600 mb-2 flex items-center gap-2">
                Klienci wybierali również
              </h3>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">Inni oglądali też</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6 relative z-10">
             {othersViewedProducts.map(p => (
               <MiniProductCard key={p.id || p.sku} product={p} />
             ))}
          </div>
      </section>
    </>
  );
}