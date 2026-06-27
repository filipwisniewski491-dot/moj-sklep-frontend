// Szkielet pokazywany NATYCHMIAST po kliknięciu kategorii/podkategorii/marki,
// zanim SSR policzy dane. Eliminuje uczucie "zawieszenia" - strona reaguje od razu.
export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-36 md:pb-0 animate-pulse">
      {/* Nagłówek kategorii */}
      <div className="bg-white border-b pt-8 pb-6 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex gap-2 items-center mb-6">
            <div className="h-3 w-12 bg-slate-200 rounded" />
            <div className="h-3 w-3 bg-slate-100 rounded" />
            <div className="h-3 w-32 bg-slate-200 rounded" />
            <div className="h-3 w-3 bg-slate-100 rounded" />
            <div className="h-3 w-24 bg-slate-200 rounded" />
          </div>
          {/* H1 */}
          <div className="h-12 lg:h-16 w-3/4 max-w-2xl bg-slate-200 rounded-2xl mb-4" />
          {/* Opis */}
          <div className="space-y-2 max-w-4xl mb-6">
            <div className="h-4 w-full bg-slate-100 rounded" />
            <div className="h-4 w-5/6 bg-slate-100 rounded" />
          </div>
          {/* Podkategorie */}
          <div className="border-t border-slate-100 pt-5">
            <div className="h-3 w-40 bg-slate-200 rounded mb-4" />
            <div className="flex flex-wrap gap-2 lg:gap-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-12 bg-slate-100 rounded-xl" style={{ width: `${110 + (i % 4) * 50}px` }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Treść: filtry + siatka produktów */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8 w-full">
          {/* Filtry (desktop) */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="bg-white rounded-[32px] border border-slate-100 p-6 space-y-6">
              <div className="h-10 w-full bg-slate-100 rounded-xl" />
              <div className="space-y-3">
                <div className="h-3 w-32 bg-slate-200 rounded" />
                <div className="h-11 w-full bg-slate-100 rounded-xl" />
                <div className="h-11 w-full bg-slate-100 rounded-xl" />
              </div>
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="h-3 w-28 bg-slate-200 rounded" />
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="h-4 w-32 bg-slate-100 rounded" />
                    <div className="h-4 w-8 bg-slate-100 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Siatka produktów */}
          <div className="flex-1">
            {/* Pasek sortowania */}
            <div className="flex justify-between items-center mb-6 bg-white rounded-2xl border border-slate-100 p-4">
              <div className="h-5 w-40 bg-slate-200 rounded" />
              <div className="h-9 w-44 bg-slate-100 rounded-xl" />
            </div>
            {/* Karty produktów */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="bg-white border border-slate-100 rounded-[32px] lg:rounded-[40px] p-2">
                  <div className="aspect-square bg-slate-100 rounded-[24px] lg:rounded-[32px] mb-3 lg:mb-4" />
                  <div className="px-3 pb-4 lg:px-6 lg:pb-5 space-y-3">
                    <div className="h-4 w-full bg-slate-200 rounded" />
                    <div className="h-4 w-2/3 bg-slate-100 rounded" />
                    <div className="pt-3 border-t border-slate-50 space-y-3">
                      <div className="h-6 w-24 bg-slate-200 rounded" />
                      <div className="h-11 w-full bg-slate-100 rounded-xl" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}