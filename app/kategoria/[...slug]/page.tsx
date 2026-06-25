import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { meiliClient } from '@/lib/meilisearch-client';
import { getBrandsSet, getModelsForBrand, brandToSlug, modelToSlug } from '@/lib/brand-utils';

import Header from '@/components/Header';
import MobileBottomNav from '@/components/MobileBottomNav';
import CategoryHeader from '@/components/CategoryHeader';
import CategoryWorkspace from '@/components/CategoryWorkspace';

const DynamicFooter = dynamic(() => import('@/components/Footer'));
const DynamicFaqSection = dynamic(() => import('@/components/FaqSection'));
const DynamicSeoSection = dynamic(() => import('@/components/SeoSection'));

export const revalidate = 3600;
const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://panel.centrumrolnictwa.com";
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
const SITE_URL = "https://centrumrolnictwa.com";

const OPTIMIZED_FACETS = [
  'Pasuje do marki', 'Pasuje do modelu', 'Typ produktu',
  'Rodzaj', 'Waga [kg]', 'Napięcie [V]', 'Strona zabudowy',
  'Ilość zębów', 'Wymiary', 'Średnica wewnętrzna [mm]', 'Średnica zewnętrzna [mm]', 'Zastosowanie'
];

const MIN_PRODUCTS_FOR_INDEX = 3;

function buildFilterValue(key: string, val: string): string {
  const values = String(val).split(',').map(v => v.trim()).filter(Boolean);
  if (values.length === 0) return '';
  const orConditions = values.map(v => `"${key}" = "${v.replace(/"/g, '\\"')}"`);
  return orConditions.length === 1 ? orConditions[0] : `(${orConditions.join(' OR ')})`;
}

async function resolvePath(slugArray: string[]) {
  const brandsMap = await getBrandsSet();

  let categorySegments: string[] = [];
  let brandSlug: string | null = null;
  let brandName: string | null = null;
  let modelSlug: string | null = null;
  let modelName: string | null = null;

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
    if (!modelName) modelSlug = null;
  }

  return { categorySegments, brandSlug, brandName, modelSlug, modelName };
}

export async function generateMetadata({ params }: any): Promise<Metadata> {
  const resolvedParams = await params;
  const slugArray = Array.isArray(resolvedParams?.slug) ? resolvedParams.slug : [resolvedParams?.slug].filter(Boolean);

  const { categorySegments, brandName, modelName } = await resolvePath(slugArray);

  const categoryHandle = categorySegments[categorySegments.length - 1] || '';
  let categoryName = categoryHandle.replace(/-/g, ' ');

  try {
    const headers: any = { "Content-Type": "application/json" };
    if (PUBLISHABLE_KEY) headers["x-publishable-api-key"] = PUBLISHABLE_KEY;
    const res = await fetch(`${MEDUSA_URL}/store/product-categories?handle=${encodeURIComponent(categoryHandle)}`, {
      headers, next: { revalidate: 3600 }
    });
    if (res.ok) {
      const json = await res.json();
      if (json.product_categories?.[0]) categoryName = json.product_categories[0].name;
    }
  } catch {}

  let productCount = 0;
  try {
    const index = meiliClient.index('products');
    const filterParts: string[] = [];
    if (categoryHandle) filterParts.push(`category_handles = "${categoryHandle}"`);
    if (brandName) filterParts.push(`"Pasuje do marki" = "${brandName.replace(/"/g, '\\"')}"`);
    if (modelName) filterParts.push(`"Pasuje do modelu" = "${modelName.replace(/"/g, '\\"')}"`);
    const r = await index.search('', { limit: 0, filter: filterParts.join(' AND '), hitsPerPage: 1 } as any);
    productCount = (r as any).totalHits ?? r.estimatedTotalHits ?? 0;
  } catch {}

  const baseStartsWithCzesci = /^części/i.test(categoryName);
  const prefix = baseStartsWithCzesci ? '' : 'Części do ';

  let title: string;
  let description: string;
  let canonicalPath = '/kategoria/' + slugArray.join('/');

  if (brandName && modelName) {
    title = `${prefix}${categoryName} ${brandName} ${modelName} | CentrumRolnictwa.pl`;
    description = `Części zamienne do ${categoryName.toLowerCase()} ${brandName} ${modelName}. Gwarancja dopasowania, szybka wysyłka.${productCount > 0 ? ` ${productCount} produktów.` : ''}`;
  } else if (brandName) {
    title = `${prefix}${categoryName} ${brandName} | CentrumRolnictwa.pl`;
    description = `Części zamienne do ${categoryName.toLowerCase()} ${brandName}. Szeroki wybór, gwarancja dopasowania, szybka wysyłka.${productCount > 0 ? ` ${productCount} produktów w ofercie.` : ''}`;
  } else {
    title = `${categoryName} | CentrumRolnictwa.pl`;
    description = `Części zamienne - ${categoryName.toLowerCase()}. Szeroki wybór komponentów zgodnych z OEM. Gwarancja dopasowania i niezawodności.`;
  }

  const isBrandOrModelPage = !!brandName;
  const shouldIndex = !isBrandOrModelPage || productCount >= MIN_PRODUCTS_FOR_INDEX;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    robots: shouldIndex ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { title, description, url: SITE_URL + canonicalPath, type: 'website' },
  };
}

