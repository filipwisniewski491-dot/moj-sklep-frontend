import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCategoryData } from '@/lib/api'; 
import dynamic from 'next/dynamic';

import Header from '@/components/Header';
import MobileBottomNav from '@/components/MobileBottomNav';
import CategoryHeader from '@/components/CategoryHeader';
import CategoryFilters from '@/components/CategoryFilters';
import ProductGrid from '@/components/ProductGrid';

// 🚀 EKSTREMALNE LENIWE ŁADOWANIE (Below The Fold)
// Te komponenty nie blokują już pobierania HTML ani wskaźnika LCP
const DynamicFooter = dynamic(() => import('@/components/Footer'), { ssr: false });
const DynamicFaqSection = dynamic(() => import('@/components/FaqSection'), { ssr: false });
const DynamicSeoSection = dynamic(() => import('@/components/SeoSection'), { ssr: false });

export const revalidate = 3600;

export async function generateMetadata({ params, searchParams }: any): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const fullPath = resolvedParams?.slug ? resolvedParams.slug.join('/') : '';
  const currentSlug = resolvedParams?.slug ? resolvedParams.slug[resolvedParams.slug.length - 1] : 'Kategoria';
  
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
  const fullPath = resolvedParams?.slug ? resolvedParams.slug.join('/') : '';
  
  const data = await getCategoryData(fullPath, resolvedSearchParams);
  
  if (!data) {
    notFound();
  }

  const { searchData, filtersData } = data;
  
  const totalCount = searchData?.totalCount || 0;
  const products = searchData?.products || [];
  const categoryData = searchData?.category || null;
  const faqs = categoryData?.faqs || [];

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
          
          {/* Leniwe ładowanie sekcji tekstowych SEO i FAQ */}
          <DynamicSeoSection text={categoryData?.bottom_seo_text} />
          {faqs && faqs.length > 0 && <DynamicFaqSection faqs={faqs} />}
        </div>
      </main>

      <MobileBottomNav />
      
      {/* Leniwe ładowanie potężnej stopki */}
      <DynamicFooter />
    </div>
  );
}