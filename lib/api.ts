export async function getCategoryData(fullPath: string, searchParams: any) {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (PUBLISHABLE_KEY) { headers["x-publishable-api-key"] = PUBLISHABLE_KEY; }

    const options: RequestInit = { headers: headers, next: { revalidate: 3600 } };
    
    const categoryRes = await fetch(
      `${MEDUSA_URL}/store/product-categories?handle=${encodeURIComponent(fullPath)}&include_descendants_tree=true`, 
      options
    );
    const categoryJson = await categoryRes.json();
    const category = categoryJson.product_categories?.[0];

    if (!category) {
        return null;
    }

    // 🚀 GENIALNE OKRUSZKI: Pobieramy oryginalne nazwy wszystkich kategorii ze ścieżki
    const slugArray = fullPath.split('/');
    const handlesQuery = slugArray.map(slug => `handle[]=${slug}`).join('&');
    
    const breadcrumbsRes = await fetch(`${MEDUSA_URL}/store/product-categories?${handlesQuery}`, options);
    const breadcrumbsJson = await breadcrumbsRes.json();
    const fetchedCategories = breadcrumbsJson.product_categories || [];

    const dynamicBreadcrumbs = slugArray.map((slugPart, index) => {
      const cumulativePath = slugArray.slice(0, index + 1).join('/');
      const foundCat = fetchedCategories.find((c: any) => c.handle === slugPart);
      return {
        name: foundCat?.name || slugPart.replace(/-/g, ' '), // Prawdziwa nazwa z polskimi znakami!
        path: cumulativePath
      };
    });

    const allCategoryIds = extractCategoryIds(category);
    const safeCategoryIds = allCategoryIds.slice(0, 60);

    let productsQueryUrl = `${MEDUSA_URL}/store/products?fields=*variants,*images,+metadata&`;
    safeCategoryIds.forEach(id => {
      productsQueryUrl += `category_id[]=${id}&`;
    });
    productsQueryUrl += `limit=100`;

    const productsRes = await fetch(productsQueryUrl, options);
    const productsJson = await productsRes.json();

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
            price: mainVariant?.calculated_price?.calculated_amount ? (mainVariant.calculated_price.calculated_amount / 100) : 0,
            slug: p.handle,
            external_images: meta.external_images || [],
            images: p.images || []
          };
        }) || [],
        category: {
          ...category, 
          h1_dynamic: category.name,
          top_seo_text: category.metadata?.top_seo_text || category.description || "",
          bottom_seo_text: category.metadata?.bottom_seo_text || "",
          faqs: category.metadata?.faqs || []
        },
        breadcrumbs: dynamicBreadcrumbs, // 🚀 Wrzucamy idealne okruszki
        subcategories: category.category_children?.map((c: any) => c.name) || []
      },
      filtersData: {} 
    };
  } catch (error) {
    console.error("[API LIB] Błąd pobierania kategorii z Medusy:", error);
    return null;
  }
}