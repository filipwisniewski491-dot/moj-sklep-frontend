import { Metadata } from 'next';
import { Suspense } from 'react';
import { getCategoryData } from '@/lib/api';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileBottomNav from '@/components/MobileBottomNav';
import CategoryHeader from '@/components/CategoryHeader';
import CategoryFilters from '@/components/CategoryFilters';
import ProductGrid from '@/components/ProductGrid';
import ProductGridSkeleton from '@/components/ProductGridSkeleton';
import FaqSection from '@/components/FaqSection';
import SeoSection from '@/components/SeoSection';

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

// === NOWY IZOLOWANY KONTENER DANYCH ===
// Całe oczekiwanie na bazę odbywa się tutaj, nie blokując reszty strony.
async function CategoryContent({ fullPath, searchParams }: { fullPath: string, searchParams: any }) {
  try {
    const { searchData, filtersData } = await getCategoryData(fullPath, searchParams);
    
    const totalCount = searchData?.totalCount || 0;
    const products = searchData?.products || [];
    const categoryData = searchData?.category || null;
    const faqs = categoryData?.faqs || [];

    return (
      <>
        <CategoryHeader initialData={searchData} searchParams={searchParams} fullPath={fullPath} /> 
        <main className="max-w-7xl mx-auto px-4 py-6 lg:py-12 flex flex-col lg:flex-row gap-8 lg:gap-12 relative z-10">
          <aside className="w-full lg:w-80 flex-shrink-0">
            <CategoryFilters initialFilters={filtersData} initialTotalCount={totalCount} />
          </aside>
          <div className="flex-1 flex flex-col min-h-[500px]">
            <ProductGrid initialProducts={products} totalCount={totalCount} fullPath={fullPath} loading={false} />
            <SeoSection text={categoryData?.bottom_seo_text} />
            <FaqSection faqs={faqs} />
          </div>
        </main>
      </>
    );
  } catch (error) {
    console.error("Błąd pobierania danych z bazy:", error);
    // Ten fallback zapobiega wywaleniu całej strony, gdy baza leży
    return (
       <div className="max-w-7xl mx-auto px-4 py-32 text-center">
         <span className="text-6xl mb-4 block">🔌</span>
         <h2 className="text-3xl font-black text-slate-900 mb-4 uppercase">Błąd połączenia z magazynem</h2>
         <p className="text-slate-600 font-medium">Nasz system nie mógł w tej chwili połączyć się z bazą danych.</p>
       </div>
    );
  }
}

// === GŁÓWNY KOMPONENT ===
export default async function CategoryPage({ params, searchParams }: any) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const fullPath = resolvedParams?.slug ? resolvedParams.slug.join('/') : '';

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-36 md:pb-0">
      <Header />
      
      {/* Suspense natychmiast ładuje szkielet, a w tle odpala CategoryContent */}
      <Suspense fallback={
        <main className="max-w-7xl mx-auto px-4 py-12 flex flex-col lg:flex-row gap-8 lg:gap-12">
           <div className="hidden lg:block w-80 h-[600px] bg-slate-100 rounded-[32px] animate-pulse"></div>
           <ProductGridSkeleton />
        </main>
      }>
         <CategoryContent fullPath={fullPath} searchParams={resolvedSearchParams} />
      </Suspense>

      <MobileBottomNav />
      <Footer />
    </div>
  );
}