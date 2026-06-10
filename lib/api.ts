// lib/api.ts

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://49.12.69.146:9000";
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

// =========================================================================
// MOCK PRODUKTU (TWARDE DANE DLA PAGESPEED 100/100 PRZY ODPIĘTYM BACKENDZIE)
// =========================================================================
const MOCK_PRODUCT = {
  id: "prod_mock_hyd_360",
  sku: "HYD-URS-360-WZ",
  slug: "pompa-hydrauliczna-wzmocniona-ursus-c360",
  name: "Wzmocniona Pompa Hydrauliczna Zębata Ursus C-360 (Wydajność 32L)",
  price: 450.00,
  description: "<h2>Najwyższej jakości pompa hydrauliczna Hylmet</h2><p>Idealnie dopasowana do ciągników Ursus C-360. Gwarantuje stabilne ciśnienie w układzie hydraulicznym i bezawaryjną pracę z ciężkimi maszynami rolniczymi, takimi jak tury czy agregaty uprawowe. Wykonana z odlewów żeliwnych o zwiększonej wytrzymałości.</p>",
  seo_description: "<h2>Najwyższej jakości pompa hydrauliczna Hylmet</h2><p>Idealnie dopasowana do ciągników Ursus C-360. Gwarantuje stabilne ciśnienie w układzie hydraulicznym i bezawaryjną pracę z ciężkimi maszynami rolniczymi, takimi jak tury czy agregaty uprawowe. Wykonana z odlewów żeliwnych o zwiększonej wytrzymałości.</p>",
  category_text: "Części do maszyn > Ursus > Hydraulika",
  category_path: "czesci-do-ciagnikow/ursus/hydraulika",
  attributes: {
    "Pasuje do marki": "Ursus",
    "Pasuje do modelu": "C-360, C-360 3P, C-355, C-4011",
    "Wydajność": "32 l/min",
    "Ciśnienie nominalne": "16 MPa",
    "Kierunek obrotów": "Lewy",
    "Producent": "Hylmet (Produkt Polski)"
  },
  // Używamy Twojego testowego obrazka z BunnyCDN aby sprawdzić optymalizator!
  external_images: [
    "https://centrumrolnictwa-cdn.b-cdn.net/logo/logo-centrumrolnictwapl-2-1.jpeg",
    "https://centrumrolnictwa-cdn.b-cdn.net/logo/logo-centrumrolnictwapl-2-1.jpeg"
  ],
  images: [],
  expert_advice: "Zawsze przed montażem nowej pompy wymień olej hydrauliczny na nowy (np. Agrol U) oraz koniecznie wyczyść filtry! Stary, zanieczyszczony opiłkami olej potrafi zatrzeć nową pompę w ciągu zaledwie 2 roboczogodzin, co nie podlega gwarancji.",
  symptoms: "Jeżeli podnośnik 'pulsuje', opada pod obciążeniem, wolno podnosi ciężkie maszyny lub po rozgrzaniu oleju z okolic pompy wydobywa się głośne wycie – to stuprocentowy znak zużytych uszczelniaczy i sekcji tłoczącej. Wymiana na wzmocniony model rozwiązuje te problemy od ręki.",
  faq: [
    { question: "Czy do montażu pompy potrzebuję kupić osobno uszczelki?", answer: "Nie, w zestawie znajduje się oryginalny komplet oringów niezbędnych do prawidłowego uszczelnienia przyłącza pompy." },
    { question: "Jaki jest okres gwarancji?", answer: "Pompa objęta jest rygorystyczną, 24-miesięczną gwarancją producenta (wymiana door-to-door w przypadku wad fabrycznych)." }
  ],
  // Cross-sell celowo spięty z mockami z getCategoryData, żeby pokazać Bundle na dole strony
  crossSell: ["OEM-TEST-4", "OEM-TEST-3"]
};


export async function getProductData(identifier: string) {
  // 🚀 ZWROT MOCKA W TRYBIE TESTOWYM 
  // Na razie omijamy serwer całkowicie. Vercel wygeneruje stronę w 50ms.
  return MOCK_PRODUCT;

  /* --- WŁAŚCIWY KOD (ZAMROŻONY NA CZAS TESTÓW FRONTENDU) ---
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (PUBLISHABLE_KEY) { headers["x-publishable-api-key"] = PUBLISHABLE_KEY; }

    const options: RequestInit = { headers: headers, cache: 'no-store' };
    const queryFields = "fields=*variants,*categories,+metadata,+images";

    let res = await fetch(`${MEDUSA_URL}/store/products?handle=${encodeURIComponent(identifier)}&${queryFields}`, options);
    let json = await res.json();

    if (!json.products || json.products.length === 0) {
      const slugParts = identifier.split('-');
      if (slugParts.length > 1) {
        slugParts.pop();
        const shortHandle = slugParts.join('-');
        res = await fetch(`${MEDUSA_URL}/store/products?handle=${encodeURIComponent(shortHandle)}&${queryFields}`, options);
        json = await res.json();
      }
    }

    if (!json.products || json.products.length === 0) {
      res = await fetch(`${MEDUSA_URL}/store/products?q=${encodeURIComponent(identifier)}&${queryFields}`, options);
      json = await res.json();
    }

    if (!json.products || json.products.length === 0) {
       return null;
    }

    const product = json.products[0];
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
      category_path: product.categories?.[0]?.metadata?.category_path || meta.category_path || null,
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
  ------------------------------------------------------------- */
}

// =========================================================================
// MOCK KATEGORII (PEŁNA WERSJA Z FILTRAMI I SEO)
// =========================================================================
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