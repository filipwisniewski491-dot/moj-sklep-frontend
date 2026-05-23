// lib/api.ts

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://178.105.201.145:1337";
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;
const BC_STORE_HASH = process.env.BIGCOMMERCE_STORE_HASH;
const BC_TOKEN = process.env.BIGCOMMERCE_ACCESS_TOKEN;

// 🚀 Błyskawiczne pobieranie produktu bezpośrednio na serwerze
export async function getProductData(identifier: string) {
  try {
    // ISR: Vercel zapamięta ten produkt na 24h (86400s)
    const strapiOptions = {
      headers: STRAPI_TOKEN ? { 'Authorization': `Bearer ${STRAPI_TOKEN}` } : {},
      next: { revalidate: 86400 } 
    };

    // Szukamy po slugu
    let res = await fetch(`${STRAPI_URL}/api/products?filters[slug][$eq]=${encodeURIComponent(identifier)}&populate=*`, strapiOptions);
    let json = await res.json();

    // Jeśli nie ma po slugu, szukamy po SKU
    if (!json.data || json.data.length === 0) {
      res = await fetch(`${STRAPI_URL}/api/products?filters[sku][$eq]=${encodeURIComponent(identifier)}&populate=*`, strapiOptions);
      json = await res.json();
    }

    if (!json.data || json.data.length === 0) return null;

    const strapiProd = json.data[0];
    let bcProd = null;

    // Pobieramy cenę z BigCommerce
    if (strapiProd.sku && BC_STORE_HASH && BC_TOKEN) {
       const bcRes = await fetch(`https://api.bigcommerce.com/stores/${BC_STORE_HASH}/v3/catalog/products?sku=${encodeURIComponent(strapiProd.sku)}&include=images`, {
         headers: { 'X-Auth-Token': BC_TOKEN, 'Accept': 'application/json' },
         next: { revalidate: 86400 }
       });
       if (bcRes.ok) {
         const bcJson = await bcRes.json();
         bcProd = bcJson.data?.[0] || null;
       }
    }

    return {
      id: strapiProd.documentId || strapiProd.id,
      sku: strapiProd.sku,
      slug: strapiProd.slug || identifier,
      name: strapiProd.seo_title || strapiProd.name || bcProd?.name || 'Produkt',
      price: bcProd?.price || 0,
      description: strapiProd.seo_description || strapiProd.description || bcProd?.description || '',
      category_text: strapiProd.category_text || '',
      attributes: strapiProd.technical_specs || strapiProd.attributes || {},
      images: bcProd?.images || [],
      external_images: strapiProd.external_images || [],
      expert_advice: strapiProd.expert_advice || null,
      symptoms: strapiProd.symptoms || null,
      faq: strapiProd.faq || strapiProd.faqs || null,
      crossSell: strapiProd.cross_sell_skus || strapiProd.cross_sell || []
    };
  } catch (error) {
    console.error("[API LIB] Błąd pobierania produktu:", error);
    return null;
  }
}