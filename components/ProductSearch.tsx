"use client";

import { useState, useEffect } from 'react';
import { meiliClient } from '@/lib/meilisearch-client';

export default function ProductSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const search = async () => {
      setLoading(true);
      try {
        const index = meiliClient.index('products');
        const searchResult = await index.search(query, { limit: 5 });
        setResults(searchResult.hits);
      } catch (error) {
        console.error("Błąd wyszukiwania:", error);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(search, 300); // Debounce: czeka 300ms po wpisaniu
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="relative w-full max-w-md">
      <input
        type="text"
        className="w-full p-2 border rounded"
        placeholder="Szukaj części rolniczych..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      
      {loading && <div className="absolute right-2 top-2">Ładowanie...</div>}

      {results.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border mt-1 rounded shadow-lg">
          {results.map((product) => (
            <li key={product.id} className="p-2 hover:bg-gray-100 cursor-pointer border-b">
              {product.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}