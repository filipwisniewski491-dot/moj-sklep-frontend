import { Metadata } from 'next';
import { getCategoryData } from '@/lib/api';

// Globalne komponenty layoutu (upewnij się, że ścieżki są prawidłowe)
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileBottomNav from '@/components/MobileBottomNav';
import FaqSection from '@/components/FaqSection'; 
import SeoSection from '@/components/SeoSection';

// Nasze nowo wydzielone, zoptymalizowane pod LCP komponenty
import CategoryHeader from '@/components/CategoryHeader';
import CategoryFilters from '@/components/CategoryFilters';
import ProductGrid from '@/components/ProductGrid';

// === KLUCZOWE DLA WYDAJNOŚCI (ISR) ===
// Odświeżamy cache co godzinę, więc dla większości użytkowników
// strona serwuje się jako czysty, błyskawiczny HTML z Vercel Edge.
export const revalidate = 3600; 

// === GENEROWANIE METADANYCH SEO ===
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

// === GŁÓWNY KOMPONENT STRONY KATEGORII ===
export default async function CategoryPage({ params, searchParams }: any) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const fullPath = resolvedParams?.slug ? resolvedParams.slug.join('/') : '';

  // Pobieramy dane na serwerze (ISR). 
  // Zapytanie odpala się tylko raz na jakiś czas przy budowaniu cache'u.
  const { searchData, filtersData } = await getCategoryData(fullPath, resolvedSearchParams);
  
  const totalCount = searchData?.totalCount || 0;
  const products = searchData?.products || [];
  const categoryData = searchData?.category || null;

  // Generowanie schematu JSON-LD dla FAQ w Google
  const faqs = categoryData?.faqs || [];
  const jsonLd = faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq: any) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  } : null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-36 md:pb-0">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      {/* Globalny Header */}
      <Header />

      {/* Serwerowy komponent nagłówka kategorii (H1, Chlebki, Opis) */}
      <CategoryHeader 
        initialData={searchData} 
        searchParams={resolvedSearchParams} 
        fullPath={fullPath} 
      /> 
      
      <main className="max-w-7xl mx-auto px-4 py-6 lg:py-12 flex flex-col lg:flex-row gap-8 lg:gap-12 relative z-10">
        
        {/* Sidebar z filtrami i wirtualnym garażem */}
        {/* Wstrzykujemy inicjalne dane, żeby filtry były gotowe natychmiast */}
        <aside className="w-full lg:w-80 flex-shrink-0">
          <CategoryFilters 
            initialFilters={filtersData} 
            initialTotalCount={totalCount} 
          />
        </aside>

        {/* Zawartość główna - siatka produktów */}
        <div className="flex-1 flex flex-col min-h-[500px]">
          <ProductGrid 
            initialProducts={products} 
            totalCount={totalCount} 
            fullPath={fullPath} 
            loading={false} 
          />
          
          {/* Sekcje pod gridem */}
          <SeoSection text={categoryData?.bottom_seo_text} />
          <FaqSection faqs={faqs} />
        </div>
      </main>

      {/* Globalne elementy mobilne i stopka */}
      <MobileBottomNav />
      <Footer />
    </div>
  );
}