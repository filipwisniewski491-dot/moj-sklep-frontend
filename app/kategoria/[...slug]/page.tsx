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
  // Zoptymalizowane wykrywanie adresu URL dla Vercela
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
    
    // Jeśli połączenie się uda, ładujemy dane. Jeśli nie – wypisujemy kod błędu w H1!
    const data = res.ok ? await res.json() : { products: [], filters: {}, category: { h1_dynamic: `BŁĄD API: ${res.status}` } };
    return { searchData: data, filtersData: data.filters || {} };
  } catch (error: any) {
    // Jeśli Vercel całkowicie odrzuci połączenie wewnętrzne, pokażemy to na ekranie
    return { searchData: { products: [], category: { h1_dynamic: `BŁĄD SERWERA VERCEL: ${error.message}` } }, filtersData: {} };
  }
}

export default async function CategoryPage({ params, searchParams }: any) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const fullPath = resolvedParams?.slug ? resolvedParams.slug.join('/') : '';
  
  const { searchData, filtersData } = await getCategoryData(fullPath, resolvedSearchParams);

  const CategoryClient = (await import('./CategoryClient')).default;

  return (
    <CategoryClient 
      initialData={searchData} 
      initialFilters={filtersData} 
      fullPath={fullPath} 
    />
  );
}