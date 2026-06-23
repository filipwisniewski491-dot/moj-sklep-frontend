import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { meiliClient } from '@/lib/meilisearch-client';

import Header from '@/components/Header';
import MobileBottomNav from '@/components/MobileBottomNav';
import CategoryHeader from '@/components/CategoryHeader';
import CategoryFilters from '@/components/CategoryFilters';
import CategoryToolbar from '@/components/CategoryToolbar';
import ProductGrid from '@/components/ProductGrid';

const DynamicFooter = dynamic(() => import('@/components/Footer'));
const DynamicFaqSection = dynamic(() => import('@/components/FaqSection'));
const DynamicSeoSection = dynamic(() => import('@/components/SeoSection'));

export const revalidate = 0; 
const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://178.104.130.90:9000";
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

export default async function CategoryPage({ params, searchParams }: any) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const slugArray = Array.isArray(resolvedParams?.slug) ? resolvedParams.slug : [resolvedParams?.slug].filter(Boolean);
  const fullPath = slugArray.join('/');
  const currentHandle = slugArray.length > 0 ? slugArray[slugArray.length - 1] : '';

  let dbCategoryData = { h1_dynamic: currentHandle.toUpperCase().replace(/-/g, ' '), name: currentHandle.replace(/-/g, ' '), top_seo_text: "", bottom_seo_text: "", faqs: [] };
  let allowedHandles: string[] = [currentHandle];
  let currentCategory: any = null;

  // 1. SZYBKIE POBRANIE SEO Z MEDUSY
  try {
    const headers: any = { "Content-Type": "application/json" };
    if (PUBLISHABLE_KEY) headers["x-publishable-api-key"] = PUBLISHABLE_KEY;
    const res = await fetch(`${MEDUSA_URL}/store/product-categories?handle=${encodeURIComponent(currentHandle)}`, { headers, cache: 'no-store' });
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
          if (!allowedHandles.includes(cat.handle)) allowedHandles.push(cat.handle);
          if (cat.category_children) cat.category_children.forEach(collectHandles);
        };
        collectHandles(currentCategory);
      }
    }
  } catch (error) {
    console.warn("Błąd SEO Medusy, używam fallbacku");
  }

  // 2. LOGIKA FILTRÓW I PRODUKTÓW Z MEILISEARCH (DIRECT SERVER CALL)
  let products: any[] = [];
  let baseFilters: any = {};
  let narrowedFilters: any = {};
  let totalCount = 0;

  try {
    const activeFilters = { ...resolvedSearchParams };
    ['fullPath', 'limit', 'sort', 'minPrice', 'maxPrice', 'q', 'page', 'view'].forEach(k => delete activeFilters[k]);

    const index = meiliClient.index('products');
    const categoryFilterStr = allowedHandles.length > 0 
      ? `category_handle IN [${allowedHandles.map(h => JSON.stringify(h)).join(', ')}]`
      : `category_handle = ${JSON.stringify(currentHandle)}`;

    // ZAPYTANIE 1: Struktura całej kategorii (żeby liczniki w menu miały sens i nie wynosiły "1")
    const baseFacetsResult = await index.search(resolvedSearchParams.q || "", {
      limit: 0,
      filter: categoryFilterStr,
      facets: ['*'] 
    });
    baseFilters = baseFacetsResult.facetDistribution || {};

    // ZAPYTANIE 2: Właściwe produkty po filtrach
    const filterArray: string[] = [categoryFilterStr];
    Object.entries(activeFilters).forEach(([key, val]) => {
      if (val) filterArray.push(`'${key}' = ${JSON.stringify(val)}`);
    });

    const sortParam = resolvedSearchParams.sort;
    let meiliSort = undefined;
    if (sortParam === 'price_asc') meiliSort = ['price:asc'];
    if (sortParam === 'price_desc') meiliSort = ['price:desc'];

    const searchResult = await index.search(resolvedSearchParams.q || "", {
      limit: resolvedSearchParams.limit ? parseInt(resolvedSearchParams.limit) : 250,
      filter: filterArray.join(' AND '),
      sort: meiliSort,
      facets: ['*']
    });

    products = searchResult.hits.map((p: any) => ({
      id: p.id, sku: p.id, name: p.title, price: p.price || 0, slug: p.handle,
      category_text: p.Kategoria || '', images: p.thumbnail ? [{ url: p.thumbnail }] : []
    }));

    totalCount = searchResult.estimatedTotalHits || products.length;
    narrowedFilters = searchResult.facetDistribution || {};

  } catch (error) {
    console.error("Błąd zapytania Meilisearch:", error);
  }

  const breadcrumbs = slugArray.map((s, i) => ({ 
    name: s.replace(/-/g, ' ').toUpperCase(), slug: s, path: slugArray.slice(0, i + 1).join('/') 
  }));

  const searchData = { category: dbCategoryData, breadcrumbs, subcategories: currentCategory?.category_children?.map((c: any) => c.name) || [] };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-36 md:pb-0">
      <Header />
      <CategoryHeader initialData={searchData} searchParams={resolvedSearchParams} fullPath={fullPath} topSeoText={dbCategoryData.top_seo_text} /> 
      <main className="max-w-7xl mx-auto px-4 py-6 lg:py-12 flex flex-col lg:flex-row gap-8 lg:gap-12 relative z-10">
        <aside className="w-full lg:w-80 flex-shrink-0">
          <CategoryFilters 
            baseFilters={baseFilters} 
            narrowedFilters={narrowedFilters}
            totalCount={totalCount} 
          />
        </aside>
        <div className="flex-1 flex flex-col min-h-[500px]">
          <CategoryToolbar totalCount={totalCount} />
          <ProductGrid 
            initialProducts={products} 
            totalCount={totalCount} 
            fullPath={fullPath} 
            isListView={resolvedSearchParams?.view === 'list'}
          />
          {dbCategoryData.bottom_seo_text && <DynamicSeoSection text={dbCategoryData.bottom_seo_text} />}
          {dbCategoryData.faqs && dbCategoryData.faqs.length > 0 && <DynamicFaqSection faqs={dbCategoryData.faqs} />}
        </div>
      </main>
      <MobileBottomNav />
      <DynamicFooter />
    </div>
  );
}