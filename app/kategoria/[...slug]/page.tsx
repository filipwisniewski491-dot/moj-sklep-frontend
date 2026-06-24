import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { meiliClient } from '@/lib/meilisearch-client';

import Header from '@/components/Header';
import MobileBottomNav from '@/components/MobileBottomNav';
import CategoryHeader from '@/components/CategoryHeader';
import CategoryWorkspace from '@/components/CategoryWorkspace';

const DynamicFooter = dynamic(() => import('@/components/Footer'));
const DynamicFaqSection = dynamic(() => import('@/components/FaqSection'));
const DynamicSeoSection = dynamic(() => import('@/components/SeoSection'));

export const revalidate = 3600; 
const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://178.104.130.90:9000";
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

const OPTIMIZED_FACETS = [
  'Pasuje do marki', 'Pasuje do modelu', 'Typ produktu', 'Producent', 
  'Rodzaj', 'Waga [kg]', 'Napięcie [V]', 'Strona zabudowy', 
  'Ilość zębów', 'Wymiary', 'Średnica wewnętrzna [mm]', 'Średnica zewnętrzna [mm]', 'Zastosowanie'
];

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

  const breadcrumbs = slugArray.map((s, i) => ({ 
    name: s.replace(/-/g, ' ').toUpperCase(), slug: s, path: slugArray.slice(0, i + 1).join('/') 
  }));

  const searchData = { category: dbCategoryData, breadcrumbs, subcategories: currentCategory?.category_children?.map((c: any) => c.name) || [] };

  // 🔥 INITIAL LOAD Z MEILISEARCHA (Dla SEO i pierwszego wyświetlenia)
  const index = meiliClient.index('products');
  const categoryFilterStr = allowedHandles.length > 0 
    ? `category_handles IN [${allowedHandles.map(h => JSON.stringify(h)).join(', ')}]`
    : `category_handles = ${JSON.stringify(currentHandle)}`;

  let initialData = { filters: {}, narrowedFilters: {}, products: [], totalCount: 0 };
  
  try {
    const [baseFacetsResult, searchResult] = await Promise.all([
      index.search(resolvedSearchParams.q || "", { limit: 0, filter: categoryFilterStr, facets: OPTIMIZED_FACETS }),
      index.search(resolvedSearchParams.q || "", {
        limit: resolvedSearchParams.limit ? parseInt(resolvedSearchParams.limit) : 250,
        filter: categoryFilterStr,
        sort: resolvedSearchParams.sort === 'price_asc' ? ['price:asc'] : resolvedSearchParams.sort === 'price_desc' ? ['price:desc'] : undefined,
        facets: OPTIMIZED_FACETS
      })
    ]);

    initialData = {
      filters: baseFacetsResult.facetDistribution || {},
      narrowedFilters: searchResult.facetDistribution || {},
      products: searchResult.hits.map((p: any) => ({
        id: p.id, sku: p.id, name: p.title, price: p.price || 0, slug: p.handle,
        category_text: p.Kategoria || '', images: p.thumbnail ? [{ url: p.thumbnail }] : []
      })),
      totalCount: searchResult.estimatedTotalHits || 0
    };
  } catch (e) {
    console.error(e);
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-36 md:pb-0">
      <Header />
      <CategoryHeader initialData={searchData} searchParams={resolvedSearchParams} fullPath={fullPath} topSeoText={dbCategoryData.top_seo_text} /> 
      
      {/* 🔥 DELEGACJA DO KLIENTA (To zastępuje Twoje Suspense i CategoryDataLoader) */}
      <CategoryWorkspace initialData={initialData} fullPath={fullPath} />

      {dbCategoryData.bottom_seo_text && <DynamicSeoSection text={dbCategoryData.bottom_seo_text} />}
      {dbCategoryData.faqs && dbCategoryData.faqs.length > 0 && <DynamicFaqSection faqs={dbCategoryData.faqs} />}
      <MobileBottomNav />
      <DynamicFooter />
    </div>
  );
}