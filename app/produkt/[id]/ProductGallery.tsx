'use client';

import React, { useState } from 'react';
import Image from 'next/image';

const bunnyLoader = ({ src, width }: { src: string; width: number }) => {
  if (!src.includes('b-cdn.net')) return src;
  const cleanSrc = src.split('?')[0]; 
  return `${cleanSrc}?width=${Math.min(width, 750)}&format=webp&quality=65&sharpen=false`;
};

export default function ProductGallery({ images, productName }: { images: string[], productName: string }) {
  const [selectedImgIdx, setSelectedImgIdx] = useState(0); 
  const mainImageUrl = images[selectedImgIdx] || null;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-slate-50 rounded-2xl p-8 flex items-center justify-center border border-slate-100 shadow-inner relative overflow-hidden group">
         {mainImageUrl ? (
          <div className="relative w-full aspect-square max-h-[250px] md:max-h-[500px]">
            <img
              src={mainImageUrl.includes('b-cdn.net') ? `${mainImageUrl.split('?')[0]}?width=500&format=webp&quality=65` : mainImageUrl}
              alt={productName || "Produkt"}
              width={500}
              height={500}
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
              className={`relative flex-shrink-0 w-24 h-24 rounded-xl p-2 border-2 transition-all overflow-hidden ${selectedImgIdx === idx ? 'border-red-600 bg-white shadow-md' : 'border-transparent bg-slate-50'}`}
            >
              <Image loader={bunnyLoader} src={imgUrl} alt={`Detal ${idx + 1}`} fill sizes="96px" className="object-contain mix-blend-multiply p-2" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}