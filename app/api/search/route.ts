import { NextResponse } from 'next/server';
import { Meilisearch } from 'meilisearch';
import { getBrandsSet, getModelsForBrand } from '@/lib/brand-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://panel.centrumrolnictwa.com";
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
const REGION_ID = process.env.NEXT_PUBLIC_MEDUSA_REGION_ID || "reg_01KT16M40467MTKK4ANCA96R25";

const meiliClient = new Meilisearch({
  host: process.env.NEXT_PUBLIC_MEILISEARCH_HOST || '',
  apiKey: process.env.NEXT_PUBLIC_MEILISEARCH_API_KEY || '',
});

const corsHeaders = {
  'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
  'Content-Type': 'application/json'
};

function buildFilterValue(key: string, val: string): string {
  const values = String(val).split(',').map(v => v.trim()).filter(Boolean);
  if (values.length === 0) return '';
  const orConditions = values.map(v => `"${key}" = "${v.replace(/"/g, '\\"')}"`);
  return orConditions.length === 1 ? orConditions[0] : `(${orConditions.join(' OR ')})`;
}

async function resolvePath(slugArray: string[]) {
  // Sciezka 1-segmentowa to czysta kategoria (np. "silnik-i-osprzet") - nie ma marki,
  // wiec nie wolamy getBrandsSet. Marki tylko gdy sciezka moze je zawierac (2+ segmenty).
  if (slugArray.length < 2) {
    return { categorySegments: slugArray, brandName: null, modelName: null };
  }
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

  if (searchQ && !fullPath) {
    try {
      const index = meiliClient.index('products');
      const searchResult = await index.search(searchQ, { limit: 6 });
      return NextResponse.json({ hits: searchResult.hits }, { headers: corsHeaders });
    } catch (error) {
      console.error('Blad wyszukiwarki:', error);
      return NextResponse.json({ hits: [] }, { status: 500, headers: corsHeaders });
    }
  }

  if (!fullPath) {
    return NextResponse.json({ error: "Brak sciezki" }, { status: 400, headers: corsHeaders });
  }

  const slugArray = fullPath.split('/').filter(Boolean);
  const { categorySegments, brandName, modelName } = await resolvePath(slugArray);

  const currentHandle = categorySegments.length > 0 ? categorySegments[categorySegments.length - 1] : '';

  // Kazdy produkt w Meili ma w category_handles CALA swoja sciezke kategorii,
  // wiec filtr po samym handle kategorii lapie wszystkie produkty z poddrzewa.
  // Nie trzeba pytac Medusy o dzieci - to eliminuje ~1s narzutu.
  const allowedHandles: string[] = currentHandle ? [currentHandle] : [];

  const baseFilterParts: string[] = [];
  if (allowedHandles.length > 0) {
    baseFilterParts.push(`category_handles IN [${allowedHandles.map(h => `"${h}"`).join(', ')}]`);
  }
  if (brandName) baseFilterParts.push(`"Pasuje do marki" = "${brandName.replace(/"/g, '\\"')}"`);
  if (modelName) baseFilterParts.push(`"Pasuje do modelu" = "${modelName.replace(/"/g, '\\"')}"`);

  const SYSTEM_KEYS = new Set(['fullPath', 'limit', 'sort', 'minPrice', 'maxPrice', 'q', 'page', 'view']);
  const activeFilters: Record<string, string> = {};
  const rangeFilters: string[] = [];
  searchParams.forEach((val, key) => {
    if (!val) return;
    if (key.startsWith('rmin_')) {
      const f = key.slice(5); const n = Number(val);
      if (Number.isFinite(n)) rangeFilters.push(`"n_${f.replace(/"/g, '\\"')}" >= ${n}`);
      return;
    }
    if (key.startsWith('rmax_')) {
      const f = key.slice(5); const n = Number(val);
      if (Number.isFinite(n)) rangeFilters.push(`"n_${f.replace(/"/g, '\\"')}" <= ${n}`);
      return;
    }
    if (!SYSTEM_KEYS.has(key)) activeFilters[key] = val;
  });

  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');

  const buildFilters = (skipKey?: string): string[] => {
    const arr: string[] = baseFilterParts.slice();
    Object.entries(activeFilters).forEach(([key, val]) => {
      if (skipKey && key === skipKey) return;
      const f = buildFilterValue(key, val);
      if (f) arr.push(f);
    });
    arr.push(...rangeFilters);
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

    // Glowne zapytanie (produkty + facety wg finalFilter) i baseDist (facety wg baseFilter) - RÓWNOLEGLE
    const mainSearch = async () => {
      try {
        return await index.search(searchQ, {
          limit: currentLimit, filter: finalFilter || undefined, sort: meiliSort, facets: ['*'],
        });
      } catch {
        return await index.search(searchQ, {
          limit: currentLimit, filter: finalFilter || undefined, sort: meiliSort,
        });
      }
    };
    const baseDistSearch = async () => {
      try {
        const probe = await index.search(searchQ, { limit: 0, filter: baseFilter || undefined, facets: ['*'] });
        return probe.facetDistribution || {};
      } catch {
        return {};
      }
    };

    const activeKeys = Object.keys(activeFilters);
    const disjunctiveSearch = async () => {
      const results = await Promise.all(activeKeys.map(async (key) => {
        try {
          return await index.search(searchQ, {
            limit: 0, filter: buildFilters(key).join(' AND ') || undefined, facets: [key],
          });
        } catch { return { facetDistribution: {} } as any; }
      }));
      const dj: Record<string, any> = {};
      activeKeys.forEach((key, i) => {
        const res = results[i];
        if (res?.facetDistribution?.[key]) dj[key] = res.facetDistribution[key];
      });
      return dj;
    };

    // Wszystko naraz: produkty, facety bazowe, facety disjunktywne
    const [searchResult, baseDist, disjunctiveFacets] = await Promise.all([
      mainSearch(),
      baseDistSearch(),
      disjunctiveSearch(),
    ]);

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
      filters: baseDist || {},
      narrowedFilters: searchResult.facetDistribution || {},
      disjunctiveFacets,
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error("Blad Meilisearch route:", error?.message || error);
    return NextResponse.json(
      { products: [], filters: {}, narrowedFilters: {}, disjunctiveFacets: {}, totalCount: 0, error: error?.message },
      { status: 500, headers: corsHeaders }
    );
  }
}