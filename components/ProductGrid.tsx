'use client';

import React, { useEffect } from 'react';
import ProductCard from './ProductCard'; // Upewnij się, że ścieżka do ProductCard jest poprawna
import { trackViewItemList } from '@/lib/analytics';

interface ProductGridProps {
  products: any[];
  listName?: string;
  listId?: string;
}

export default function ProductGrid({ 
  products, 
  listName = "Katalog główny", 
  listId = "main_catalog" 
}: ProductGridProps) {
  
  const productsToDisplay = products || [];

  // DATA LAYER: Wysłanie informacji do Google Ads/GA4, że klient widzi tę listę produktów (Odkrywanie)
  useEffect(() => {
    if (productsToDisplay.length > 0) {
      const ga4Items = productsToDisplay.map((product: any, index: number) => ({
        item_id: String(product.id || product.sku),
        item_name: product.name,
        price: typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0,
        item_category: product.category_text || product.category || 'Brak kategorii',
        index: index + 1
      }));
      
      trackViewItemList(ga4Items, listId, listName);
    }
  }, [productsToDisplay, listId, listName]);

  if (productsToDisplay.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
          Brak produktów do wyświetlenia w tej kategorii.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {/* 2. Przekazujemy index do ProductCard, by GTM wiedziało, z jakiego miejsca kliknięto */}
      {productsToDisplay.map((product: any, idx: number) => (
        <ProductCard 
          key={`${product.id || product.sku}-${idx}`} 
          product={product} 
          index={idx + 1} 
        />
      ))}
    </div>
  );
}