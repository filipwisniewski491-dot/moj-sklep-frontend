import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Meilisearch } from 'meilisearch';

import Header from '@/components/Header';
import MobileBottomNav from '@/components/MobileBottomNav';
import CategoryHeader from '@/components/CategoryHeader';
import CategoryFilters from '@/components/CategoryFilters';
import ProductGrid from '@/components/ProductGrid';

const DynamicFooter = dynamic(() => import('@/components/Footer'));
const DynamicFaqSection = dynamic(() => import('@/components/FaqSection'));
const DynamicSeoSection = dynamic(() => import('@/components/SeoSection'));

export const revalidate = 0; 

const meiliClient = new Meilisearch({
  host: process.env.NEXT_PUBLIC_MEILISEARCH_HOST || '',
  apiKey: process.env.NEXT_PUBLIC_MEILISEARCH_API_KEY || '',
});
const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://178.104.130.90:9000";
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

export async function generateMetadata({ params, searchParams }: any): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const slugArray = Array.isArray(resolvedParams?.slug) ? resolvedParams.slug : [resolvedParams?.slug].filter(Boolean);
  const fullPath = slugArray.join('/');
  const currentSlug = slugArray.length > 0 ? slugArray[slugArray.length - 1] : 'Kategoria';
  
  const baseCategoryName = currentSlug.replace(/-/g, ' ').toUpperCase();
  const seoFriendlyParams = ['Pasuje do marki', 'Pasuje do modelu', 'page'];
  const allParamKeys = Object.keys(resolvedSearchParams || {}).filter(k => k !== 'fullPath');
  const hasNonSeoFilters = allParamKeys.some(key => !seoFriendlyParams.includes(key));

  const brand = resolvedSearchParams?.['Pasuje do marki'] || '';
  const model = resolvedSearchParams?.['Pasuje do modelu'] || '';
  const page = resolvedSearchParams?.page || '1';
  
  let dynamicTitle = baseCategoryName;
  if (brand) dynamicTitle += ` do ${brand.toUpperCase()}`;
  if (model) dynamicTitle += ` ${model.toUpperCase()}`;
  
  dynamicTitle += ` - Największy katalog części | CentrumRolnictwa.pl`;
  
  let robotsInstruction = 'index, follow';
  if (hasNonSeoFilters || page !== '1') {
    dynamicTitle += ` (Strona ${page})`;
    robotsInstruction = 'noindex, follow';
  }

  return {
    title: dynamicTitle.substring(0, 70),
    description: `Szukasz ${baseCategoryName.toLowerCase()} ${brand ? `do ${brand}` : ''}? Sprawdź w CentrumRolnictwa.pl. Szybka wysyłka, fachowe doradztwo i gwarancja dopasowania!`.substring(0, 160),
    robots: robotsInstruction,
    alternates: {
      canonical: `https://centrumrolnictwa.pl/kategoria/${fullPath}`
    }
  };
}

