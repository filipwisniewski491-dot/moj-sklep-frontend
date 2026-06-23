'use client';

import React, { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import { trackViewItemList } from '@/lib/analytics';
import { useGarage } from '@/store/useGarage'; 

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
  
  const { isActive, brand, model, clearGarage } = useGarage();
  const [visibleLimit, setVisibleLimit] = useState(24);

  const productsToDisplay = isActive && initialProducts
    ? initialProducts.filter((p: any) => {
        const name = p.name?.toLowerCase() || '';
        const lowerBrand = brand.toLowerCase();
        const lowerModel = model.toLowerCase();
        return name.includes(lowerBrand) || name.includes(lowerModel) || 
               p.category_text?.toLowerCase().includes(lowerBrand) ||
               p.category_text?.toLowerCase().includes(lowerModel);
      })
    : (initialProducts || []);

  const currentlyVisibleProducts = productsToDisplay.slice(0, visibleLimit);
  const actualTotalCount = isActive ? productsToDisplay.length : Math.max(totalCount, productsToDisplay.length);

  useEffect(() => {
    if (currentlyVisibleProducts.length > 0) {
      trackViewItemList(currentlyVisibleProducts, fullPath || 'Search Results');
    }
  }, [currentlyVisibleProducts, fullPath]);

  const handleShowMore = () => {
    setVisibleLimit(prev => prev + 24);
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {actualTotalCount === 0 ? (
        <div className="bg-white border border-slate-100 rounded-[32px] p-12 text-center shadow-sm">
          <span className="text-5xl mb-4 grayscale opacity-40 inline-block">🚜</span>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-3">Brak produktów w tej kategorii</h3>
          <p className="text-slate-500 font-medium mb-6">
            Kategoria jest obecnie pusta. 
            {isActive && <><br/>Sprawdź, czy filtry Garażu (<b>{brand} {model}</b>) nie ukrywają wyników.</>}
          </p>
          {isActive && (
            <button 
              onClick={clearGarage}
              className="bg-red-50 text-red-600 hover:bg-red-100 px-6 py-3 rounded-xl font-bold transition-colors"
            >
              Wyczyść filtry Garażu
            </button>
          )}
        </div>
      ) : (
        <>
          <div className={`grid ${isListView ? 'grid-cols-1 gap-4' : 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4'}`}>
            {currentlyVisibleProducts.map((product: any, idx: number) => (
              <ProductCard 
                key={`${product.id || product.sku}-${idx}`} 
                product={product} 
                index={idx + 1} 
                isListView={isListView} 
                priority={idx < 4}
              />
            ))}
          </div>
          
          {visibleLimit < actualTotalCount && (
            <div className="mt-12 flex flex-col items-center w-full max-w-md mx-auto">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                Widoczne {currentlyVisibleProducts.length} z {actualTotalCount}
              </p>
              
              <div className="w-full h-1 bg-slate-200 rounded-full mb-6 overflow-hidden">
                <div 
                  className="h-full bg-red-600 transition-all duration-700 ease-out"
                  style={{ width: `${(currentlyVisibleProducts.length / actualTotalCount) * 100}%` }}
                />
              </div>

              <button 
                onClick={handleShowMore}
                className="w-full sm:w-auto px-8 py-3.5 bg-white border-2 border-slate-900 text-slate-900 font-black uppercase text-xs tracking-widest hover:bg-slate-900 hover:text-white transition-colors rounded-xl shadow-sm"
              >
                Pokaż więcej produktów ➔
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}