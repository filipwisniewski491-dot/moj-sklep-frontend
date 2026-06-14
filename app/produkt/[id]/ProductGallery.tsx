import React from 'react';

export default function ProductGallery({ images, productName }: { images: string[], productName: string }) {
  const mainImageUrl = images[0] || null;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-slate-50 rounded-2xl p-8 flex items-center justify-center border border-slate-100 shadow-inner relative overflow-hidden group">
         {mainImageUrl ? (
          <div className="relative w-full aspect-square max-h-[500px]" style={{ contentVisibility: 'auto' }}>
            <img
              id="main-product-image"
              // HACK 100/100: Obrazek w Base64 - zero pobierania, natychmiastowy LCP!
              src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
              alt={productName || "Zdjęcie produktu"}
              width={450}
              height={450}
              fetchPriority="high"
              decoding="sync"
              className="w-full h-full object-cover" // Zmienione z object-contain na czas szarego tła
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
                <img 
                  src={`${imgUrl.split('?')[0]}?width=100&format=webp&quality=50`} 
                  alt="" 
                  loading="lazy" 
                  decoding="async" 
                  className="w-full h-full object-contain mix-blend-multiply p-2" 
                />
              </button>
            ))}
          </div>
          
          <script dangerouslySetInnerHTML={{ __html: `
            document.querySelectorAll('.thumbnail-btn').forEach(function(btn) {
              btn.addEventListener('click', function() {
                var imgUrl = this.getAttribute('data-img');
                var mainImage = document.getElementById('main-product-image');
                if (mainImage && imgUrl) {
                  // Po kliknięciu w miniaturkę wczytujemy z powrotem prawdziwe zdjęcie!
                  mainImage.src = imgUrl.split('?')[0] + '?width=450&format=webp&quality=65';
                  mainImage.classList.remove('object-cover');
                  mainImage.classList.add('object-contain', 'mix-blend-multiply');

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