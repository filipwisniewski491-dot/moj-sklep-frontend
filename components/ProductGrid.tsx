'use client';

import React, { useEffect } from 'react';
import ProductCard from './ProductCard';
import { trackViewItemList } from '@/lib/analytics';

interface ProductGridProps {
  initialProducts: any[];
  totalCount?: number;
  fullPath?: any;
  loading?: boolean;
  isListView?: boolean; // Dodane: wsparcie dla widoku listy
}

export default function ProductGrid({ 
  initialProducts, 
  totalCount = 0, 
  fullPath, 
  loading = false,
  isListView = false // Domyślnie ustawiamy na false (widok siatki)
}: ProductGridProps) {
  
  const productsToDisplay = initialProducts || [];

  // DATA LAYER: Wysłanie informacji do Google Ads/GA4, że klient widzi tę listę produktów
  useEffect(() => {
    if (productsToDisplay.length > 0 && !loading) {
      const ga4Items = productsToDisplay.map((product: any, index: number) => ({
        item_id: String(product.id || product.sku),
        item_name: product.name,
        price: typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0,
        item_category: product.category_text || product.category || 'Brak kategorii',
        index: index + 1
      }));
      
      const listName = fullPath ? `Kategoria: ${fullPath}` : "Katalog kategorii";
      trackViewItemList(ga4Items, "category_list", listName);
    }
  }, [productsToDisplay, loading, fullPath]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[300px]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-red-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (productsToDisplay.length === 0) {
    return (
      <div className="text-center py-20 min-h-[300px] flex flex-col items-center justify-center">
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
          Brak produktów do wyświetlenia w tej kategorii.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className={`grid gap-6 ${isListView ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'}`}>
        {productsToDisplay.map((product: any, idx: number) => (
          <ProductCard 
            key={`${product.id || product.sku}-${idx}`} 
            product={product} 
            index={idx + 1} 
            isListView={isListView} // Poprawka: Przekazujemy wymaganą wartość do karty produktu
          />
        ))}
      </div>
      
      {/* Opcjonalna informacja o ilości produktów */}
      {totalCount > productsToDisplay.length && (
        <div className="text-center mt-8">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Wyświetlono {productsToDisplay.length} z {totalCount} produktów
          </p>
        </div>
      )}
    </div>
  );
}