'use client';

import React, { useEffect } from 'react';
import ProductCard from './ProductCard';
import { trackViewItemList } from '@/lib/analytics';
import { useGarage } from '@/store/useGarage'; // 1. IMPORT STANU GARAŻU

interface ProductGridProps {
  initialProducts: any[];
  totalCount?: number;
  fullPath?: any;
  loading?: boolean;
  isListView?: boolean; 
}

export default function ProductGrid({ 
  initialProducts, 
  totalCount = 0, 
  fullPath, 
  loading = false,
  isListView = false 
}: ProductGridProps) {
  
  // 2. POBIERAMY STAN GARAŻU
  const { isActive, brand, model, clearGarage } = useGarage();

  // 3. FRONTENDOWE FILTROWANIE GARAŻOWE
  // Jeśli backend dostarczy już przefiltrowane dane (najlepsza opcja dla Next.js), 
  // ten fragment kodu po prostu przepuści wszystko bez zmian. 
  // Jeśli backend zwróci wszystko, siatka sama usunie niepasujące produkty.
  const productsToDisplay = isActive && initialProducts
    ? initialProducts.filter((p: any) => {
        const name = p.name?.toLowerCase() || '';
        const lowerBrand = brand.toLowerCase();
        const lowerModel = model.toLowerCase();
        // Sprawdzamy czy nazwa lub kategoria zawiera markę lub model
        return name.includes(lowerBrand) || name.includes(lowerModel) || 
               p.category_text?.toLowerCase().includes(lowerBrand) ||
               p.category_text?.toLowerCase().includes(lowerModel);
      })
    : (initialProducts || []);

  useEffect(() => {
    if (productsToDisplay.length > 0 && !loading) {
      const ga4Items = productsToDisplay.map((product: any, index: number) => ({
        item_id: String(product.id || product.sku),
        item_name: product.name,
        price: typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0,
        item_category: product.category_text || product.category || 'Brak kategorii',
        index: index + 1
      }));
      
      let listName = fullPath ? `Kategoria: ${fullPath}` : "Katalog kategorii";
      if (isActive) listName += ` [Filtr Garaż: ${brand} ${model}]`;
      
      trackViewItemList(ga4Items, "category_list", listName);
    }
  }, [productsToDisplay, loading, fullPath, isActive, brand, model]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[300px]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-red-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* BANER AKTYWNEGO GARAŻU */}
      {isActive && (
        <div className="bg-red-50 border-2 border-red-100 rounded-3xl p-5 mb-2 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white text-2xl rounded-2xl flex items-center justify-center shadow-sm">
              🚜
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-0.5">
                Katalog dopasowany do:
              </p>
              <h2 className="text-xl font-black text-slate-900 leading-none">
                {brand} <span className="text-red-600">{model}</span>
              </h2>
            </div>
          </div>
          
          <button 
            onClick={clearGarage}
            className="bg-white border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-600 hover:text-red-600 text-xs font-black uppercase tracking-widest px-6 py-3 rounded-xl transition-all shadow-sm shrink-0"
          >
            ✕ Wyłącz filtr
          </button>
        </div>
      )}

      {productsToDisplay.length === 0 ? (
        <div className="text-center py-20 min-h-[300px] flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
          <span className="text-4xl block mb-4 opacity-50">🛠️</span>
          <p className="text-slate-900 font-black text-lg mb-2">Brak produktów w tej kategorii</p>
          <p className="text-slate-500 font-medium text-sm">
            {isActive ? (
              <>Nie znaleźliśmy części pasujących do Twojej maszyny: <strong className="text-red-600">{brand} {model}</strong>.</>
            ) : (
              'Kategoria jest obecnie pusta.'
            )}
          </p>
          {isActive && (
            <button 
              onClick={clearGarage}
              className="mt-6 bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-colors"
            >
              Pokaż wszystkie maszyny
            </button>
          )}
        </div>
      ) : (
        <>
          <div className={`grid gap-6 ${isListView ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3'}`}>
            {productsToDisplay.map((product: any, idx: number) => (
              <ProductCard 
                key={`${product.id || product.sku}-${idx}`} 
                product={product} 
                index={idx + 1} 
                isListView={isListView} 
              />
            ))}
          </div>
          
          {totalCount > productsToDisplay.length && !isActive && (
            <div className="text-center mt-8">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Wyświetlono {productsToDisplay.length} z {totalCount} produktów
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}