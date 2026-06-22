import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCategoryData } from '@/lib/api'; 
import dynamic from 'next/dynamic';

import Header from '@/components/Header';
import MobileBottomNav from '@/components/MobileBottomNav';
import CategoryHeader from '@/components/CategoryHeader';
import CategoryFilters from '@/components/CategoryFilters';
import ProductGrid from '@/components/ProductGrid';

const DynamicFooter = dynamic(() => import('@/components/Footer'));
const DynamicFaqSection = dynamic(() => import('@/components/FaqSection'));
const DynamicSeoSection = dynamic(() => import('@/components/SeoSection'));

export const revalidate = 3602;

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
  const currentSlug = slugArray.length > 0 ? slugArray[slugArray.length - 1] : '';
  
  // 🚀 REWOLUCYJNA NAPRAWA 404: Pyta backend tylko o ostatni wycinek URL (czyli handle w MedusaJS)
  const data = await getCategoryData(currentSlug, resolvedSearchParams);
  
  if (!data) {
    notFound();
  }

  const { searchData, filtersData } = data;
  
  const totalCount = searchData?.totalCount || 0;
  const products = searchData?.products || [];
  const categoryData = searchData?.category || null;
  const faqs = categoryData?.faqs || [];
  
  // Bezpieczne pobranie opisu SEO na dół strony
  const bottomSeoText = categoryData?.bottom_seo_text || categoryData?.metadata?.bottom_seo_text || '';

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-36 md:pb-0">
      <Header />
      
      <CategoryHeader initialData={searchData} searchParams={resolvedSearchParams} fullPath={fullPath} /> 
      <main className="max-w-7xl mx-auto px-4 py-6 lg:py-12 flex flex-col lg:flex-row gap-8 lg:gap-12 relative z-10">
        <aside className="w-full lg:w-80 flex-shrink-0">
          <CategoryFilters initialFilters={filtersData} initialTotalCount={totalCount} />
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