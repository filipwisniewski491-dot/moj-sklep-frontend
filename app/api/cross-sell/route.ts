import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const skusParam = searchParams.get('skus');

  if (!skusParam) {
    return NextResponse.json({ products: [] });
  }

  const skus = skusParam.split(',').map(s => s.trim()).filter(Boolean);
  
  if (skus.length === 0) {
    return NextResponse.json({ products: [] });
  }

  const storeHash = process.env.BIGCOMMERCE_STORE_HASH;
  const bcToken = process.env.BIGCOMMERCE_ACCESS_TOKEN;
  const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";
  const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN || "0ebf60ed67ac356c914f79c119ffeeec80dd776e8619895f964e2d7776774f0884b13be7b70b0a4b499b0aed8975d48bf03851b18bd2529654ff7413ef4ec684b3642917f54d768dbfb5f5773fc70c4c3eb83e2922fcaccf35e76d0294324a30203019f581c8b30fe978a95f0ca8b11d22aa124d119b314e3d727d8abb90777d";

  try {
    // 1. Zbudowanie zapytania do Strapi dla wielu SKU naraz
    const strapiFilters = skus.map((sku, index) => `filters[sku][$in][${index}]=${encodeURIComponent(sku)}`).join('&');
    const strapiUrl = `${STRAPI_URL}/api/products?${strapiFilters}&publicationState=preview&populate=*`;
    
    const strapiRes = await fetch(strapiUrl, { 
      headers: { 'Authorization': `Bearer ${STRAPI_TOKEN}` }, 
      next: { revalidate: 300 } 
    });
    const strapiJson = await strapiRes.json();
    const strapiProducts = strapiJson.data || [];

    // 2. Równoległe pobranie cen i zdjęć z BigCommerce
    const bcRes = await fetch(`https://api.bigcommerce.com/stores/${storeHash}/v3/catalog/products?sku:in=${skus.join(',')}&include=images`, { 
      headers: { 'X-Auth-Token': bcToken as string, 'Accept': 'application/json' }, 
      next: { revalidate: 300 } 
    });
    const bcJson = await bcRes.json();
    const bcProducts = bcJson.data || [];

    // 3. Mergowanie danych (Złoty standard)
    const finalProducts = skus.map(targetSku => {
      const strapiMatch = strapiProducts.find((p: any) => p.sku === targetSku);
      const bcMatch = bcProducts.find((p: any) => p.sku === targetSku);
      
      if (!strapiMatch && !bcMatch) return null;

      // Wyciąganie obrazka
      let mainImage = bcMatch?.images?.[0]?.url_standard || bcMatch?.images?.[0]?.url || bcMatch?.images?.[0]?.src || null;
      if (!mainImage && strapiMatch?.external_images && strapiMatch.external_images !== "null") {
        try {
          const parsed = typeof strapiMatch.external_images === 'string' ? JSON.parse(strapiMatch.external_images) : strapiMatch.external_images;
          if (Array.isArray(parsed) && parsed.length > 0) mainImage = parsed[0];
        } catch (e) {}
      }

      return {
        sku: targetSku,
        name: strapiMatch?.seo_title || strapiMatch?.name || bcMatch?.name || 'Produkt',
        slug: strapiMatch?.slug || targetSku,
        price: bcMatch?.price || 0,
        image: mainImage
      };
    }).filter(Boolean); // Usuwamy ewentualne nulle, jeśli SKU z jakiegoś powodu wyleciało z bazy

    return NextResponse.json({ products: finalProducts });

  } catch (error) {
    console.error("Błąd API Cross-Sell:", error);
    return NextResponse.json({ products: [] }, { status: 500 });
  }
}