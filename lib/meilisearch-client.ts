import { Meilisearch } from 'meilisearch';

// Inicjalizacja klienta z użyciem zmiennych z Twojego .env.local
export const meiliClient = new Meilisearch({
  host: process.env.NEXT_PUBLIC_MEILISEARCH_HOST || '',
  apiKey: process.env.NEXT_PUBLIC_MEILISEARCH_API_KEY || '',
});