export default async function CategoryPage({ params, searchParams }: any) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const slugArray = Array.isArray(resolvedParams?.slug) ? resolvedParams.slug : [resolvedParams?.slug].filter(Boolean);
  const fullPath = slugArray.join('/');

  const { categorySegments, brandSlug, brandName, modelSlug, modelName } = await resolvePath(slugArray);

  const currentHandle = categorySegments.length > 0 ? categorySegments[categorySegments.length - 1] : '';

  let dbCategoryData: any = {
    h1_dynamic: currentHandle.toUpperCase().replace(/-/g, ' '),
    name: currentHandle.replace(/-/g, ' '),
    top_seo_text: "",
    bottom_seo_text: "",
    faqs: []
  };
  let allowedHandles: string[] = currentHandle ? [currentHandle] : [];
  let currentCategory: any = null;

  try {
    const headers: any = { "Content-Type": "application/json" };
    if (PUBLISHABLE_KEY) headers["x-publishable-api-key"] = PUBLISHABLE_KEY;

    const res = await fetch(`${MEDUSA_URL}/store/product-categories?handle=${encodeURIComponent(currentHandle)}`, {
      headers,
      next: { revalidate: 3600 }
    });

    if (res.ok) {
      const json = await res.json();
      currentCategory = json.product_categories?.[0];
      if (currentCategory) {
        const meta = currentCategory.metadata || {};
        dbCategoryData.name = currentCategory.name;
        dbCategoryData.h1_dynamic = meta.h1_dynamic || currentCategory.name.toUpperCase();
        dbCategoryData.top_seo_text = meta.top_seo_text || currentCategory.description || "";
        dbCategoryData.bottom_seo_text = meta.bottom_seo_text || null;
        dbCategoryData.faqs = meta.faqs || meta.faq || [];

        const collectHandles = (cat: any) => {
          if (!cat) return;
          if (allowedHandles.length < 100) {
            if (!allowedHandles.includes(cat.handle)) allowedHandles.push(cat.handle);
            if (cat.category_children) cat.category_children.forEach(collectHandles);
          }
        };
        collectHandles(currentCategory);
      }
    }
  } catch (error) {
    console.warn("Błąd SEO Medusy, używam fallbacku");
  }

  // 🔥 DYNAMICZNY H1 i tekst SEO - bez dublowania "Części do"
  const baseName = (dbCategoryData.name || currentHandle.replace(/-/g, ' ')).trim();
  const baseStartsWithCzesci = /^części/i.test(baseName);
  const prefix = baseStartsWithCzesci ? '' : 'Części do ';

  if (brandName && modelName) {
    dbCategoryData.h1_dynamic = `${prefix}${baseName} ${brandName} ${modelName}`.trim();
    dbCategoryData.top_seo_text = `Szukasz części do ${baseName.toLowerCase()} ${brandName} ${modelName}? Mamy szeroki wybór komponentów dopasowanych do tego modelu, zgodnych z OEM. Gwarancja dopasowania i szybka wysyłka.`;
  } else if (brandName) {
    dbCategoryData.h1_dynamic = `${prefix}${baseName} ${brandName}`.trim();
    dbCategoryData.top_seo_text = `Części zamienne do ${baseName.toLowerCase()} marki ${brandName}. Szeroki wybór komponentów zgodnych z OEM, gwarancja dopasowania i niezawodności. Szybka wysyłka i wsparcie techniczne.`;
  }

  const breadcrumbs: any[] = categorySegments.map((s: string, i: number) => ({
    name: s.replace(/-/g, ' ').toUpperCase(),
    slug: s,
    path: categorySegments.slice(0, i + 1).join('/')
  }));
  if (brandName) {
    breadcrumbs.push({
      name: brandName.toUpperCase(),
      slug: brandSlug,
      path: [...categorySegments, brandSlug].join('/')
    });
  }
  if (modelName) {
    breadcrumbs.push({
      name: modelName.toUpperCase(),
      slug: modelSlug,
      path: [...categorySegments, brandSlug, modelSlug].join('/')
    });
  }

  const searchData = {
    category: dbCategoryData,
    breadcrumbs,
    subcategories: currentCategory?.category_children?.map((c: any) => c.name) || []
  };

  const index = meiliClient.index('products');

  const categoryFilterStr = allowedHandles.length > 0
    ? `category_handles IN [${allowedHandles.map(h => `"${h}"`).join(', ')}]`
    : '';

  const baseFilterParts: string[] = [];
  if (categoryFilterStr) baseFilterParts.push(categoryFilterStr);
  if (brandName) baseFilterParts.push(`"Pasuje do marki" = "${brandName.replace(/"/g, '\\"')}"`);
  if (modelName) baseFilterParts.push(`"Pasuje do modelu" = "${modelName.replace(/"/g, '\\"')}"`);
  const baseFilter = baseFilterParts.join(' AND ');

  let initialData: any = { filters: {}, narrowedFilters: {}, products: [], totalCount: 0 };

  try {
    const filterArray: string[] = baseFilterParts.slice();
    const activeFilters = { ...resolvedSearchParams };
    ['fullPath', 'limit', 'sort', 'minPrice', 'maxPrice', 'q', 'page', 'view'].forEach(k => delete activeFilters[k]);

    Object.entries(activeFilters).forEach(([key, val]) => {
      if (!val) return;
      const f = buildFilterValue(key, val as string);
      if (f) filterArray.push(f);
    });

    if (resolvedSearchParams.minPrice) filterArray.push(`price >= ${resolvedSearchParams.minPrice}`);
    if (resolvedSearchParams.maxPrice) filterArray.push(`price <= ${resolvedSearchParams.maxPrice}`);

    const sortParam = resolvedSearchParams.sort;
    let meiliSort = undefined;
    if (sortParam === 'price_asc') meiliSort = ['price:asc'];
    if (sortParam === 'price_desc') meiliSort = ['price:desc'];

    const [baseFacetsResult, searchResult] = await Promise.all([
      index.search(resolvedSearchParams.q || "", { limit: 0, filter: baseFilter || undefined, facets: OPTIMIZED_FACETS }),
      index.search(resolvedSearchParams.q || "", {
        limit: resolvedSearchParams.limit ? parseInt(resolvedSearchParams.limit) : 250,
        filter: filterArray.join(' AND ') || undefined,
        sort: meiliSort,
        facets: OPTIMIZED_FACETS
      })
    ]);

    initialData = {
      filters: baseFacetsResult.facetDistribution || {},
      narrowedFilters: searchResult.facetDistribution || {},
      products: searchResult.hits.map((p: any) => ({
        id: p.id, sku: p.id, name: p.title, price: p.price || 0, slug: p.handle,
        category_text: p.Kategoria || p['Typ produktu'] || '', images: p.thumbnail ? [{ url: p.thumbnail }] : []
      })),
      totalCount: searchResult.estimatedTotalHits || 0
    };
  } catch (e) {
    console.error("Meilisearch server error:", e);
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", position: 1, name: "Start", item: SITE_URL },
      ...breadcrumbs.map((b, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: b.name,
        item: `${SITE_URL}/kategoria/${b.path}`
      }))
    ]
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-36 md:pb-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Header />
      <CategoryHeader initialData={searchData} searchParams={resolvedSearchParams} fullPath={fullPath} topSeoText={dbCategoryData.top_seo_text} />

      <CategoryWorkspace
        key={fullPath}
        initialData={initialData}
        fullPath={fullPath}
        currentHandle={currentHandle}
        allowedHandles={allowedHandles}
        categoryPath={categorySegments.join('/')}
        currentBrandSlug={brandSlug}
        currentBrandName={brandName}
        currentModelSlug={modelSlug}
      />

      {dbCategoryData.bottom_seo_text && <DynamicSeoSection text={dbCategoryData.bottom_seo_text} />}
      {dbCategoryData.faqs && dbCategoryData.faqs.length > 0 && <DynamicFaqSection faqs={dbCategoryData.faqs} />}
      <MobileBottomNav />
      <DynamicFooter />
    </div>
  );
}