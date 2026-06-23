import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';

import Header from '@/components/Header';
import MobileBottomNav from '@/components/MobileBottomNav';
import CategoryHeader from '@/components/CategoryHeader';
import CategoryFilters from '@/components/CategoryFilters';
import ProductGrid from '@/components/ProductGrid';

const DynamicFooter = dynamic(() => import('@/components/Footer'));
const DynamicFaqSection = dynamic(() => import('@/components/FaqSection'));
const DynamicSeoSection = dynamic(() => import('@/components/SeoSection'));

export const revalidate = 0; // Wyłączamy cache na poziomie strony dla pełnej dynamiki filtrów

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

  // 🚀 BEZPOŚREDNIE UDERZENIE DO NASZEGO TUNELU MEILISEARCH
  // Pobieramy dane strukturalne oraz wyliczone cechy filtrów w jednym szybkim żądaniu HTTP
  const apiQuery = new URLSearchParams(resolvedSearchParams);
  apiQuery.set('fullPath', fullPath);

  let data: any = null;
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const res = await fetch(`${siteUrl}/api/search?${apiQuery.toString()}`, { cache: 'no-store' });
    if (res.ok) {
      data = await res.json();
    }
  } catch (error) {
    console.error("Błąd pobierania danych ze skonsolidowanego API:", error);
  }

  if (!data || !data.category) {
    notFound();
  }

  const totalCount = data?.totalCount || 0;
  const products = data?.products || [];
  const categoryData = data?.category || null;
  const faqs = categoryData?.faqs || [];
  
  let topSeoText = categoryData?.top_seo_text || '';
  let bottomSeoText = categoryData?.bottom_seo_text || '';

  if (categoryData?.metadata) {
    try {
      const meta = typeof categoryData.metadata === 'string' 
        ? JSON.parse(categoryData.metadata) 
        : categoryData.metadata;
        
      topSeoText = meta.top_seo_text || meta.topSeoText || topSeoText;
      bottomSeoText = meta.bottom_seo_text || meta.bottomSeoText || bottomSeoText;
    } catch (e) {
      console.error("Błąd dekodowania metadata obiektu SEO:", e);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-36 md:pb-0">
      <Header />
      
      <CategoryHeader 
        initialData={data} 
        searchParams={resolvedSearchParams} 
        fullPath={fullPath} 
        topSeoText={topSeoText} 
      /> 
      
      <main className="max-w-7xl mx-auto px-4 py-6 lg:py-12 flex flex-col lg:flex-row gap-8 lg:gap-12 relative z-10">
        <aside className="w-full lg:w-80 flex-shrink-0">
          {/* Przekazujemy przeliczone przez Meilisearch fasetowe filtry bezpośrednio do widoku */}
          <CategoryFilters initialFilters={data.filters} initialTotalCount={totalCount} />
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