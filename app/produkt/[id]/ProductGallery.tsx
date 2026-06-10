import React from 'react';
import ProductThumbnails from './ProductThumbnails';

export default function ProductGallery({ images, productName }: { images: string[], productName: string }) {
  const mainImageUrl = images[0] || null;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-slate-50 rounded-2xl p-8 flex items-center justify-center border border-slate-100 shadow-inner relative overflow-hidden group">
         {mainImageUrl ? (
          <div className="relative w-full aspect-square max-h-[500px]">
            {/* OSTATECZNA POPRAWKA: Czyste HTML renderowane z serwera, odporne na opóźnienia Reacta */}
            <img
              id="main-product-image"
              src={mainImageUrl.includes('b-cdn.net') ? `${mainImageUrl.split('?')[0]}?width=450&format=webp&quality=65` : mainImageUrl}
              alt={productName || "Zdjęcie"}
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
        <ProductThumbnails images={images} productName={productName} />
      )}
    </div>
  );
}