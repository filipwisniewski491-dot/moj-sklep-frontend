'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProductCard from './ProductCard';
import { trackViewItemList, GA4Item } from '@/lib/analytics'; // 1. Dodajemy importy

export default function ProductGrid({ initialProducts, totalCount, fullPath, loading }: { initialProducts: any[], totalCount: number, fullPath: string, loading: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isListView, setIsListView] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(24);
  
  const searchQ = searchParams.get('q') || '';
  const productsToDisplay = initialProducts.slice(0, displayLimit);

  // --- ANALYTICS: Rejestrowanie załadowania listy ---
  useEffect(() => {
    if (!loading && productsToDisplay.length > 0) {
      // Przygotowujemy tablicę z poprawnym formatem dla zdarzenia view_item_list
      const itemsToTrack: GA4Item[] = productsToDisplay.map((product) => ({
        item_id: String(product.id || product.sku),
        item_name: product.name,
        price: typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0,
        item_category: product.category_text || 'Brak kategorii'
      }));

      // Wysłanie do dataLayer
      trackViewItemList(itemsToTrack, `list-${fullPath || 'szukaj'}`, 'Listing Kategorii');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, displayLimit, fullPath]); // Monitorujemy też zmianę limitu i wywołujemy po doładowaniu kolejnych

  const clearFilters = () => {
    router.push(`/kategoria/${fullPath}`);
  };

  return (
    <div className="flex-1 flex flex-col min-h-[500px]">
      
      {/* Pasek narzędziowy: Siatka/Lista i Sortowanie */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-4 border-b border-slate-100 mb-6 hidden lg:flex">
        <div className="flex items-center gap-4">
          <div className="h-1 w-12 bg-red-600"></div>
          <p className="text-slate-600 font-bold uppercase text-[11px] tracking-widest">Katalog: {totalCount} części</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-slate-100 p-1.5 rounded-xl flex items-center gap-1 border border-slate-200 shadow-inner">
            <button aria-label="Widok siatki" onClick={() => setIsListView(false)} className={`px-4 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all min-w-[48px] min-h-[40px] flex items-center justify-center ${!isListView ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}>Siatka 🔳</button>
            <button aria-label="Widok listy" onClick={() => setIsListView(true)} className={`px-4 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all min-w-[48px] min-h-[40px] flex items-center justify-center ${isListView ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}>Lista ☰</button>
          </div>
          <select aria-label="Sortuj produkty" className="bg-slate-50 border border-slate-200 text-slate-800 text-[11px] font-black uppercase tracking-widest rounded-xl px-4 py-3 outline-none focus:border-red-600 cursor-pointer shadow-sm min-h-[48px]" value={searchParams.get('sort') || ''} onChange={(e) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set('sort', e.target.value);
            router.push(`?${params.toString()}`);
          }}>
            <option value="">Sortowanie Domyślne</option>
            <option value="price_asc">Cena: rosnąco</option>
            <option value="price_desc">Cena: malejąco</option>
            <option value="name_asc">Nazwa: A-Z</option>
          </select>
        </div>
      </div>

      <div className="relative flex-1">
        {loading ? (
            <div className="w-full h-64 flex items-center justify-center">
              <span className="text-5xl animate-bounce">🚜</span>
            </div>
        ) : productsToDisplay.length === 0 ? (
          <div className="bg-white rounded-[32px] lg:rounded-[40px] p-6 lg:p-12 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-600 to-orange-500"></div>
            <span className="text-5xl lg:text-6xl mb-6 block drop-shadow-sm">⚙️</span>
            <h2 className="text-2xl lg:text-3xl font-black text-slate-900 uppercase tracking-tight mb-3">
              Pusty magazyn? To tylko pozory.
            </h2>
            <p className="text-slate-600 font-medium text-sm lg:text-base max-w-2xl mx-auto mb-8 leading-relaxed">
              {searchQ 
                ? <>Nie znaleźliśmy w tej kategorii nic pod frazą <strong className="text-slate-900">"{searchQ}"</strong>. Producenci często aktualizują numery OEM lub część występuje pod inną nazwą.</>
                : <>Prawdopodobnie użyłeś zbyt wielu filtrów naraz. W rolnictwie detale mają znaczenie, ale czasem warto spojrzeć szerzej na całą kategorię.</>
              }
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl mb-10">
              <a href="tel:+48123456789" className="bg-red-600 text-white px-6 py-4 rounded-xl font-black text-[12px] lg:text-sm uppercase tracking-widest hover:bg-red-700 transition-colors flex items-center justify-center gap-2 shadow-md min-h-[56px]">
                <span className="text-lg">📞</span> Zadzwoń – dobierzemy część
              </a>
              <button onClick={clearFilters} className="bg-slate-100 text-slate-800 px-6 py-4 rounded-xl font-black text-[12px] lg:text-sm uppercase tracking-widest hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 min-h-[56px]">
                <span className="text-lg">🔄</span> Zresetuj wszystkie filtry
              </button>
            </div>
          </div>
        ) : (
          <div className={isListView ? "space-y-4 w-full" : "grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6"}>
            {productsToDisplay.map((product: any, idx: number) => (
              {/* 2. Przekazujemy index do ProductCard, by GTM wiedziało, z jakiego miejsca z listy kliknięto produkt */}
              <ProductCard key={`${product.id || product.sku}-${idx}`} product={product} isListView={isListView} index={idx} />
            ))}
          </div>
        )}
      </div>

      {totalCount > 0 && !loading && (
        <div className="mt-12 flex flex-col items-center gap-4 border-t border-slate-100 pt-8">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Wyświetlono {productsToDisplay.length} z {totalCount} części</p>
          <div className="w-64 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
            <div className="h-full bg-red-600 transition-all duration-500 rounded-full" style={{ width: `${Math.min(100, (productsToDisplay.length / totalCount) * 100)}%` }} />
          </div>
          {productsToDisplay.length < totalCount && (
            <button aria-label="Załaduj więcej produktów" onClick={() => setDisplayLimit(prev => prev + 24)} className="mt-2 bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-[12px] uppercase tracking-widest hover:bg-red-600 transition-all transform hover:scale-[1.02] shadow-md min-h-[56px]">Załaduj kolejne produkty ➔</button>
          )}
        </div>
      )}
    </div>
  );
}