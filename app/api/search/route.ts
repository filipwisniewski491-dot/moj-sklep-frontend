import { NextResponse } from 'next/server';
import { Meilisearch } from 'meilisearch';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://panel.centrumrolnictwa.com";
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

const meiliClient = new Meilisearch({
  host: process.env.NEXT_PUBLIC_MEILISEARCH_HOST || '',
  apiKey: process.env.NEXT_PUBLIC_MEILISEARCH_API_KEY || '',
});

const corsHeaders = {
  'Cache-Control': 'no-store, max-age=0',
  'Content-Type': 'application/json'
};

const OPTIMIZED_FACETS = [
  'Pasuje do marki',
  'Pasuje do modelu',
  'Typ produktu',
  'Rodzaj',
  'Waga [kg]',
  'Napięcie [V]',
  'Strona zabudowy',
  'Ilość zębów',
  'Wymiary',
  'Średnica wewnętrzna [mm]',
  'Średnica zewnętrzna [mm]',
  'Zastosowanie'
];

function buildFilterValue(key: string, val: string): string {
  const values = String(val).split(',').map(v => v.trim()).filter(Boolean);
  if (values.length === 0) return '';
  const orConditions = values.map(v => `"${key}" = "${v.replace(/"/g, '\\"')}"`);
  return orConditions.length === 1 ? orConditions[0] : `(${orConditions.join(' OR ')})`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const searchQ = searchParams.get('q') || "";
  const fullPath = searchParams.get('fullPath');

  // Tryb wyszukiwarki globalnej
  if (searchQ && !fullPath) {
    try {
      const index = meiliClient.index('products');
      const searchResult = await index.search(searchQ, { limit: 6 });
      return NextResponse.json({ hits: searchResult.hits }, { headers: corsHeaders });
    } catch (error) {
      console.error('Błąd wyszukiwarki:', error);
      return NextResponse.json({ hits: [] }, { status: 500, headers: corsHeaders });
    }
  }

  if (!fullPath) {
    return NextResponse.json({ error: "Brak ścieżki" }, { status: 400, headers: corsHeaders });
  }

  const segments = fullPath.split('/').filter(Boolean);
  const currentHandle = segments[segments.length - 1];

  let allowedHandles: string[] = [currentHandle];

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (PUBLISHABLE_KEY) headers["x-publishable-api-key"] = PUBLISHABLE_KEY;

    const catRes = await fetch(
      `${MEDUSA_URL}/store/product-categories?handle=${encodeURIComponent(currentHandle)}`,
      { headers, next: { revalidate: 3600 } }
    );

    if (catRes.ok) {
      const catJson = await catRes.json();
      const currentCategory = catJson.product_categories?.[0];
      if (currentCategory) {
        const collectHandles = (cat: any) => {
          if (!cat) return;
          if (!allowedHandles.includes(cat.handle)) allowedHandles.push(cat.handle);
          if (cat.category_children?.length) cat.category_children.forEach(collectHandles);
        };
        collectHandles(currentCategory);
      }
    }
  } catch (error) {
    console.warn("Nie udało się pobrać kategorii z Medusy:", error);
  }

  const categoryFilterStr = `category_handles IN [${allowedHandles.map(h => `"${h}"`).join(', ')}]`;

  // Aktywne filtry użytkownika (bez systemowych kluczy)
  const SYSTEM_KEYS = new Set(['fullPath', 'limit', 'sort', 'minPrice', 'maxPrice', 'q', 'page', 'view']);
  const activeFilters: Record<string, string> = {};
  searchParams.forEach((val, key) => {
    if (!SYSTEM_KEYS.has(key) && val) activeFilters[key] = val;
  });

  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');

  // Pomocnik: buduje tablicę filtrów z OPCJONALNYM pominięciem jednego klucza
  const buildFilters = (skipKey?: string): string[] => {
    const arr: string[] = [categoryFilterStr];
    Object.entries(activeFilters).forEach(([key, val]) => {
      if (skipKey && key === skipKey) return; // pomiń ten filtr (disjunctive)
      const f = buildFilterValue(key, val);
      if (f) arr.push(f);
    });
    if (minPrice) arr.push(`price >= ${minPrice}`);
    if (maxPrice) arr.push(`price <= ${maxPrice}`);
    return arr;
  };

  const finalFilter = buildFilters().join(' AND ');

  const sortParam = searchParams.get('sort');
  let meiliSort: string[] | undefined;
  if (sortParam === 'price_asc') meiliSort = ['price:asc'];
  if (sortParam === 'price_desc') meiliSort = ['price:desc'];

  const currentLimit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 250;

  try {
    const index = meiliClient.index('products');

    // 1) Główne wyszukiwanie (produkty + facety zawężone wszystkim)
    // 2) Facety bazowe (tylko kategoria - dla pełnej listy wartości)
    const mainSearches: Promise<any>[] = [
      index.search(searchQ, {
        limit: currentLimit,
        filter: finalFilter,
        sort: meiliSort,
        facets: OPTIMIZED_FACETS,
      }),
      index.search(searchQ, {
        limit: 0,
        filter: categoryFilterStr,
        facets: OPTIMIZED_FACETS,
      }),
    ];

    // 3) DISJUNCTIVE: dla każdego AKTYWNEGO filtra osobne liczenie
    //    facetów z pominięciem tego filtra (żeby nie gasił sam siebie).
    //    Liczymy tylko dla aktywnych filtrów - dla nieaktywnych narrowed=zawężone wystarcza.
    const activeKeys = Object.keys(activeFilters);
    const disjunctivePromises = activeKeys.map(key =>
      index.search(searchQ, {
        limit: 0,
        filter: buildFilters(key).join(' AND '),  // wszystkie filtry OPRÓCZ "key"
        facets: [key],  // liczymy tylko facet tego jednego klucza
      })
    );

    const [searchResult, baseFacetsResult, ...disjunctiveResults] = await Promise.all([
      ...mainSearches,
      ...disjunctivePromises,
    ]);

    // Zbuduj mapę disjunctive: { "Napięcie [V]": {...wartości dla kontekstu bez napięcia} }
    const disjunctiveFacets: Record<string, any> = {};
    activeKeys.forEach((key, i) => {
      const res = disjunctiveResults[i];
      if (res?.facetDistribution?.[key]) {
        disjunctiveFacets[key] = res.facetDistribution[key];
      }
    });

    const mappedProducts = searchResult.hits.map((p: any) => ({
      id: p.id,
      sku: p.id,
      name: p.title,
      price: p.price || 0,
      slug: p.handle,
      category_text: p.Kategoria || p['Typ produktu'] || '',
      images: p.thumbnail ? [{ url: p.thumbnail }] : [],
    }));

    return NextResponse.json({
      products: mappedProducts,
      totalCount: searchResult.estimatedTotalHits || mappedProducts.length,
      filters: baseFacetsResult.facetDistribution || {},
      narrowedFilters: searchResult.facetDistribution || {},
      disjunctiveFacets,  // 🔥 NOWE: właściwe wartości per aktywny filtr
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error("Błąd Meilisearch route:", error?.message || error);
    return NextResponse.json(
      { products: [], filters: {}, narrowedFilters: {}, disjunctiveFacets: {}, totalCount: 0, error: error?.message },
      { status: 500, headers: corsHeaders }
    );
  }
}