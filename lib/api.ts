// lib/api.ts

// Domyślny fallback ustawiony na Twój nowy serwer Hetzner (178.104.130.90)
const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://178.104.130.90:9000";
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

// =========================================================================
// POBIERANIE POJEDYNCZEGO PRODUKTU Z MEDUSY
// =========================================================================
export async function getProductData(identifier: string) {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (PUBLISHABLE_KEY) { headers["x-publishable-api-key"] = PUBLISHABLE_KEY; }

    const options: RequestInit = { headers: headers, cache: 'no-store' };
    const queryFields = "fields=*variants,*categories,+metadata,+images";

    let res = await fetch(`${MEDUSA_URL}/store/products?handle=${encodeURIComponent(identifier)}&${queryFields}`, options);
    let json = await res.json();

    // Fallback: próba szukania po skróconym handle (jeśli zawiera np. ID na końcu)
    if (!json.products || json.products.length === 0) {
      const slugParts = identifier.split('-');
      if (slugParts.length > 1) {
        slugParts.pop();
        const shortHandle = slugParts.join('-');
        res = await fetch(`${MEDUSA_URL}/store/products?handle=${encodeURIComponent(shortHandle)}&${queryFields}`, options);
        json = await res.json();
      }
    }

    // Fallback: wyszukiwanie ogólne po zapytaniu (q)
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
      // POPRAWKA: Dzielenie przez 100, bo Medusa wysyła grosze!
      price: mainVariant?.calculated_price?.calculated_amount ? (mainVariant.calculated_price.calculated_amount / 100) : 0, 
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
}

// =========================================================================
// POBIERANIE KATEGORII I LISTY PRODUKTÓW Z MEDUSY
// =========================================================================
export async function getCategoryData(fullPath: string, searchParams: any) {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (PUBLISHABLE_KEY) { headers["x-publishable-api-key"] = PUBLISHABLE_KEY; }

    const options: RequestInit = { headers: headers, cache: 'no-store' };
    
    // 1. Znajdź kategorię po 'handle' (ścieżce)
    const categoryRes = await fetch(`${MEDUSA_URL}/store/product-categories?handle=${encodeURIComponent(fullPath)}`, options);
    const categoryJson = await categoryRes.json();
    const category = categoryJson.product_categories?.[0];

    if (!category) {
        return null;
    }

    // 2. Pobierz produkty przypisane do tej kategorii
    const productsRes = await fetch(`${MEDUSA_URL}/store/products?category_id[]=${category.id}`, options);
    const productsJson = await productsRes.json();

    // 3. Formatowanie zgodne z Twoim frontendem
    return {
      searchData: {
        totalCount: productsJson.count || productsJson.products?.length || 0,
        products: productsJson.products?.map((p: any) => {
          const meta = p.metadata || {};
          const mainVariant = p.variants?.[0] || null;
          return {
            id: p.id,
            sku: mainVariant?.sku || meta.sku || null,
            name: p.title,
            // POPRAWKA: Dzielenie przez 100, bo Medusa wysyła grosze!
            price: mainVariant?.calculated_price?.calculated_amount ? (mainVariant.calculated_price.calculated_amount / 100) : 0,
            slug: p.handle,
            external_images: meta.external_images || [],
            images: p.images || []
          };
        }) || [],
        category: {
          h1_dynamic: category.name,
          top_seo_text: category.description || "",
          bottom_seo_text: category.metadata?.bottom_seo_text || "",
          faqs: category.metadata?.faqs || []
        },
        breadcrumbs: [
          { name: category.name, path: category.handle }
        ],
        subcategories: category.category_children?.map((c: any) => c.name) || []
      },
      filtersData: {} 
    };
  } catch (error) {
    console.error("[API LIB] Błąd pobierania kategorii z Medusy:", error);
    return null;
  }
}