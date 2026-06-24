import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { meiliClient } from '@/lib/meilisearch-client';

import Header from '@/components/Header';
import MobileBottomNav from '@/components/MobileBottomNav';
import CategoryHeader from '@/components/CategoryHeader';
import CategoryFilters from '@/components/CategoryFilters';
import CategoryToolbar from '@/components/CategoryToolbar';
import ProductGrid from '@/components/ProductGrid';
import ProductGridSkeleton from '@/components/ProductGridSkeleton';

const DynamicFooter = dynamic(() => import('@/components/Footer'));
const DynamicFaqSection = dynamic(() => import('@/components/FaqSection'));
const DynamicSeoSection = dynamic(() => import('@/components/SeoSection'));

// 🔥 USUNIĘTO `export const revalidate = 3600;` z tego miejsca, żeby odblokować filtry (URL)!

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

  try {
    const headers: any = { "Content-Type": "application/json" };
    if (PUBLISHABLE_KEY) headers["x-publishable-api-key"] = PUBLISHABLE_KEY;
    
    // 🔥 TUTAJ ZOSTAWILIŚMY CACHE: Czasochłonne drzewo Medusy wciąż ładuje się w 0.05 sekundy!
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
          if (!allowedHandles.includes(cat.handle)) allowedHandles.push(cat.handle);
          if (cat.category_children) cat.category_children.forEach(collectHandles);
        };
        collectHandles(currentCategory);
      }
    }
  } catch (error) {
    console.warn("Błąd SEO Medusy, używam fallbacku");
  }

  const breadcrumbs = slugArray.map((s, i) => ({ 
    name: s.replace(/-/g, ' ').toUpperCase(), slug: s, path: slugArray.slice(0, i + 1).join('/') 
  }));

  const searchData = { category: dbCategoryData, breadcrumbs, subcategories: currentCategory?.category_children?.map((c: any) => c.name) || [] };

  // Tworzymy unikalny klucz dla Suspense na podstawie parametrów URL (żeby Next.js wiedział, że filtry się zmieniły)
  const searchParamsString = new URLSearchParams(resolvedSearchParams as Record<string, string>).toString();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-36 md:pb-0">
      <Header />
      <CategoryHeader initialData={searchData} searchParams={resolvedSearchParams} fullPath={fullPath} topSeoText={dbCategoryData.top_seo_text} /> 
      <main className="max-w-7xl mx-auto px-4 py-6 lg:py-12 flex flex-col lg:flex-row gap-8 lg:gap-12 relative z-10">
        
        {/* 🔥 SUSPENSE KEY: Błyskawiczne ładowanie z reakcją na filtry URL */}
        <Suspense key={searchParamsString} fallback={<CategoryLoadingSkeleton />}>
          <CategoryDataLoader 
            currentHandle={currentHandle} 
            allowedHandles={allowedHandles} 
            resolvedSearchParams={resolvedSearchParams} 
            fullPath={fullPath} 
          />
        </Suspense>

      </main>
      {dbCategoryData.bottom_seo_text && <DynamicSeoSection text={dbCategoryData.bottom_seo_text} />}
      {dbCategoryData.faqs && dbCategoryData.faqs.length > 0 && <DynamicFaqSection faqs={dbCategoryData.faqs} />}
      <MobileBottomNav />
      <DynamicFooter />
    </div>
  );
}

// ----------------------------------------------------
// KOMPONENTY WEWNĘTRZNE DO SZYBKIEGO RENDEROWANIA
// ----------------------------------------------------

function CategoryLoadingSkeleton() {
  return (
     <>
        <aside className="w-full lg:w-80 flex-shrink-0">
           <div className="h-[600px] bg-slate-200/50 rounded-[32px] w-full animate-pulse border border-slate-100"></div>
        </aside>
        <div className="flex-1 flex flex-col gap-6">
           <div className="h-16 bg-slate-200/50 rounded-2xl w-full animate-pulse"></div>
           <ProductGridSkeleton />
        </div>
     </>
  )
}

async function CategoryDataLoader({ currentHandle, allowedHandles, resolvedSearchParams, fullPath }: any) {
  let products: any[] = [];
  let baseFilters: any = {};
  let narrowedFilters: any = {};
  let totalCount = 0;

  try {
    const activeFilters = { ...resolvedSearchParams };
    ['fullPath', 'limit', 'sort', 'minPrice', 'maxPrice', 'q', 'page', 'view'].forEach(k => delete activeFilters[k]);

    const index = meiliClient.index('products');
    
    // Filtrowanie po drzewie
    const categoryFilterStr = allowedHandles.length > 0 
      ? `category_handles IN [${allowedHandles.map((h: string) => JSON.stringify(h)).join(', ')}]`
      : `category_handles = ${JSON.stringify(currentHandle)}`;

    // Zapytanie #1: Liczniki dla całego drzewa
    const baseFacetsResult = await index.search(resolvedSearchParams.q || "", {
      limit: 0,
      filter: categoryFilterStr,
      facets: ['*'] 
    });
    baseFilters = baseFacetsResult.facetDistribution || {};

    const filterArray: string[] = [categoryFilterStr];
    
    // Logika OR dla multi-select
    Object.entries(activeFilters).forEach(([key, val]) => {
      const values = String(val).split(',').map(v => v.trim()).filter(Boolean);
      if (values.length > 0) {
        const orConditions = values.map(v => `'${key}' = ${JSON.stringify(v)}`);
        filterArray.push(`(${orConditions.join(' OR ')})`);
      }
    });

    const sortParam = resolvedSearchParams.sort;
    let meiliSort = undefined;
    if (sortParam === 'price_asc') meiliSort = ['price:asc'];
    if (sortParam === 'price_desc') meiliSort = ['price:desc'];

    // Zapytanie #2: Zwężone produkty
    const searchResult = await index.search(resolvedSearchParams.q || "", {
      limit: resolvedSearchParams.limit ? parseInt(resolvedSearchParams.limit) : 250,
      filter: filterArray.join(' AND '),
      sort: meiliSort,
      facets: ['*']
    });

    // Zdjęcia poprawnie zmapowane
    products = searchResult.hits.map((p: any) => ({
      id: p.id, sku: p.id, name: p.title, price: p.price || 0, slug: p.handle,
      category_text: p.Kategoria || '', 
      images: p.thumbnail ? [{ url: p.thumbnail }] : []
    }));

    totalCount = searchResult.estimatedTotalHits || products.length;
    narrowedFilters = searchResult.facetDistribution || {};

  } catch (error) {
    console.error("Błąd zapytania Meilisearch:", error);
  }

  return (
     <>
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
        </div>
     </>
  )
}