'use client';

import React, { useState } from 'react';
import Image from 'next/image';

const bunnyLoader = ({ src, width }: { src: string; width: number }) => {
  if (!src.includes('b-cdn.net')) return src;
  const cleanSrc = src.split('?')[0]; 
  const quality = width < 300 ? 50 : 65; 
  return `${cleanSrc}?width=${width}&format=webp&quality=${quality}&sharpen=false`;
};

export default function ProductThumbnails({ images, productName }: { images: string[], productName: string }) {
  const [selectedImgIdx, setSelectedImgIdx] = useState(0); 

  const handleThumbnailClick = (idx: number, imgUrl: string) => {
    setSelectedImgIdx(idx);
    
    // HACK: Błyskawiczna zmiana atrybutu SRC z pominięciem cyklu życia Reacta
    const mainImage = document.getElementById('main-product-image') as HTMLImageElement;
    if (mainImage) {
      const highResUrl = imgUrl.includes('b-cdn.net') ? `${imgUrl.split('?')[0]}?width=450&format=webp&quality=65` : imgUrl;
      mainImage.src = highResUrl;
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
      {images.map((imgUrl: string, idx: number) => (
        <button 
          key={idx} 
          onClick={() => handleThumbnailClick(idx, imgUrl)} 
          aria-label={`Zobacz detal ${idx + 1}`}
          className={`relative flex-shrink-0 w-24 h-24 rounded-xl p-2 border-2 transition-all overflow-hidden ${selectedImgIdx === idx ? 'border-red-600 bg-white shadow-md' : 'border-transparent bg-slate-50 hover:bg-slate-100'}`}
        >
          <Image loader={bunnyLoader} src={imgUrl} alt="" fill sizes="96px" className="object-contain mix-blend-multiply p-2" />
        </button>
      ))}
    </div>
  );
}