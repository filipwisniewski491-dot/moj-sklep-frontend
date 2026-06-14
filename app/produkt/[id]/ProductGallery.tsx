import React from 'react';

export default function ProductGallery({ images, productName }: { images: string[], productName: string }) {
  const mainImageUrl = images[0] || null;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-slate-50 rounded-2xl p-8 flex items-center justify-center border border-slate-100 shadow-inner relative overflow-hidden group">
         {mainImageUrl ? (
          <div className="relative w-full aspect-square max-h-[500px]">
            <img
              id="main-product-image"
              src={`${mainImageUrl.split('?')[0]}?width=450&format=webp&quality=65`}
              alt={productName || "Zdjęcie główne"}
              width="450"
              height="450"
              fetchPriority="high"
              className="w-full h-full object-contain mix-blend-multiply"
            />
          </div>
         ) : ( 
          <div className="font-black text-slate-500 text-xl uppercase tracking-widest text-center aspect-square flex items-center justify-center">BRAK ZDJĘCIA</div> 
         )}
      </div>
      
      {images.length > 1 && (
        <>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide" id="gallery-thumbnails">
            {images.map((imgUrl: string, idx: number) => (
              <button 
                key={idx} 
                data-img={imgUrl}
                aria-label={`Zobacz detal ${idx + 1}`}
                className={`thumbnail-btn relative flex-shrink-0 w-24 h-24 rounded-xl p-2 border-2 transition-all overflow-hidden ${idx === 0 ? 'border-red-600 bg-white shadow-md' : 'border-transparent bg-slate-50 hover:bg-slate-100'}`}
              >
                <img src={`${imgUrl.split('?')[0]}?width=100&format=webp&quality=50`} alt="" className="w-full h-full object-contain mix-blend-multiply p-2" />
              </button>
            ))}
          </div>
          
          {/* HACK 100/100: Vanilla JS zamiast Reacta omija hydration delay! */}
          <script dangerouslySetInnerHTML={{ __html: `
            document.querySelectorAll('.thumbnail-btn').forEach(function(btn) {
              btn.addEventListener('click', function() {
                var imgUrl = this.getAttribute('data-img');
                var mainImage = document.getElementById('main-product-image');
                if (mainImage && imgUrl) {
                  mainImage.src = imgUrl.split('?')[0] + '?width=450&format=webp&quality=65';
                  document.querySelectorAll('.thumbnail-btn').forEach(function(b) {
                    b.classList.remove('border-red-600', 'bg-white', 'shadow-md');
                    b.classList.add('border-transparent', 'bg-slate-50');
                  });
                  this.classList.remove('border-transparent', 'bg-slate-50');
                  this.classList.add('border-red-600', 'bg-white', 'shadow-md');
                }
              });
            });
          `}} />
        </>
      )}
    </div>
  );
}