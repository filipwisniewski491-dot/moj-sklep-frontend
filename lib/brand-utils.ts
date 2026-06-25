import { unstable_cache } from 'next/cache';
import { meiliClient } from '@/lib/meilisearch-client';

/**
 * Pobiera listę wszystkich marek z Meilisearch (facet "Pasuje do marki").
 * Cache'owane na 1h. Przy konflikcie slugów (np. "Deutz" i "Deutz'")
 * wybiera markę z NAJWIĘKSZĄ liczbą produktów (czyli czystą wersję).
 */
export const getBrandsSet = unstable_cache(
  async (): Promise<Record<string, string>> => {
    try {
      const index = meiliClient.index('products');
      const res = await index.search('', {
        limit: 0,
        facets: ['Pasuje do marki'],
      });
      const dist = (res.facetDistribution?.['Pasuje do marki']) || {};
      const best: Record<string, { name: string; count: number }> = {};
      for (const [brandName, count] of Object.entries(dist)) {
        const slug = brandToSlug(brandName);
        if (!slug) continue;
        const cnt = count as number;
        const existing = best[slug];
        // preferuj: więcej produktów; przy remisie krótszą (czystszą) nazwę
        if (!existing || cnt > existing.count ||
            (cnt === existing.count && brandName.length < existing.name.length)) {
          best[slug] = { name: brandName, count: cnt };
        }
      }
      const map: Record<string, string> = {};
      for (const [slug, v] of Object.entries(best)) map[slug] = v.name;
      return map;
    } catch (e) {
      console.error('getBrandsSet error:', e);
      return {};
    }
  },
  ['brands-set-v2'],
  { revalidate: 3600, tags: ['brands'] }
);

/**
 * Pobiera modele dla danej marki (facet zawężony do tej marki).
 * Przy konflikcie slugów wybiera model z największą liczbą produktów.
 */
export const getModelsForBrand = unstable_cache(
  async (brandName: string): Promise<Record<string, string>> => {
    try {
      const index = meiliClient.index('products');
      const res = await index.search('', {
        limit: 0,
        filter: `"Pasuje do marki" = "${brandName.replace(/"/g, '\\"')}"`,
        facets: ['Pasuje do modelu'],
      });
      const dist = (res.facetDistribution?.['Pasuje do modelu']) || {};
      const best: Record<string, { name: string; count: number }> = {};
      for (const [modelName, count] of Object.entries(dist)) {
        const slug = modelToSlug(modelName);
        if (!slug) continue;
        const cnt = count as number;
        const existing = best[slug];
        if (!existing || cnt > existing.count ||
            (cnt === existing.count && modelName.length < existing.name.length)) {
          best[slug] = { name: modelName, count: cnt };
        }
      }
      const map: Record<string, string> = {};
      for (const [slug, v] of Object.entries(best)) map[slug] = v.name;
      return map;
    } catch (e) {
      console.error('getModelsForBrand error:', e);
      return {};
    }
  },
  ['models-for-brand-v2'],
  { revalidate: 3600, tags: ['models'] }
);

/**
 * Zamienia nazwę marki na slug URL.
 * "John Deere" -> "john-deere", "Deutz'" -> "deutz"
 */
export function brandToSlug(brand: string): string {
  return brand
    .toLowerCase()
    .trim()
    .replace(/[ąàáâ]/g, 'a').replace(/[ćč]/g, 'c').replace(/[ęèé]/g, 'e')
    .replace(/[łl]/g, 'l').replace(/[ńñ]/g, 'n').replace(/[óòôö]/g, 'o')
    .replace(/[śš]/g, 's').replace(/[źżž]/g, 'z').replace(/[üû]/g, 'u')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Zamienia nazwę modelu na slug URL.
 */
export function modelToSlug(model: string): string {
  return model
    .toLowerCase()
    .trim()
    .replace(/[ąàáâ]/g, 'a').replace(/[ćč]/g, 'c').replace(/[ęèé]/g, 'e')
    .replace(/[łl]/g, 'l').replace(/[ńñ]/g, 'n').replace(/[óòôö]/g, 'o')
    .replace(/[śš]/g, 's').replace(/[źżž]/g, 'z').replace(/[üû]/g, 'u')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}