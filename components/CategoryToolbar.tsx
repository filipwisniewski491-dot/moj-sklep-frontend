'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export default function CategoryToolbar({ totalCount }: { totalCount: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get('sort') || '';
  const currentView = searchParams.get('view') || 'grid';

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 gap-4">
      <div className="text-sm font-bold text-slate-500">
        Znaleziono: <span className="text-slate-900">{totalCount}</span> produktów
      </div>
      
      <div className="flex items-center gap-4 w-full sm:w-auto">
        {/* Przycisk Sortowania */}
        <select 
          className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 py-3 px-4 rounded-xl outline-none focus:border-red-600 transition-colors"
          value={currentSort}
          onChange={(e) => updateParam('sort', e.target.value)}
        >
          <option value="">Domyślne sortowanie</option>
          <option value="price_asc">Cena: rosnąco</option>
          <option value="price_desc">Cena: malejąco</option>
        </select>

        {/* Przełącznik Widoku (Siatka / Lista) */}
        <div className="hidden sm:flex bg-slate-100 p-1 rounded-xl shrink-0">
          <button 
            aria-label="Widok Siatki"
            onClick={() => updateParam('view', 'grid')} 
            className={`p-2.5 rounded-lg transition-all ${currentView !== 'list' ? 'bg-white shadow text-red-600' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm10 0h6v6h-6z"/></svg>
          </button>
          <button 
            aria-label="Widok Listy"
            onClick={() => updateParam('view', 'list')} 
            className={`p-2.5 rounded-lg transition-all ${currentView === 'list' ? 'bg-white shadow text-red-600' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}