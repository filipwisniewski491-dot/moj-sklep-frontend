// lib/api.ts

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://178.104.130.90:9000";
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

// ⚙️ Region Polska (PLN + VAT 23%). Bez region_id Medusa NIE policzy VAT
// i calculated_price będzie null. To jest klucz do poprawnych cen.
const REGION_ID = process.env.NEXT_PUBLIC_MEDUSA_REGION_ID || "reg_01KT16M40467MTKK4ANCA96R25";
// Kraj jest wymagany, by Medusa naliczyła VAT (stawka jest przypięta do kraju).
const COUNTRY_CODE = process.env.NEXT_PUBLIC_MEDUSA_COUNTRY_CODE || "pl";

/**
 * Jedno źródło prawdy o cenie.
 * Medusa (dzięki region_id + country_code) zwraca w calculated_price:
 *   - calculated_amount_with_tax     -> BRUTTO (z VAT 23%)
 *   - calculated_amount_without_tax  -> NETTO
 * Front NICZEGO nie mnoży ani nie dzieli — tylko czyta gotowe wartości.
 */
function extractPrice(variant: any): { brutto: number; netto: number } {
  const cp = variant?.calculated_price;
  if (!cp) return { brutto: 0, netto: 0 };

  // Preferujemy jawne pola z podatkiem. Fallback na calculated_amount, gdyby
  // podatek nie był naliczony (wtedy amount = netto).
  const netto =
    typeof cp.calculated_amount_without_tax === "number"
      ? cp.calculated_amount_without_tax
      : (typeof cp.calculated_amount === "number" ? cp.calculated_amount : 0);

  const brutto =
    typeof cp.calculated_amount_with_tax === "number"
      ? cp.calculated_amount_with_tax
      : netto; // gdy brak VAT — brutto = netto

  return {
    brutto: Number(brutto.toFixed(2)),
    netto: Number(netto.toFixed(2)),
  };
}

function extractCategoryIds(category: any): string[] {
  let leaves: string[] = [];
  let branches: string[] = [];

  function traverse(cat: any) {
    if (cat.category_children && cat.category_children.length > 0) {
      branches.push(cat.id);
      cat.category_children.forEach((child: any) => traverse(child));
    } else {
      leaves.push(cat.id);
    }
  }

  traverse(category);
  return [...leaves, ...branches];
}

