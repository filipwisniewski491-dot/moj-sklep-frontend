import { Metadata } from 'next';

export const revalidate = 60; 

// === GENEROWANIE METADANYCH SEO Z OBSŁUGĄ FASETOWANIA (LONG-TAIL) ===
export async function generateMetadata({ params, searchParams }: any): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const fullPath = resolvedParams?.slug ? resolvedParams.slug.join('/') : '';
  const currentSlug = resolvedParams?.slug ? resolvedParams.slug[resolvedParams.slug.length - 1] : 'Kategoria';
  
  // Podstawowa nazwa kategorii, np. "SILNIK I OSPRZĘT"
  const baseCategoryName = currentSlug.replace(/-/g, ' ').toUpperCase();

  // 1. Definiujemy, które parametry URL to nasze "Złote Filtry SEO" (Indexable Facets)
  const seoFriendlyParams = ['Pasuje do marki', 'Pasuje do modelu', 'page'];
  
  // Pobieramy wszystkie aktualne parametry z URL (pomijając systemowy 'fullPath')
  const allParamKeys = Object.keys(resolvedSearchParams || {}).filter(k => k !== 'fullPath');

  // Sprawdzamy, czy włączony jest jakikolwiek "śmieciowy" filtr (np. cena, sortowanie, wyszukiwarka)
  const hasNonSeoFilters = allParamKeys.some(key => !seoFriendlyParams.includes(key));

  // 2. Pobieramy wartości Złotych Filtrów, aby zaktualizować Tagi SEO
  const brand = resolvedSearchParams?.['Pasuje do marki'];
  const model = resolvedSearchParams?.['Pasuje do modelu'];

  // 3. Budujemy dynamiczną nazwę pod H1 i Title
  let dynamicCategoryName = baseCategoryName;
  if (brand) {
    dynamicCategoryName += ` do ${brand.toUpperCase()}`;
    if (model) {
      dynamicCategoryName += ` ${model.toUpperCase()}`;
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${process.env.VERCEL_URL}` || 'https://centrumrolnictwa.pl';

  // 4. Budujemy precyzyjny Canonical URL
  const canonicalUrlObj = new URLSearchParams();
  if (brand) canonicalUrlObj.set('Pasuje do marki', brand);
  if (model) canonicalUrlObj.set('Pasuje do modelu', model);
  
  const canonicalQueryString = canonicalUrlObj.toString() ? `?${canonicalUrlObj.toString()}` : '';
  const canonicalUrl = `${baseUrl}/kategoria/${fullPath}${canonicalQueryString}`;

  // 5. Zwracamy zoptymalizowane Tagi
  return {
    title: `Części do ${dynamicCategoryName} | Sklep Rolniczy`,
    description: brand 
      ? `Wysokiej jakości części w kategorii ${baseCategoryName} przeznaczone do maszyn ${brand} ${model || ''}. Szybka wysyłka i doradztwo techniczne.`
      : `Wysokiej jakości części w kategorii ${baseCategoryName}. Szybka wysyłka, doradztwo techniczne i sprawdzeni producenci.`,
    // Złota reguła: Jeśli są "śmieciowe filtry" -> noindex. Jeśli są tylko filtry SEO lub brak filtrów -> index!
    robots: hasNonSeoFilters ? { index: false, follow: true } : { index: true, follow: true },
    alternates: {
      canonical: canonicalUrl,
    }
  };
}

// === POBIERANIE DANYCH Z API ===
async function getCategoryData(fullPath: string, searchParams: any) {
  const getBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return 'http://localhost:3000';
  };

  const baseUrl = getBaseUrl();
  const queryStr = new URLSearchParams(searchParams as Record<string, string>).toString();

  try {
    const res = await fetch(`${baseUrl}/api/search?fullPath=${fullPath}&${queryStr}`, { 
      next: { revalidate: 60 } 
    });
    
    const data = res.ok ? await res.json() : { products: [], filters: {}, category: { h1_dynamic: `BŁĄD API: ${res.status}` } };
    return { searchData: data, filtersData: data.filters || {} };
  } catch (error: any) {
    return { searchData: { products: [], category: { h1_dynamic: `BŁĄD SERWERA VERCEL: ${error.message}` } }, filtersData: {} };
  }
}

// === GŁÓWNY KOMPONENT STRONY KATEGORII ===
export default async function CategoryPage({ params, searchParams }: any) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const fullPath = resolvedParams?.slug ? resolvedParams.slug.join('/') : '';
  
  const { searchData, filtersData } = await getCategoryData(fullPath, resolvedSearchParams);

  // Wstrzykiwanie Google JSON-LD dla FAQ wygenerowanego przez AI (Potężne dla SEO!)
  const faqs = searchData?.category?.faqs || [];
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

  const CategoryClient = (await import('./CategoryClient')).default;

  return (
    <>
      {/* Skrypt Schema.org ładowany bezpośrednio do headera dla robotów Google */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <CategoryClient 
        initialData={searchData} 
        initialFilters={filtersData} 
        fullPath={fullPath} 
      />
    </>
  );
}