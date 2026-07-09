import HomeClient from '@/components/HomeClient';
import { getProductData } from '@/lib/api';

// 🚀 ISR: Vercel \"piecze\" stronę główną i odświeża ją raz na dobę
export const revalidate = 86400;

async function getBestsellers() {
  const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://178.104.130.90:9000";
  const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
  // Region PL — BEZ region_id Medusa nie policzy VAT i calculated_price będzie null
  // (stąd wcześniejsze „0.00 zł"). Te same wartości co w lib/api.ts.
  const REGION_ID = process.env.NEXT_PUBLIC_MEDUSA_REGION_ID || "reg_01KT16M40467MTKK4ANCA96R25";
  const COUNTRY_CODE = process.env.NEXT_PUBLIC_MEDUSA_COUNTRY_CODE || "pl";

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (PUBLISHABLE_KEY) headers["x-publishable-api-key"] = PUBLISHABLE_KEY;

  try {
    // ⚡ ISR: cache z rewalidacją co dobę zamiast cache:'no-store'.
    // no-store WYMUSZAŁO dynamiczny render przy każdym wejściu (Medusa na żywo,
    // TTFB ~0.35s) i unieważniało `export const revalidate`. Teraz strona główna
    // serwuje się statycznie z cache → TTFB ~0.1s.
    const res = await fetch(
      `${MEDUSA_URL}/store/products?limit=8&fields=*variants,*variants.calculated_price,+metadata,*images&region_id=${REGION_ID}&country_code=${COUNTRY_CODE}`,
      { headers, next: { revalidate: 86400 } }
    );

    const json = await res.json();
    if (!json.products) return [];

    return json.products.map((p: any) => {
      const cp = p.variants?.[0]?.calculated_price;
      // Medusa (z region_id) zwraca cenę już w złotówkach — NIE dzielimy przez 100.
      // Preferujemy brutto (z VAT); fallback na amount, gdy brak podatku.
      const brutto =
        typeof cp?.calculated_amount_with_tax === "number" ? cp.calculated_amount_with_tax
        : typeof cp?.calculated_amount === "number" ? cp.calculated_amount
        : 0;
      const netto =
        typeof cp?.calculated_amount_without_tax === "number" ? cp.calculated_amount_without_tax
        : brutto;

      return {
        id: p.id,
        sku: p.variants?.[0]?.sku || p.metadata?.sku || "Brak SKU",
        slug: p.handle,
        name: p.title,
        price: Number(brutto.toFixed(2)),
        priceNetto: Number(netto.toFixed(2)),
        images: p.images || [],
        external_images: p.metadata?.external_images || []
      };
    });
  } catch (error) {
    console.error("Błąd pobierania bestsellerów z Medusy:", error);
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