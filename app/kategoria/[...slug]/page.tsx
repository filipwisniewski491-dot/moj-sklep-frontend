import { Metadata } from 'next';

export const revalidate = 60; 

// === GENEROWANIE METADANYCH SEO ===
export async function generateMetadata({ params, searchParams }: any): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const fullPath = resolvedParams?.slug ? resolvedParams.slug.join('/') : '';
  const currentSlug = resolvedParams?.slug ? resolvedParams.slug[resolvedParams.slug.length - 1] : 'Kategoria';
  const categoryName = currentSlug.replace(/-/g, ' ').toUpperCase();

  const filterKeys = Object.keys(resolvedSearchParams || {}).filter(
    k => !['fullPath', 'limit', 'sort', 'page', 'q'].includes(k)
  );
  const hasFilters = filterKeys.length > 0;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${process.env.VERCEL_URL}` || 'https://centrumrolnictwa.pl';

  // Możesz tutaj również zaciągnąć top_seo_text do description, ale bazowe jest bezpieczniejsze
  return {
    title: `Części do ${categoryName} | Sklep Rolniczy`,
    description: `Wysokiej jakości części w kategorii ${categoryName}. Szybka wysyłka, doradztwo techniczne i sprawdzeni producenci.`,
    robots: hasFilters ? { index: false, follow: true } : { index: true, follow: true },
    alternates: {
      canonical: `${baseUrl}/kategoria/${fullPath}`,
    }
  };
}

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