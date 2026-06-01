// lib/api.ts

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://49.12.69.146:9000";
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

// 🚀 Błyskawiczne pobieranie produktu bezpośrednio na serwerze (Medusa 2.0)
export async function getProductData(identifier: string) {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    if (PUBLISHABLE_KEY) {
      headers["x-publishable-api-key"] = PUBLISHABLE_KEY;
    }

    const options: RequestInit = {
      headers: headers,
      // Cache'owanie w Next.js - revalidacja co 24h
      next: { revalidate: 86400 } 
    };

    // Uderzamy do Medusy po handle (slug) i zaciągamy relacje: warianty oraz kategorie
    const res = await fetch(
      `${MEDUSA_URL}/store/products?handle=${encodeURIComponent(identifier)}&fields=*variants,*categories`, 
      options
    );

    if (!res.ok) {
       console.error(`[API LIB] Błąd odpowiedzi Medusy: ${res.status}`);
       return null;
    }

    const json = await res.json();

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
      
      // Uwaga: Skrypt importujący wrzucił produkty jako Drafty bez cen.
      // Docelowo cenę w Medusa 2.0 pobiera się z kalkulacji regionu.
      price: mainVariant?.calculated_price?.calculated_amount || 0, 
      
      description: product.description || '',
      category_text: product.categories?.[0]?.name || meta.category || '',
      
      // Dynamic Attributes Filters - płynnie zasilone danymi z Medusy
      attributes: meta.technical_specs || {},
      
      // Zdjęcia własne Medusy
      images: product.images?.map((img: any) => ({ url: img.url })) || [],
      
      // Zdjęcia z Bunny.net wciągnięte z metadanych
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