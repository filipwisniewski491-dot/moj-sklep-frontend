export default function LoadingCategory() {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse">
      {/* Okruszki szkielet */}
      <div className="h-4 bg-slate-200 rounded w-1/4 mb-6"></div>
      
      {/* Nagłówek H1 szkielet */}
      <div className="h-10 bg-slate-200 rounded w-1/2 mb-8"></div>
      
      {/* Podkategorie szkielet */}
      <div className="flex gap-4 overflow-x-auto mb-10 pb-2">
         {[1, 2, 3, 4, 5].map((i) => (
           <div key={i} className="h-12 w-40 bg-slate-200 rounded-full flex-shrink-0"></div>
         ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Lewy panel (Filtry) szkielet */}
        <div className="w-full lg:w-1/4 hidden lg:block">
            <div className="h-8 bg-slate-200 rounded w-1/2 mb-6"></div>
            {[1, 2, 3, 4, 5, 6].map((i) => (
               <div key={i} className="h-6 bg-slate-100 rounded w-full mb-3"></div>
            ))}
        </div>

        {/* Prawy panel (Produkty) szkielet */}
        <div className="w-full lg:w-3/4">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="bg-slate-50 rounded-2xl h-80 w-full"></div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}