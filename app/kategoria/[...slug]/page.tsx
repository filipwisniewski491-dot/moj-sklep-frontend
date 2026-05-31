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
  const page = resolvedSearchParams?.['page'];

  // Budujemy dynamiczny Tag <title>
  let metaTitle = `${baseCategoryName} do ciągników i maszyn`;
  
  if (brand && model) {
    metaTitle = `${baseCategoryName} do ${brand} ${model} - Części zamienne | CentrumRolnictwa.pl`;
  } else if (brand) {
    metaTitle = `${baseCategoryName} do ${brand} - Sklep rolniczy | CentrumRolnictwa.pl`;
  }

  // Dodajemy paginację do tytułu, by uniknąć duplikatów w Google Search Console
  if (page && page !== '1') {
    metaTitle += ` - Strona ${page}`;
  }

  // Budujemy dynamiczny Description
  let metaDescription = `Szukasz ${baseCategoryName.toLowerCase()}? Sprawdź naszą ofertę najwyższej jakości części.`;
  if (brand) {
    metaDescription = `Kup ${baseCategoryName.toLowerCase()} dedykowane do maszyn marki ${brand}${model ? ` model ${model}` : ''}. Gwarancja dopasowania, szybka wysyłka, doradztwo ekspertów.`;
  }

  return {
    title: metaTitle,
    description: metaDescription,
    // 3. LOGIKA CANONICAL - Tarcza przeciwko kanibalizacji słów kluczowych
    alternates: {
      canonical: hasNonSeoFilters 
        ? `https://centrumrolnictwa.pl/kategoria/${fullPath}` // Jeśli włączono np. cenę, Google ma patrzeć tylko na czystą kategorię
        : `https://centrumrolnictwa.pl/kategoria/${fullPath}${allParamKeys.length > 0 ? '?' + new URLSearchParams(resolvedSearchParams as Record<string, string>).toString() : ''}`
    },
    // 4. DYREKTYWA ROBOTS
    robots: {
      index: !hasNonSeoFilters, // Blokuj indeksowanie, jeśli włączono "śmieciowe" filtry
      follow: true // Pozwól robotom skanować linki (śledzić produkty)
    }
  };
}

// Funkcja fetchująca dane kategorii na serwerze 
async function getCategoryData(fullPath: string, searchParams: any) {
  const url = new URL(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/search`);
  url.searchParams.append('fullPath', fullPath);
  url.searchParams.append('limit', '24');
  
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, val]) => {
      url.searchParams.append(key, String(val));
    });
  }

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 60 } });
    if (!res.ok) throw new Error('Failed to fetch data');
    const data = await res.json();
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