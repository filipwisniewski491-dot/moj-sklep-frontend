import CategoryClient from './CategoryClient';

// MAGIA PRĘDKOŚCI: ISR - Vercel zapamięta tę stronę na 24h (86400 sekund).
// Odświeży ją w tle bez blokowania użytkownika.
export const revalidate = 86400; 

async function getCategoryData(fullPath: string, searchParams: any) {
  // Budujemy adres URL, żeby serwer Vercel mógł odpytać samego siebie
  const getBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return 'http://localhost:3000';
  };

  const baseUrl = getBaseUrl();
  const queryStr = new URLSearchParams(searchParams as Record<string, string>).toString();

  try {
    // Równoległe, błyskawiczne pobieranie danych i filtrów
    const [searchRes, filtersRes] = await Promise.all([
      fetch(`${baseUrl}/api/search?fullPath=${fullPath}&${queryStr}`, { next: { revalidate: 86400 } }),
      fetch(`${baseUrl}/api/filters?fullPath=${fullPath}&${queryStr}`, { next: { revalidate: 86400 } })
    ]);

    const searchData = searchRes.ok ? await searchRes.json() : null;
    const filtersData = filtersRes.ok ? await filtersRes.json() : null;

    return { 
      searchData: searchData || {}, 
      filtersData: filtersData?.filters || {} 
    };
  } catch (error) {
    console.error("Błąd generowania statycznego:", error);
    return { searchData: {}, filtersData: {} };
  }
}

export default async function Page(props: { params: Promise<{ slug: string[] }>, searchParams: Promise<any> }) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const fullPath = params.slug.join('/');

  const data = await getCategoryData(fullPath, searchParams);

  // Przekazujemy wszystko do Twojego komponentu klienckiego!
  return (
    <CategoryClient 
      initialData={data.searchData} 
      initialFilters={data.filtersData} 
      fullPath={fullPath} 
    />
  );
}