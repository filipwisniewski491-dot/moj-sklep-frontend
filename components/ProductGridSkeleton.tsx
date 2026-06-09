import React from 'react';

export default function ProductGridSkeleton() {
  // Generujemy tablicę 12 pustych elementów, żeby wypełnić ekran szkieletami kart
  const skeletonItems = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className="flex-1 flex flex-col min-h-[500px] w-full animate-pulse" aria-hidden="true">
      
      {/* Szkielet górnego paska narzędzi (widoczny tylko na desktopie) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-4 border-b border-slate-100 mb-6 hidden lg:flex">
        <div className="flex items-center gap-4">
          <div className="h-1 w-12 bg-slate-200 rounded"></div>
          <div className="h-4 w-32 bg-slate-200 rounded"></div>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-10 w-32 bg-slate-200 rounded-xl"></div>
          <div className="h-10 w-48 bg-slate-200 rounded-xl"></div>
        </div>
      </div>

      {/* Szkielet siatki produktów - układ musi dokładnie naśladować prawdziwy ProductGrid */}
      <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6 w-full">
        {skeletonItems.map((item) => (
          <div key={item} className="bg-white border border-slate-100 rounded-[32px] lg:rounded-[40px] p-2 flex flex-col h-full shadow-sm">
            
            {/* Miejsce na zdjęcie */}
            <div className="bg-slate-100 rounded-[24px] lg:rounded-[32px] aspect-square mb-3 lg:mb-4 w-full"></div>
            
            <div className="flex flex-col px-3 pb-4 lg:px-6 lg:pb-5 flex-1">
              {/* Miejsce na gwiazdki */}
              <div className="h-3 w-16 bg-slate-100 rounded mb-2"></div>
              
              {/* Miejsce na tytuł (dwie linie) */}
              <div className="h-4 w-full bg-slate-200 rounded mb-1.5"></div>
              <div className="h-4 w-3/4 bg-slate-200 rounded mb-4"></div>
              
              {/* Miejsce na cenę i przycisk */}
              <div className="flex flex-col gap-3 pt-3 lg:pt-4 border-t border-slate-50 mt-auto">
                <div className="flex flex-col">
                  <div className="h-3 w-16 bg-slate-100 rounded mb-1"></div>
                  <div className="h-6 w-24 bg-slate-200 rounded"></div>
                </div>
                <div className="h-12 w-full bg-slate-100 rounded-xl mt-1"></div>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}