import { NextResponse } from 'next/server';

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://178.104.130.90:9000";
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const skusParam = searchParams.get('skus');

  if (!skusParam) {
    return NextResponse.json({ products: [] });
  }

  // Wyłapujemy poszczególne numery SKU z zapytania
  const skus = skusParam.split(',').map(s => s.trim()).filter(Boolean);
  
  if (skus.length === 0) {
    return NextResponse.json({ products: [] });
  }

  try {
    const headers: any = { "Content-Type": "application/json" };
    if (PUBLISHABLE_KEY) headers["x-publishable-api-key"] = PUBLISHABLE_KEY;

    // Pobieramy rekomendowane produkty równolegle (ultra-szybko)
    const promises = skus.map(async (sku) => {
      // Szukamy w Medusie po numerze SKU
      const res = await fetch(`${MEDUSA_URL}/store/products?q=${encodeURIComponent(sku)}&fields=*variants,*images`, {
        headers,
        // Czas życia cache: 5 minut. Wystarczająco świeże, ale nie obciąża serwera Medusy.
        next: { revalidate: 300 } 
      });
      
      if (!res.ok) return null;
      const json = await res.json();
      return json.products?.[0] || null; // Bierzemy pierwszy dopasowany produkt
    });

    const results = await Promise.all(promises);
    const validProducts = results.filter(Boolean); // Odrzucamy puste/nieistniejące

    // Oczyszczamy dane, wysyłając na frontend tylko to, czego potrzebuje komponent
    const finalProducts = validProducts.map((p: any) => {
      const mainVariant = p.variants?.[0];
      return {
        sku: mainVariant?.sku || p.metadata?.sku || 'BRAK',
        name: p.title || 'Produkt',
        slug: p.handle,
        // Konwersja groszy na złotówki
        price: mainVariant?.calculated_price?.calculated_amount ? (mainVariant.calculated_price.calculated_amount / 100) : 0,
        image: p.images?.[0]?.url || null
      };
    });

    return NextResponse.json({ products: finalProducts });

  } catch (error) {
    console.error("Błąd API Cross-Sell Medusa:", error);
    return NextResponse.json({ products: [] }, { status: 500 });
  }
}