import { NextResponse } from 'next/server';
import { Meilisearch } from 'meilisearch';
import { getBrandsSet, getModelsForBrand } from '@/lib/brand-utils';

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

// 🔥 Rozpoznaje markę/model w ścieżce (identycznie jak page.tsx resolvePath)
async function resolvePath(slugArray: string[]) {
  const brandsMap = await getBrandsSet();
  let categorySegments: string[] = [];
  let brandName: string | null = null;
  let modelSlug: string | null = null;
  let modelName: string | null = null;
  let brandSlug: string | null = null;

  for (let i = 0; i < slugArray.length; i++) {
    const seg = slugArray[i];
    if (!brandSlug && brandsMap[seg]) {
      brandSlug = seg;
      brandName = brandsMap[seg];
    } else if (brandSlug && !modelSlug) {
      modelSlug = seg;
    } else if (!brandSlug) {
      categorySegments.push(seg);
    }
  }

  if (brandName && modelSlug) {
    const modelsMap = await getModelsForBrand(brandName);
    modelName = modelsMap[modelSlug] || null;
  }

  return { categorySegments, brandName, modelName };
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

  // 🔥 Rozpoznaj markę/model w ścieżce, oddziel od kategorii
  const slugArray = fullPath.split('/').filter(Boolean);
  const { categorySegments, brandName, modelName } = await resolvePath(slugArray);

  // Kategoria = ostatni segment kategorii (BEZ marki/modelu)
  const currentHandle = categorySegments.length > 0 ? categorySegments[categorySegments.length - 1] : '';

  // Zbieramy handle kategorii + dzieci z Medusy
  let allowedHandles: string[] = currentHandle ? [currentHandle] : [];

  if (currentHandle) {
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
  }

  // Filtr bazowy: kategoria + marka + model (marka/model z URL, NIE category_handle)
  const baseFilterParts: string[] = [];
  if (allowedHandles.length > 0) {
    baseFilterParts.push(`category_handles IN [${allowedHandles.map(h => `"${h}"`).join(', ')}]`);
  }
  if (brandName) baseFilterParts.push(`"Pasuje do marki" = "${brandName.replace(/"/g, '\\"')}"`);
  if (modelName) baseFilterParts.push(`"Pasuje do modelu" = "${modelName.replace(/"/g, '\\"')}"`);

  // Aktywne filtry użytkownika (techniczne, bez systemowych)
  const SYSTEM_KEYS = new Set(['fullPath', 'limit', 'sort', 'minPrice', 'maxPrice', 'q', 'page', 'view']);
  const activeFilters: Record<string, string> = {};
  searchParams.forEach((val, key) => {
    if (!SYSTEM_KEYS.has(key) && val) activeFilters[key] = val;
  });

  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');

  // Buduje filtry z OPCJONALNYM pominięciem jednego klucza (disjunctive)
  const buildFilters = (skipKey?: string): string[] => {
    const arr: string[] = baseFilterParts.slice();
    Object.entries(activeFilters).forEach(([key, val]) => {
      if (skipKey && key === skipKey) return;
      const f = buildFilterValue(key, val);
      if (f) arr.push(f);
    });
    if (minPrice) arr.push(`price >= ${minPrice}`);
    if (maxPrice) arr.push(`price <= ${maxPrice}`);
    return arr;
  };

  const baseFilter = baseFilterParts.join(' AND ');
  const finalFilter = buildFilters().join(' AND ');

  const sortParam = searchParams.get('sort');
  let meiliSort: string[] | undefined;
  if (sortParam === 'price_asc') meiliSort = ['price:asc'];
  if (sortParam === 'price_desc') meiliSort = ['price:desc'];

  const currentLimit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 250;

  try {
    const index = meiliClient.index('products');

    const mainSearches: Promise<any>[] = [
      index.search(searchQ, {
        limit: currentLimit,
        filter: finalFilter || undefined,
        sort: meiliSort,
        facets: OPTIMIZED_FACETS,
      }),
      index.search(searchQ, {
        limit: 0,
        filter: baseFilter || undefined,
        facets: OPTIMIZED_FACETS,
      }),
    ];

    // Disjunctive: osobne facety per aktywny filtr (z pominięciem siebie)
    const activeKeys = Object.keys(activeFilters);
    const disjunctivePromises = activeKeys.map(key =>
      index.search(searchQ, {
        limit: 0,
        filter: buildFilters(key).join(' AND ') || undefined,
        facets: [key],
      })
    );

    const [searchResult, baseFacetsResult, ...disjunctiveResults] = await Promise.all([
      ...mainSearches,
      ...disjunctivePromises,
    ]);

    const disjunctiveFacets: Record<string, any> = {};
    activeKeys.forEach((key, i) => {
      const res = disjunctiveResults[i];
      if (res?.facetDistribution?.[key]) {
        disjunctiveFacets[key] = res.facetDistribution[key];
      }
    });

    console.log(`[search] handle=${currentHandle} brand=${brandName} model=${modelName} hits=${searchResult.hits.length}`);

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
      disjunctiveFacets,
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error("Błąd Meilisearch route:", error?.message || error);
    return NextResponse.json(
      { products: [], filters: {}, narrowedFilters: {}, disjunctiveFacets: {}, totalCount: 0, error: error?.message },
      { status: 500, headers: corsHeaders }
    );
  }
}