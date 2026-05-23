import HomeClient from '@/components/HomeClient';

// 🚀 ISR: Vercel "piecze" stronę główną i odświeża ją raz na dobę
export const revalidate = 86400;

async function getBestsellers() {
  const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://178.105.201.145:1337";
  const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

  try {
    // Pobieramy 4 produkty bezpośrednio z bazy
    const res = await fetch(`${STRAPI_URL}/api/products?pagination[pageSize]=4&populate=*`, {
      headers: STRAPI_TOKEN ? { 'Authorization': `Bearer ${STRAPI_TOKEN}` } : {},
      next: { revalidate: 86400 }
    });
    const json = await res.json();
    
    if (!json.data) return [];
    
    // Zwracamy czyste dane do komponentu klienckiego
    return json.data.map((p: any) => ({
      id: p.documentId || p.id,
      sku: p.sku,
      slug: p.slug,
      name: p.seo_title || p.name,
      price: p.price || 0,
      images: p.images || [],
      external_images: p.external_images || []
    }));
  } catch (error) {
    console.error("Błąd pobierania strony głównej:", error);
    return [];
  }
}

export default async function Page() {
  // Pobieramy dane ZANIM strona trafi do użytkownika
  const products = await getBestsellers();
  
  // Przekazujemy gotowe produkty, strona pojawia się natychmiast!
  return <HomeClient initialProducts={products} />;
}