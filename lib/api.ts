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
export async function getCategoryData(fullPath: string, searchParams: any) {
  try {
    // Automatyczne wykrywanie adresu URL (lokalnie lub na Vercelu)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
                   
    const queryStr = new URLSearchParams(searchParams || {});
    queryStr.set('fullPath', fullPath);
    if (!queryStr.has('limit')) queryStr.set('limit', '24');

    const url = new URL(`/api/search?${queryStr.toString()}`, baseUrl);

    // Fetch z no-store, aby Vercel nie blokował buildu i zawsze miał świeże dane
    const res = await fetch(url.toString(), {
      cache: 'no-store'
    });

    if (!res.ok) {
      throw new Error(`API Error: ${res.status}`);
    }

    const data = await res.json();
    return { searchData: data, filtersData: data.filters || {} };
    
  } catch (error: any) {
    console.error("Fetch Error URL:", error.message);
    return { 
      searchData: { 
        products: [], 
        category: { h1_dynamic: `BŁĄD WYSZUKIWANIA: Brak połączenia z bazą (${error.message})` } 
      }, 
      filtersData: {} 
    };
  }
}