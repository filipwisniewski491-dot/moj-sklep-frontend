import HomeClient from '@/components/HomeClient';
import { getProductData } from '@/lib/api';

// 🚀 ISR: Vercel \"piecze\" stronę główną i odświeża ją raz na dobę
export const revalidate = 86400;

async function getBestsellers() {
  // Używamy tego samego URL, który masz w lib/api.ts
  const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://178.104.130.90:9000";
  
  try {
    // Pobieramy listę produktów z Medusy
    const res = await fetch(`${MEDUSA_URL}/store/products?limit=8&fields=*images`, {
      cache: 'no-store' // Wymuszamy świeże dane z serwera
    });
    
    const json = await res.json();
    
    if (!json.products) return [];
    
    // Mapowanie danych z Medusy na format oczekiwany przez HomeClient
    return json.products.map((p: any) => ({
      id: p.id,
      sku: p.variants?.[0]?.sku || "Brak SKU",
      slug: p.handle, // To jest kluczowe dla poprawnego linkowania
      name: p.title,
      price: p.variants?.[0]?.calculated_price?.calculated_amount / 100 || 0, // Medusa zwraca cenę w najmniejszej jednostce (np. groszach)
      images: p.images || [],
      external_images: p.metadata?.external_images || []
    }));
  } catch (error) {
    console.error("Błąd pobierania danych z Medusy:", error);
    return [];
  }
}

export default async function HomePage() {
  const products = await getBestsellers();

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Przekazujemy pobrane produkty do komponentu HomeClient.
        Upewnij się, że HomeClient oczekuje tablicy obiektów z polami: 
        id, sku, slug, name, price, images.
      */}
      <HomeClient initialProducts={products} />
    </main>
  );
}