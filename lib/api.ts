// lib/api.ts

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://178.104.130.90:9000";
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

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

    let productsQueryUrl = `${MEDUSA_URL}/store/products?fields=*variants,*images,+metadata&`;
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

      return {
        id: p.id,
        sku: mainVariant?.sku || meta.sku || null,
        name: p.title,
        price: mainVariant?.calculated_price?.calculated_amount ? (mainVariant.calculated_price.calculated_amount / 100) : 0,
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