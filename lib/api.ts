// lib/api.ts

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://49.12.69.146:9000";
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

export async function getProductData(identifier: string) {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    if (PUBLISHABLE_KEY) {
      headers["x-publishable-api-key"] = PUBLISHABLE_KEY;
    }

    // Wyłączamy cache, żeby wymusić pobranie nowych pól
    const options: RequestInit = {
      headers: headers,
      cache: 'no-store' 
    };

    // Wymuszamy na Medusie zwrot metadanych (+metadata) i obrazków (+images)
    const queryFields = "fields=*variants,*categories,+metadata,+images";

    // 1. Próba 1: Szukamy dokładnie tego, co w pasku adresu
    let res = await fetch(`${MEDUSA_URL}/store/products?handle=${encodeURIComponent(identifier)}&${queryFields}`, options);
    let json = await res.json();

    // 2. DETEKTYW (Naprawa różnic ze Strapi): Ocinamy cyfry z końca sluga
    if (!json.products || json.products.length === 0) {
      const slugParts = identifier.split('-');
      if (slugParts.length > 1) {
        slugParts.pop(); // Pozbywamy się starego ID
        const shortHandle = slugParts.join('-');
        res = await fetch(`${MEDUSA_URL}/store/products?handle=${encodeURIComponent(shortHandle)}&${queryFields}`, options);
        json = await res.json();
      }
    }

    // 3. KOŁO RATUNKOWE: Wyszukiwanie ogólne po znakach
    if (!json.products || json.products.length === 0) {
      res = await fetch(`${MEDUSA_URL}/store/products?q=${encodeURIComponent(identifier)}&${queryFields}`, options);
      json = await res.json();
    }

    if (!json.products || json.products.length === 0) {
       console.error(`[API LIB] Produkt całkowicie nieodnaleziony: ${identifier}`);
       return null;
    }

    const product = json.products[0];
    // Gwarancja, że metadane teraz tu wpadną
    const meta = product.metadata || {};
    const mainVariant = product.variants?.[0] || null;

    return {
      id: product.id,
      sku: mainVariant?.sku || meta.sku || null,
      slug: product.handle,
      name: product.title || 'Produkt',
      price: mainVariant?.calculated_price?.calculated_amount || 0, 
      description: product.description || '',
      category_text: product.categories?.[0]?.name || meta.category || '',
      
      // DODANE: Bez tego front-end nie złoży okruszków!
      category_path: product.categories?.[0]?.metadata?.category_path || meta.category_path || null,
      
      // Zasilanie Twojego frontendu wyciągniętymi metadanymi
      attributes: meta.technical_specs || meta.attributes || {},
      images: product.images?.map((img: any) => ({ url: img.url })) || [],
      external_images: meta.external_images || [],
      expert_advice: meta.expert_advice || null,
      symptoms: meta.symptoms || null,
      faq: meta.faq || null,
      crossSell: meta.cross_sell_skus || meta.cross_sell || []
    };
  } catch (error) {
    console.error("[API LIB] Krytyczny błąd pobierania produktu z Medusy:", error);
    return null;
  }
}

// === FUNKCJA POBIERANIA DANYCH KATEGORII (Wymagana przez page.tsx) ===
// WERSJA MOCK (ZAMROŻONY BACKEND) - DO TESTÓW PAGESPEED 100/100
export async function getCategoryData(fullPath: string, searchParams: any) {
  // Promise.resolve natychmiast zwraca dane. Czas odpowiedzi: 0ms.
  return Promise.resolve({
    searchData: {
      totalCount: 4,
      products: [
        {
          id: "mock-1",
          sku: "OEM-TEST-1",
          name: "Sztuczny Produkt Testowy LCP - Wałek Odbioru Mocy",
          price: 1550.00,
          slug: "walek-odbioru-mocy-test",
          // Używamy Twojego logo z BunnyCDN do testu ładowania obrazków na kafelkach
          external_images: ["https://centrumrolnictwa-cdn.b-cdn.net/logo/logo-centrumrolnictwapl-2-1.jpeg?width=384&format=webp"],
          images: []
        },
        {
          id: "mock-2",
          sku: "OEM-TEST-2",
          name: "Pompa Hydrauliczna Zębata Ursus",
          price: 890.50,
          slug: "pompa-hydrauliczna-test",
          external_images: ["https://centrumrolnictwa-cdn.b-cdn.net/logo/logo-centrumrolnictwapl-2-1.jpeg?width=384&format=webp"],
          images: []
        },
        {
          id: "mock-3",
          sku: "OEM-TEST-3",
          name: "Siedzenie Dwuczęściowe do Ciągnika",
          price: 340.00,
          slug: "siedzenie-test",
          external_images: [],
          images: []
        },
        {
          id: "mock-4",
          sku: "OEM-TEST-4",
          name: "Filtr Oleju Silnikowego PP-8.4",
          price: 24.99,
          slug: "filtr-oleju-test",
          external_images: [],
          images: []
        }
      ],
      category: {
        h1_dynamic: "TEST WYDAJNOŚCI - 100/100",
        top_seo_text: "To jest testowy opis kategorii. Sprawdzamy, jak szybko Vercel renderuje strukturę DOM oraz analizujemy przesunięcia układu (CLS).",
        bottom_seo_text: "Dolny tekst pozycjonujący. Wszystko ładuje się z prędkością światła.",
        faqs: [
          { question: "Dlaczego ta strona jest taka szybka?", answer: "Ponieważ używamy Next.js App Router z izolowanymi komponentami serwerowymi." },
          { question: "Czy Medusa działa?", answer: "Obecnie serwer jest zamrożony w celu oszczędności." }
        ]
      },
      breadcrumbs: [
        { name: "Części do ciągników", path: "czesci-do-ciagnikow" }
      ],
      subcategories: ["Ursus", "Zetor", "John Deere", "Massey Ferguson"]
    },
    // Sztuczne filtry do załadowania panelu bocznego
    filtersData: {
      "Pasuje do marki": { "Ursus": 150, "Zetor": 80, "Fendt": 25 },
      "Typ produktu": { "Filtry": 40, "Pompy": 12, "Oleje": 8 }
    }
  });
}