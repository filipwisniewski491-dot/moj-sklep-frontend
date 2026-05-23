'use client';

import React, { useState } from 'react';
import Image from 'next/image';

// Tniemy URL ze Strapi, wywalamy sztywne ?width=800 i pozwalamy Next.js podać idealną szerokość ekranu
const bunnyLoader = ({ src, width }: { src: string; width: number }) => {
  const cleanSrc = src.split('?')[0]; 
  return `${cleanSrc}?width=${width}&format=webp`;
};

export default function ProductGallery({ images, productName }: { images: string[], productName: string }) {
  const [selectedImgIdx, setSelectedImgIdx] = useState(0);
  const mainImageUrl = images[selectedImgIdx] || null;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-slate-50 rounded-[32px] p-8 flex items-center justify-center border border-slate-100 shadow-inner group overflow-hidden aspect-square relative">
         {mainImageUrl ? (
           <div className="relative w-full h-full min-h-[300px]">
             <Image 
               loader={bunnyLoader}
               src={mainImageUrl} 
               alt={productName || 'Zdjęcie produktu'} 
               fill
               priority={true} 
               sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
               className="object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700" 
             />
           </div>
         ) : (
           <div className="font-black text-slate-200 text-xl uppercase tracking-widest text-center">BRAK ZDJĘCIA</div>
         )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {images.map((imgUrl, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImgIdx(idx)}
              className={`relative flex-shrink-0 w-24 h-24 rounded-2xl p-2 border-2 transition-all overflow-hidden ${
                selectedImgIdx === idx ? 'border-red-600 bg-white shadow-md' : 'border-transparent bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <Image 
                loader={bunnyLoader}
                src={imgUrl} 
                alt={`Miniaturka ${idx + 1}`} 
                fill
                sizes="96px"
                className="object-contain mix-blend-multiply p-2"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}