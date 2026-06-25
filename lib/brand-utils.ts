import { unstable_cache } from 'next/cache';
import { meiliClient } from '@/lib/meilisearch-client';

/**
 * Pobiera listę wszystkich marek z Meilisearch (facet "Pasuje do marki").
 * Cache'owane na 1h przez Next.js - zero dodatkowych zapytań przy każdym wejściu.
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
      // mapa: slug -> oryginalna nazwa marki
      // np. "deutz" -> "Deutz", "john-deere" -> "John Deere"
      const map: Record<string, string> = {};
      for (const brandName of Object.keys(dist)) {
        const slug = brandToSlug(brandName);
        if (slug) map[slug] = brandName;
      }
      return map;
    } catch (e) {
      console.error('getBrandsSet error:', e);
      return {};
    }
  },
  ['brands-set-v1'],
  { revalidate: 3600, tags: ['brands'] }
);

/**
 * Pobiera modele dla danej marki (facet zawężony do tej marki).
 * Cache per marka.
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
      const map: Record<string, string> = {};
      for (const modelName of Object.keys(dist)) {
        const slug = modelToSlug(modelName);
        if (slug) map[slug] = modelName;
      }
      return map;
    } catch (e) {
      console.error('getModelsForBrand error:', e);
      return {};
    }
  },
  ['models-for-brand-v1'],
  { revalidate: 3600, tags: ['models'] }
);

/**
 * Zamienia nazwę marki na slug URL.
 * "John Deere" -> "john-deere", "Massey Ferguson" -> "massey-ferguson"
 */
export function brandToSlug(brand: string): string {
  return brand
    .toLowerCase()
    .trim()
    .replace(/[ąàáâ]/g, 'a').replace(/[ćč]/g, 'c').replace(/[ęèé]/g, 'e')
    .replace(/[łl]/g, 'l').replace(/[ńñ]/g, 'n').replace(/[óòôö]/g, 'o')
    .replace(/[śš]/g, 's').replace(/[źżž]/g, 'z').replace(/[üû]/g, 'u')
    .replace(/[^a-z0-9]+/g, '-')   // wszystko inne na myślnik
    .replace(/^-+|-+$/g, '');       // usuń myślniki z brzegów
}

/**
 * Zamienia nazwę modelu na slug URL.
 * "C-360" -> "c-360", "6100" -> "6100", "Agrotron" -> "agrotron"
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

/**
 * Rozdziela segmenty ścieżki na: kategorie / marka / model.
 *
 * @param slugArray - segmenty z URL, np. ["silnik-i-osprzet", "deutz", "agrotron"]
 * @param categoryHandles - zbiór handle'i które są kategoriami
 * @param brandsMap - mapa slug->nazwa marki
 * @param modelsMap - mapa slug->nazwa modelu (dla rozpoznanej marki)
 *
 * Zwraca: { categorySegments, brandSlug, brandName, modelSlug, modelName }
 */
export interface ParsedPath {
  categorySegments: string[];
  brandSlug: string | null;
  brandName: string | null;
  modelSlug: string | null;
  modelName: string | null;
}

export function parsePathSegments(
  slugArray: string[],
  isCategoryHandle: (h: string) => boolean,
  brandsMap: Record<string, string>
): { categorySegments: string[]; brandSlug: string | null; brandName: string | null; remainingForModel: string | null } {
  const categorySegments: string[] = [];
  let brandSlug: string | null = null;
  let brandName: string | null = null;
  let remainingForModel: string | null = null;

  for (let i = 0; i < slugArray.length; i++) {
    const seg = slugArray[i];

    // jeśli to kategoria i jeszcze nie znaleźliśmy marki -> część ścieżki kategorii
    if (!brandSlug && isCategoryHandle(seg)) {
      categorySegments.push(seg);
      continue;
    }

    // jeśli jeszcze nie mamy marki, a segment jest marką -> to marka
    if (!brandSlug && brandsMap[seg]) {
      brandSlug = seg;
      brandName = brandsMap[seg];
      continue;
    }

    // jeśli mamy już markę, następny segment -> kandydat na model
    if (brandSlug && !remainingForModel) {
      remainingForModel = seg;
      continue;
    }
  }

  return { categorySegments, brandSlug, brandName, remainingForModel };
}