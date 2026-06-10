'use client';

import React, { useState } from 'react';
import Image from 'next/image';

const bunnyLoader = ({ src, width }: { src: string; width: number }) => {
  if (!src.includes('b-cdn.net')) return src;
  const cleanSrc = src.split('?')[0]; 
  // Ostra kompresja dla miniaturek poniżej 300px, żeby wyciszyć ostrzeżenia Lighthouse
  const quality = width < 300 ? 50 : 65; 
  return `${cleanSrc}?width=${width}&format=webp&quality=${quality}&sharpen=false`;
};

export default function ProductGallery({ images, productName }: { images: string[], productName: string }) {
  const [selectedImgIdx, setSelectedImgIdx] = useState(0); 
  const mainImageUrl = images[selectedImgIdx] || null;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-slate-50 rounded-2xl p-8 flex items-center justify-center border border-slate-100 shadow-inner relative overflow-hidden group">
         {mainImageUrl ? (
          <div className="relative w-full aspect-square max-h-[500px]">
            <img
              src={mainImageUrl.includes('b-cdn.net') ? `${mainImageUrl.split('?')[0]}?width=450&format=webp&quality=65` : mainImageUrl}
              alt={productName || "Zdjęcie"}
              width={450}
              height={450}
              fetchPriority="high"
              decoding="async"
              className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
            />
          </div>
         ) : ( 
          <div className="font-black text-slate-500 text-xl uppercase tracking-widest text-center aspect-square flex items-center justify-center">BRAK ZDJĘCIA</div> 
         )}
      </div>
      
      {images.length > 1 && (
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {images.map((imgUrl: string, idx: number) => (
            <button 
              key={idx} 
              onClick={() => setSelectedImgIdx(idx)} 
              aria-label={`Zobacz detal ${idx + 1}`}
              className={`relative flex-shrink-0 w-24 h-24 rounded-xl p-2 border-2 transition-all overflow-hidden ${selectedImgIdx === idx ? 'border-red-600 bg-white shadow-md' : 'border-transparent bg-slate-50 hover:bg-slate-100'}`}
            >
              <Image loader={bunnyLoader} src={imgUrl} alt={`${productName} detal ${idx + 1}`} fill sizes="96px" className="object-contain mix-blend-multiply p-2" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}