export async function getProductData(identifier: string) {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (PUBLISHABLE_KEY) { headers["x-publishable-api-key"] = PUBLISHABLE_KEY; }

    const options: RequestInit = { headers: headers, next: { revalidate: 3600 } };

    // ⚙️ Prosimy o calculated_price (wymaga region_id w URL).
    const queryFields =
      "fields=*variants,*variants.calculated_price,*categories,+metadata,+images";
    const regionParam = `region_id=${REGION_ID}&country_code=${COUNTRY_CODE}`;

    let res = await fetch(
      `${MEDUSA_URL}/store/products?handle=${encodeURIComponent(identifier)}&${queryFields}&${regionParam}`,
      options
    );
    let json = await res.json();

    if (!json.products || json.products.length === 0) {
      const slugParts = identifier.split('-');
      if (slugParts.length > 1) {
        slugParts.pop();
        const shortHandle = slugParts.join('-');
        res = await fetch(
          `${MEDUSA_URL}/store/products?handle=${encodeURIComponent(shortHandle)}&${queryFields}&${regionParam}`,
          options
        );
        json = await res.json();
      }
    }

    if (!json.products || json.products.length === 0) {
      res = await fetch(
        `${MEDUSA_URL}/store/products?q=${encodeURIComponent(identifier)}&${queryFields}&${regionParam}`,
        options
      );
      json = await res.json();
    }

    if (!json.products || json.products.length === 0) {
       return null;
    }

    const product = json.products[0];
    const meta = product.metadata || {};
    const mainVariant = product.variants?.[0] || null;

    // ✅ Cena wyłącznie z Medusy: brutto (z VAT) + netto obok siebie.
    const { brutto, netto } = extractPrice(mainVariant);

    return {
      id: product.id,
      sku: mainVariant?.sku || meta.sku || null,
      slug: product.handle,
      name: product.title || 'Produkt',

      // price = brutto (to, co klient płaci). netto obok, do wyświetlenia „netto".
      price: brutto,
      priceNetto: netto,

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

export async function getCategoryData(fullPath: string, searchParams: any) {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (PUBLISHABLE_KEY) { headers["x-publishable-api-key"] = PUBLISHABLE_KEY; }

    const options: RequestInit = { headers: headers, next: { revalidate: 3600 } };

    // 1. Pobieramy obecną kategorię z drzewem
    const categoryRes = await fetch(
      `${MEDUSA_URL}/store/product-categories?handle=${encodeURIComponent(fullPath)}&include_descendants_tree=true`,
      options
    );
    const categoryJson = await categoryRes.json();
    const category = categoryJson.product_categories?.[0];

    if (!category) {
        return null;
    }

    // 🚀 NAPRAWA OKRUSZKÓW: Pobieramy pełną ścieżkę z API, by mieć polskie znaki!
    const slugArray = fullPath.split('/');
    const handlesQuery = slugArray.map(slug => `handle[]=${slug}`).join('&');
    const breadcrumbsRes = await fetch(`${MEDUSA_URL}/store/product-categories?${handlesQuery}`, options);
    const breadcrumbsJson = await breadcrumbsRes.json();
    const fetchedCategories = breadcrumbsJson.product_categories || [];

    const dynamicBreadcrumbs = slugArray.map((slugPart, index) => {
      const cumulativePath = slugArray.slice(0, index + 1).join('/');
      const foundCat = fetchedCategories.find((c: any) => c.handle === slugPart);
      return {
        name: foundCat?.name || slugPart.replace(/-/g, ' '),
        path: cumulativePath
      };
    });

    // 2. Wyciągamy podkategorie i limitujemy ID, żeby nie przeciążyć serwera
    const allCategoryIds = extractCategoryIds(category);
    const safeCategoryIds = allCategoryIds.slice(0, 60);

    // ⚙️ calculated_price + region_id także dla list kategorii.
    let productsQueryUrl = `${MEDUSA_URL}/store/products?fields=*variants,*variants.calculated_price,*images,+metadata&region_id=${REGION_ID}&country_code=${COUNTRY_CODE}&`;
    safeCategoryIds.forEach(id => {
      productsQueryUrl += `category_id[]=${id}&`;
    });
    productsQueryUrl += `limit=100`; // Ładujemy do 100 sztuk dla filtrów

    const productsRes = await fetch(productsQueryUrl, options);
    const productsJson = await productsRes.json();

    // 🚀 NAPRAWA FILTRÓW: Dynamiczne wyciąganie danych z JSON (technical_specs) z Medusy
    const extractedFilters: Record<string, Record<string, number>> = {};

    const mappedProducts = productsJson.products?.map((p: any) => {
      const meta = p.metadata || {};
      const mainVariant = p.variants?.[0] || null;

      // Zbieramy atrybuty techniczne
      let techSpecs: Record<string, any> = {};

      if (meta.technical_specs) {
        if (typeof meta.technical_specs === 'string') {
          try { techSpecs = JSON.parse(meta.technical_specs); } catch(e) {}
        } else if (typeof meta.technical_specs === 'object') {
          techSpecs = meta.technical_specs;
        }
      }

      // Dodajemy też markę i model, żeby działały jako filtry w panelu
      if (meta['Pasuje do marki']) techSpecs['Pasuje do marki'] = meta['Pasuje do marki'];
      if (meta['Pasuje do modelu']) techSpecs['Pasuje do modelu'] = meta['Pasuje do modelu'];
      if (meta.producent || meta.Producent) techSpecs['Producent'] = meta.producent || meta.Producent;

      // Agregujemy (zliczamy) cechy do filtrów bocznych
      Object.entries(techSpecs).forEach(([key, value]) => {
        if (!value) return;

        // Zabezpieczenie dla wartości tablicowych (np. ["Ursus", "Zetor"])
        const values = Array.isArray(value) ? value : [value];
        const formattedKey = key.charAt(0).toUpperCase() + key.slice(1); // Zawsze z dużej litery

        values.forEach(val => {
          const stringVal = String(val).trim();
          if (!stringVal) return;

          if (!extractedFilters[formattedKey]) {
            extractedFilters[formattedKey] = {};
          }
          extractedFilters[formattedKey][stringVal] = (extractedFilters[formattedKey][stringVal] || 0) + 1;
        });
      });

      // ✅ Cena wyłącznie z Medusy (brutto + netto).
      const { brutto, netto } = extractPrice(mainVariant);

      return {
        id: p.id,
        sku: mainVariant?.sku || meta.sku || null,
        name: p.title,

        price: brutto,
        priceNetto: netto,

        slug: p.handle,
        external_images: meta.external_images || [],
        images: p.images || []
      };
    }) || [];

    return {
      searchData: {
        totalCount: productsJson.count || mappedProducts.length || 0,
        products: mappedProducts,
        category: {
          ...category,
          h1_dynamic: category.name,
          top_seo_text: category.metadata?.top_seo_text || category.description || "",
          bottom_seo_text: category.metadata?.bottom_seo_text || "",
          faqs: category.metadata?.faqs || []
        },
        breadcrumbs: dynamicBreadcrumbs,
        // 🚀 NAPRAWA PODKATEGORII: Przekazujemy pełne obiekty dla kafelków!
        subcategories: category.category_children?.map((c: any) => ({
          name: c.name,
          path: c.handle,
          id: c.id
        })) || []
      },
      // 🚀 Przekazujemy wszystkie zbudowane filtry do lewego panelu!
      filtersData: extractedFilters
    };
  } catch (error) {
    console.error("[API LIB] Błąd pobierania kategorii z Medusy:", error);
    return null;
  }
}