export default async function CategoryPage({ params, searchParams }: any) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const slugArray = Array.isArray(resolvedParams?.slug) ? resolvedParams.slug : [resolvedParams?.slug].filter(Boolean);
  const fullPath = slugArray.join('/');
  const currentHandle = slugArray.length > 0 ? slugArray[slugArray.length - 1] : '';

  let dbCategoryData = { 
    h1_dynamic: currentHandle.toUpperCase().replace(/-/g, ' '), 
    name: currentHandle.replace(/-/g, ' '), 
    top_seo_text: "", 
    bottom_seo_text: "", 
    faqs: [] 
  };
  
  let totalCount = 0;
  let products: any[] = [];
  let formattedFilters: any = {};
  let allowedHandles: string[] = [currentHandle];
  let currentCategory: any = null;

  try {
    const headers: any = { "Content-Type": "application/json" };
    if (PUBLISHABLE_KEY) headers["x-publishable-api-key"] = PUBLISHABLE_KEY;
    
    const currentCategoryRes = await fetch(`${MEDUSA_URL}/store/product-categories?handle=${encodeURIComponent(currentHandle)}`, { headers, cache: 'no-store' });
    
    if (currentCategoryRes.ok) {
      const currentCategoryJson = await currentCategoryRes.json();
      currentCategory = currentCategoryJson.product_categories?.[0];

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
          if (cat.category_children && Array.isArray(cat.category_children)) {
            cat.category_children.forEach(collectHandles);
          }
        };
        collectHandles(currentCategory);
      }
    }
  } catch (error) {
    console.warn("Medyza zajęta, renderowanie z danych URL");
  }

  try {
    const activeFilters = { ...resolvedSearchParams };
    ['fullPath', 'limit', 'sort', 'minPrice', 'maxPrice', 'q', 'page'].forEach(k => delete activeFilters[k]);

    const index = meiliClient.index('products');
    const filterArray: string[] = [];

    // 🔥 POPRAWKA: Używamy bezpiecznego JSON.stringify i pojedynczych apostrofów
    if (allowedHandles.length > 0) {
      const handlesValue = allowedHandles.map(h => JSON.stringify(h)).join(', ');
      filterArray.push(`category_handle IN [${handlesValue}]`);
    } else {
      filterArray.push(`category_handle = ${JSON.stringify(currentHandle)}`);
    }

    Object.entries(activeFilters).forEach(([key, val]) => {
      if (val) {
        // Meilisearch wymaga formatu: 'Klucz ze spacją' = "Wartość"
        filterArray.push(`'${key}' = ${JSON.stringify(val)}`);
      }
    });

    const searchResult = await index.search(resolvedSearchParams.q || "", {
      limit: resolvedSearchParams.limit ? parseInt(resolvedSearchParams.limit) : 250,
      filter: filterArray.join(' AND '),
      facets: ['Pasuje do marki', 'Pasuje do modelu', 'Typ produktu', 'Marka', 'Model', 'Producent']
    });

    products = searchResult.hits.map((p: any) => ({
      id: p.id,
      sku: p.id,
      name: p.title,
      price: p.price || 0,
      slug: p.handle,
      category_text: p.Kategoria || '',
      images: p.thumbnail ? [{ url: p.thumbnail }] : []
    }));

    totalCount = searchResult.estimatedTotalHits || products.length;
    formattedFilters = searchResult.facetDistribution || {};

  } catch (error) {
    console.error("Błąd zapytania Meilisearch:", error);
  }

  let topSeoText = dbCategoryData.top_seo_text;
  let bottomSeoText = dbCategoryData.bottom_seo_text;
  const faqs = dbCategoryData.faqs;

  let tempPath = "";
  const breadcrumbs = slugArray.map(s => {
    tempPath = tempPath ? `${tempPath}/${s}` : s;
    return { name: s.replace(/-/g, ' ').toUpperCase(), slug: s, path: tempPath };
  });

  const searchData = {
    category: dbCategoryData,
    breadcrumbs,
    subcategories: currentCategory?.category_children?.map((c: any) => c.name) || [],
    filters: formattedFilters,
    narrowedFilters: formattedFilters,
    products,
    totalCount
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-36 md:pb-0">
      <Header />
      <CategoryHeader initialData={searchData} searchParams={resolvedSearchParams} fullPath={fullPath} topSeoText={topSeoText} /> 
      <main className="max-w-7xl mx-auto px-4 py-6 lg:py-12 flex flex-col lg:flex-row gap-8 lg:gap-12 relative z-10">
        <aside className="w-full lg:w-80 flex-shrink-0">
          <CategoryFilters initialFilters={formattedFilters} initialTotalCount={totalCount} />
        </aside>
        <div className="flex-1 flex flex-col min-h-[500px]">
          <ProductGrid initialProducts={products} totalCount={totalCount} fullPath={fullPath} loading={false} />
          {bottomSeoText && <DynamicSeoSection text={bottomSeoText} />}
          {faqs && faqs.length > 0 && <DynamicFaqSection faqs={faqs} />}
        </div>
      </main>
      <MobileBottomNav />
      <DynamicFooter />
    </div>
  );
}