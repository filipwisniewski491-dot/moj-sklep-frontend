'use client';

import React, { useState, useEffect } from 'react';

export default function ProductGallery({ images, productName }: { images: string[], productName: string }) {
  const [mainImageUrl, setMainImageUrl] = useState<string | null>(images[0] || null);

  // Aktualizacja, jeśli zmieni się produkt w tle
  useEffect(() => {
    setMainImageUrl(images[0] || null);
  }, [images]);

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-slate-50 rounded-2xl p-8 flex items-center justify-center border border-slate-100 shadow-inner relative overflow-hidden group">
         {mainImageUrl ? (
          <div className="relative w-full aspect-square max-h-[500px]">
            <img
              src={`${mainImageUrl.split('?')[0]}?width=450&format=webp&quality=65`}
              alt={productName || "Zdjęcie produktu"}
              width={450}
              height={450}
              fetchPriority="high"
              decoding="sync"
              className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" 
            />
          </div>
         ) : ( 
          <div className="font-black text-slate-500 text-xl uppercase tracking-widest text-center aspect-square flex items-center justify-center">BRAK ZDJĘCIA</div> 
         )}
      </div>
      
      {images.length > 1 && (
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {images.map((imgUrl: string, idx: number) => {
            const isSelected = mainImageUrl === imgUrl;
            return (
              <button 
                key={idx} 
                onClick={() => setMainImageUrl(imgUrl)}
                aria-label={`Zobacz detal ${idx + 1}`}
                className={`relative flex-shrink-0 w-24 h-24 rounded-xl p-2 border-2 transition-all overflow-hidden cursor-pointer ${
                  isSelected ? 'border-red-600 bg-white shadow-md' : 'border-transparent bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <img 
                  src={`${imgUrl.split('?')[0]}?width=100&format=webp&quality=50`} 
                  alt="" 
                  loading="lazy" 
                  decoding="async" 
                  className="w-full h-full object-contain mix-blend-multiply p-2" 
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}