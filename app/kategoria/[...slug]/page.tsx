import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { meiliClient } from '@/lib/meilisearch-client';
import { getBrandsSet, getModelsForBrand, brandToSlug, modelToSlug } from '@/lib/brand-utils';

import Header from '@/components/Header';
import MobileBottomNav from '@/components/MobileBottomNav';
import CategoryHeader from '@/components/CategoryHeader';
import CategoryWorkspace from '@/components/CategoryWorkspace';

const DynamicFooter = dynamic(() => import('@/components/Footer'));
const DynamicFaqSection = dynamic(() => import('@/components/FaqSection'));
const DynamicSeoSection = dynamic(() => import('@/components/SeoSection'));

export const revalidate = 3600;
const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://panel.centrumrolnictwa.com";
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
const SITE_URL = "https://centrumrolnictwa.com";

// 🚀 PRE-RENDER najważniejszych kategorii już przy budowaniu (deploy).
// Dzięki temu są w cache OD STARTU - serwer odpowiada błyskawicznie nawet dla
// pierwszego użytkownika i dla PageSpeed (rozwiązuje problem wysokiego TTFB na
// głównych, najcięższych kategoriach). Pozostałe kategorie generują się na żądanie
// (dynamicParams = true) i trafiają do cache po pierwszym wejściu.
export const dynamicParams = true;

export async function generateStaticParams() {
  const mainCategories = [
    'czesci-do-ciagnikow',
    'czesci-do-maszyn',
    'hydraulika-silowa',
    'warsztat-i-uniwersalne',
    'hodowla-i-zootechnika',
  ];

  const params: { slug: string[] }[] = mainCategories.map((c) => ({ slug: [c] }));

  // Dorzuć bezpośrednie podkategorie każdej głównej kategorii - one też będą szybkie.
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (PUBLISHABLE_KEY) headers['x-publishable-api-key'] = PUBLISHABLE_KEY;

    for (const cat of mainCategories) {
      const res = await fetch(
        `${MEDUSA_URL}/store/product-categories?handle=${encodeURIComponent(cat)}&include_descendants_tree=true`,
        { headers }
      );
      if (!res.ok) continue;
      const json = await res.json();
      const children = json.product_categories?.[0]?.category_children || [];
      for (const child of children) {
        if (child?.handle) params.push({ slug: [cat, child.handle] });
      }
    }
  } catch (e) {
    console.warn('generateStaticParams: pominięto podkategorie —', e);
  }

  return params;
}

// 🔁 DYNAMICZNE FILTRY
// Lista pól filtrowalnych jest pobierana z Meili (settings/filterable-attributes),
// więc cokolwiek dodasz/usuniesz w Meili, pojawi się TU automatycznie — bez ruszania kodu.
// Dla każdej kategorii liczymy pokrycie i pokazujemy tylko najlepsze filtry, które
// faktycznie mają wartości W TEJ kategorii.

// Marka i model mają WŁASNE UI ("Dobierz do maszyny"), więc NIE liczą się do 5 filtrów technicznych.
// Pola, których nie pokazujemy jako filtr (ścieżka kategorii, odrzucone przez właściciela, sklejone wymiary).
const FACET_EXCLUDE = new Set([
  'category_handles', 'Waga [kg]', 'Zastosowanie', 'Grupa produktowa',
  'Wymiary', 'Wymiary [mm]', 'Wymiary (mm)', 'Wymiary (Dł. x Szer. x Wys.) [mm]',
]);
// Do RANKINGU filtrów technicznych pomijamy też markę/model/własną markę (mają osobne UI).
const RANK_HIDE = new Set([...FACET_EXCLUDE, 'Pasuje do marki', 'Pasuje do modelu', 'Marka']);
// DOKŁADNIE tyle filtrów technicznych pokazujemy w każdej kategorii (te z najwyższym pokryciem).
const MAX_FACETS_PER_CATEGORY = 5;
// Odrzucamy tylko pola z EKSTREMALNĄ liczbą wartości (sklejone stringi/wolny tekst).
// Próg wysoki, bo długie listy mają wyszukiwarkę i "pokaż więcej" — są używalne.
const MAX_FACET_VALUES = 200;
// Awaryjne filtry techniczne, gdy sonda padnie — same MAŁE, bezpieczne pola (nigdy nie panikują).
const FACET_FALLBACK = [
  'Materiał', 'Napięcie [V]', 'Kolor', 'Seria (L-Lekka / S-Ciężka)', 'Pojemność [l]'
];

// 🛡️ BEZPIECZNA lista pól, o które wolno pytać w sondzie facetów.
// NIE zawiera pól-potworów (Typ produktu/Waga/Pasuje do modelu mają tysiące wartości
// i wywalają Meili przy facets:["*"]), ani pola panikującego "Grubość drutu [mm]",
// ani marki/modelu (osobne UI). To są realni kandydaci na filtry techniczne.
const CANDIDATE_FACETS = [
  // wymiary / liczby (w wąskich kategoriach mają mało wartości; w szerokich i tak odpadną przez limit)
  'Średnica wewnętrzna (DN) [mm]', 'Średnica wewnętrzna [mm]', 'Średnica zewnętrzna [mm]', 'Średnica [mm]',
  'Średnica sworznia [mm]', 'Średnica sworznia zaczepu [mm]', 'Średnica przyłącza [mm]', 'Średnica tłoczyska [mm]',
  'Średnica tłoka [mm]', 'Średnica cylindra wewn. [mm]', 'Średnica otworu [mm]', 'Średnica koła pasowego [mm]',
  'Średnica talerza [mm]', 'Średnica węża zewnętrzna [mm]', 'Ø wew. (mm)',
  'Szerokość/Grubość [mm]', 'Szerokość [mm]', 'Szerokość robocza [mm]', 'Szerokość paska [mm]',
  'Szerokość siedzenia [mm]', 'Szerokość szyny (mm)', 'Szerokość prowadnicy (mm)',
  'Wysokość [mm]', 'Grubość [mm]', 'Grubość elementu [mm]', 'Grubość lemiesza/dłuta [mm]',
  'Długość [mm]', 'Długość robocza [mm]', 'Długość paska [mm]', 'Długość śruby/elementu [mm]', 'Długość [cm]',
  'Skok siłownika [mm]', 'Rozstaw otworów kołnierza [mm]', 'Rozstaw otworów montażowych [mm]',
  'Napięcie [V]', 'Natężenie [A]', 'Moc [kW]', 'Moc [W]', 'Pojemność [l]', 'Pojemność [Ah]',
  'Max. ciśnienie [bar]', 'Max. ciśnienie robocze [bar]', 'Ciśnienie robocze [bar]', 'Przepływ max [l/min]',
  'Siła wyrzutu [N]', 'Siła nacisku/uciągu [t]', 'Wartość D [kN]', 'Nacisk pionowy [kg]', 'Obciążenie (kg)',
  'Udźwig [kg]', 'Twardość Shore', 'Ilość zębów', 'Ilość sekcji', 'Ilość ogniw/żeber', 'Ilość pierścieni',
  'Ilość oplotów stalowych (SN)', 'Wydajność geometryczna [cm3/obr]', 'Wymiar gwintu', 'Rozmiar klucza/końcówki [mm]',
  // kategoryczne (czyste enumy)
  'Materiał', 'Materiał (Żeliwo/Tworzywo)', 'Materiał obicia', 'Gwint', 'Kategoria zaczepu (Kat.)',
  'Seria (L-Lekka / S-Ciężka)', 'Typ uszczelnienia (np. 2RS, Simmering)', 'Typ uszczelnienia',
  'Kolor', 'Kolor szyby', 'Typ złącza (Męski/Żeński)', 'Typ złącza (Miękkie/Twarde)', 'Wersja', 'Rozmiar',
  'Rozmiar gwintów przyłączeniowych', 'Kierunek obrotów (L/P)', 'Strona', 'Strona montażu (L/P)',
  'Profil paska/łańcucha', 'Blokada', 'Funkcje światła', 'Typ sterowania (Ręczne/Elektryczne)',
  'Standard (EURO/PUSH-PULL)', 'Klasa twardości (np. 8.8, 10.9)', 'Typ wałka (Stożek/Frez)', 'Typ łba',
  'Rodzaj amortyzacji', 'Norma', 'Kategoria', 'Przeznaczenie', 'Model silnika',
];

const MIN_PRODUCTS_FOR_INDEX = 3;

// Prefiks pól liczbowych utworzonych przez numapply.
const NUM_TWIN = 'n_';
// Heurystyka liczbowości — IDENTYCZNA jak is_numeric_field w normalize_meili.py.
// Dzięki temu front sam wykrywa pola liczbowe (z jednostką w [..]) bez ręcznej listy.
const NUM_UNIT_RE = /\[(mm|cm|m|bar|mpa|psi|v|a|ah|mah|kg|g|w|kw|n|t|nm|kn|l|ml|°c|c|lm|j|cm3\/obr|l\/min|l\/h|mikrony|µm|rpm)\]/i;
const NUM_EXCLUDE_WORDS = ['wymiar', 'gwint', 'profil', 'klasa', 'rozmiar', 'typ', 'seria', 'numer', 'kod', 'rodzaj',
  'strona', 'kierunek', 'norma', 'standard', 'kategoria', 'wersja', 'kolor', 'materia', 'zastosowanie', 'marka',
  'model', 'pasuje', 'grupa', 'forma', 'funkcj', 'blokada', 'jednostk'];
// Pola liczbowe, których NIE robimy suwakami (zgodne ze SLIDER_EXCLUDE w skrypcie).
const SLIDER_EXCLUDE = new Set<string>(['Waga [kg]', 'Rozstaw otworów kołnierza [mm]', 'Rozstaw otworów montażowych [mm]']);
function looksNumeric(field: string): boolean {
  if (field.startsWith(NUM_TWIN) || SLIDER_EXCLUDE.has(field)) return false;
  const low = field.toLowerCase();
  if (NUM_EXCLUDE_WORDS.some(w => low.includes(w))) return false;
  return NUM_UNIT_RE.test(field) || low.includes('twardość shore');
}

// Cache listy filtrowalnych (na instancję serwera, odświeżane co godzinę).
let _filterableCache: { at: number; list: string[] } | null = null;
async function getFilterableAttributes(): Promise<string[]> {
  if (_filterableCache && Date.now() - _filterableCache.at < 3600_000) return _filterableCache.list;
  try {
    const idx = meiliClient.index('products');
    let list: any = await (idx as any).getFilterableAttributes();
    if (!Array.isArray(list)) {
      const settings: any = await (idx as any).getSettings();
      list = settings?.filterableAttributes || [];
    }
    const clean = (Array.isArray(list) ? list : []).filter((k: string) => !FACET_EXCLUDE.has(k));
    if (clean.length > 0) _filterableCache = { at: Date.now(), list: clean };
    return clean.length > 0 ? clean : FACET_FALLBACK;
  } catch (e) {
    console.warn('getFilterableAttributes: fallback —', e);
    return FACET_FALLBACK;
  }
}

// Wybiera DOKŁADNIE top-N filtrów technicznych wg pokrycia w danej kategorii.
// Bez marki/modelu (osobne UI) i bez pól wykluczonych; pomija pola jednowartościowe i ekstremalnie liczne.
function rankCategoryFacets(
  dist: Record<string, Record<string, number>>,
  max = MAX_FACETS_PER_CATEGORY
): string[] {
  const scored = Object.entries(dist)
    .filter(([k, vals]) => !RANK_HIDE.has(k) && !k.startsWith(NUM_TWIN) && vals && Object.keys(vals).length >= 2) // ≥2 wartości; bez bliźniaków n_ (są tylko pod suwaki)
    .filter(([, vals]) => Object.keys(vals).length <= MAX_FACET_VALUES) // odsiej sklejony tekst
    .map(([k, vals]) => [k, Object.values(vals).reduce((a, b) => a + b, 0)] as [string, number])
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k);
  return scored.slice(0, max);
}

function buildFilterValue(key: string, val: string): string {
  const values = String(val).split(',').map(v => v.trim()).filter(Boolean);
  if (values.length === 0) return '';
  const orConditions = values.map(v => `"${key}" = "${v.replace(/"/g, '\\"')}"`);
  return orConditions.length === 1 ? orConditions[0] : `(${orConditions.join(' OR ')})`;
}

async function resolvePath(slugArray: string[]) {
  const brandsMap = await getBrandsSet();

  let categorySegments: string[] = [];
  let brandSlug: string | null = null;
  let brandName: string | null = null;
  let modelSlug: string | null = null;
  let modelName: string | null = null;

  for (let i = 0; i < slugArray.length; i++) {
    const seg = slugArray[i];
    if (!brandSlug && brandsMap[seg]) {
      brandSlug = seg;
      brandName = brandsMap[seg];
    } else if (brandSlug && !modelSlug) {
      modelSlug = seg;
    } else if (!brandSlug) {
      categorySegments.push(seg);
    }
  }

  if (brandName && modelSlug) {
    const modelsMap = await getModelsForBrand(brandName);
    modelName = modelsMap[modelSlug] || null;
    if (!modelName) modelSlug = null;
  }

  return { categorySegments, brandSlug, brandName, modelSlug, modelName };
}

export async function generateMetadata({ params }: any): Promise<Metadata> {
  const resolvedParams = await params;
  const slugArray = Array.isArray(resolvedParams?.slug) ? resolvedParams.slug : [resolvedParams?.slug].filter(Boolean);

  const { categorySegments, brandName, modelName } = await resolvePath(slugArray);

  const categoryHandle = categorySegments[categorySegments.length - 1] || '';
  let categoryName = categoryHandle.replace(/-/g, ' ');

  try {
    const headers: any = { "Content-Type": "application/json" };
    if (PUBLISHABLE_KEY) headers["x-publishable-api-key"] = PUBLISHABLE_KEY;
    const res = await fetch(`${MEDUSA_URL}/store/product-categories?handle=${encodeURIComponent(categoryHandle)}`, {
      headers, next: { revalidate: 3600 }
    });
    if (res.ok) {
      const json = await res.json();
      if (json.product_categories?.[0]) categoryName = json.product_categories[0].name;
    }
  } catch {}

  let productCount = 0;
  try {
    const index = meiliClient.index('products');
    const filterParts: string[] = [];
    if (categoryHandle) filterParts.push(`category_handles = "${categoryHandle}"`);
    if (brandName) filterParts.push(`"Pasuje do marki" = "${brandName.replace(/"/g, '\\"')}"`);
    if (modelName) filterParts.push(`"Pasuje do modelu" = "${modelName.replace(/"/g, '\\"')}"`);
    const r = await index.search('', { limit: 0, filter: filterParts.join(' AND '), hitsPerPage: 1 } as any);
    productCount = (r as any).totalHits ?? r.estimatedTotalHits ?? 0;
  } catch {}

  let title: string;
  let description: string;
  let canonicalPath = '/kategoria/' + slugArray.join('/');

  // Mianownik (nazwa kategorii z bazy) - zawsze poprawnie gramatycznie, bez odmiany.
  if (brandName && modelName) {
    title = `${categoryName} ${brandName} ${modelName} | CentrumRolnictwa.pl`;
    description = `${categoryName} ${brandName} ${modelName} – części zamienne zgodne z OEM. Gwarancja dopasowania, szybka wysyłka.${productCount > 0 ? ` ${productCount} produktów.` : ''}`;
  } else if (brandName) {
    title = `${categoryName} ${brandName} | CentrumRolnictwa.pl`;
    description = `${categoryName} ${brandName} – części zamienne zgodne z OEM. Szeroki wybór, gwarancja dopasowania, szybka wysyłka.${productCount > 0 ? ` ${productCount} produktów w ofercie.` : ''}`;
  } else {
    title = `${categoryName} | CentrumRolnictwa.pl`;
    description = `${categoryName} – części zamienne zgodne z OEM. Szeroki wybór komponentów, gwarancja dopasowania i niezawodności.`;
  }

  const isBrandOrModelPage = !!brandName;
  const shouldIndex = !isBrandOrModelPage || productCount >= MIN_PRODUCTS_FOR_INDEX;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    // ⛔ BLOKADA GOOGLE - sklep w budowie (ceny 0,00). Gdy gotowy, PRZYWRÓĆ linię poniżej:
    // robots: shouldIndex ? { index: true, follow: true } : { index: false, follow: true },
    robots: { index: false, follow: false },
    openGraph: { title, description, url: SITE_URL + canonicalPath, type: 'website' },
  };
}

export default async function CategoryPage({ params, searchParams }: any) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const slugArray = Array.isArray(resolvedParams?.slug) ? resolvedParams.slug : [resolvedParams?.slug].filter(Boolean);
  const fullPath = slugArray.join('/');

  const { categorySegments, brandSlug, brandName, modelSlug, modelName } = await resolvePath(slugArray);

  const currentHandle = categorySegments.length > 0 ? categorySegments[categorySegments.length - 1] : '';

  let dbCategoryData: any = {
    h1_dynamic: currentHandle.toUpperCase().replace(/-/g, ' '),
    name: currentHandle.replace(/-/g, ' '),
    top_seo_text: "",
    bottom_seo_text: "",
    faqs: []
  };
  let allowedHandles: string[] = currentHandle ? [currentHandle] : [];
  let currentCategory: any = null;

  // 🔥 SZYBKOŚĆ: oba zapytania do Medusy startują RÓWNOLEGLE (są niezależne).
  //  - catRes: dane bieżącej kategorii (H1, SEO, drzewo podkategorii)
  //  - namesRes: nazwy wszystkich kategorii ścieżki (polskie znaki w breadcrumbach)
  const categoryNames: Record<string, string> = {};
  {
    const headers: any = { "Content-Type": "application/json" };
    if (PUBLISHABLE_KEY) headers["x-publishable-api-key"] = PUBLISHABLE_KEY;
    const handleQuery = categorySegments.map((h) => `handle[]=${encodeURIComponent(h)}`).join('&');

    const [catRes, namesRes] = await Promise.all([
      currentHandle
        ? fetch(`${MEDUSA_URL}/store/product-categories?handle=${encodeURIComponent(currentHandle)}`, { headers, next: { revalidate: 3600 } }).catch(() => null)
        : Promise.resolve(null),
      categorySegments.length > 0
        ? fetch(`${MEDUSA_URL}/store/product-categories?${handleQuery}&limit=100&fields=name,handle`, { headers, next: { revalidate: 3600 } }).catch(() => null)
        : Promise.resolve(null),
    ]);

    // Przetwórz dane bieżącej kategorii
    if (catRes && catRes.ok) {
      try {
        const json = await catRes.json();
        currentCategory = json.product_categories?.[0];
        if (currentCategory) {
          const meta = currentCategory.metadata || {};
          dbCategoryData.name = currentCategory.name;
          dbCategoryData.h1_dynamic = meta.h1_dynamic || currentCategory.name.toUpperCase();
          dbCategoryData.top_seo_text = meta.top_seo_text || currentCategory.description || "";
          dbCategoryData.bottom_seo_text = meta.bottom_seo_text || null;
          dbCategoryData.faqs = meta.faqs || meta.faq || [];

          const collectHandles = (cat: any) => {
            if (!cat) return;
            if (allowedHandles.length < 100) {
              if (!allowedHandles.includes(cat.handle)) allowedHandles.push(cat.handle);
              if (cat.category_children) cat.category_children.forEach(collectHandles);
            }
          };
          collectHandles(currentCategory);
        }
      } catch (e) {
        console.warn("Błąd parsowania kategorii Medusy");
      }
    }

    // Przetwórz nazwy kategorii ścieżki (breadcrumby z polskimi znakami)
    if (namesRes && namesRes.ok) {
      try {
        const namesJson = await namesRes.json();
        (namesJson.product_categories || []).forEach((c: any) => {
          if (c.handle && c.name) categoryNames[c.handle] = c.name;
        });
      } catch (e) {
        console.warn("Błąd parsowania nazw kategorii - fallback do slug");
      }
    }
  }
  // Bieżąca kategoria - nazwę już mamy z głównego zapytania (pewniejsze)
  if (currentHandle && dbCategoryData.name) categoryNames[currentHandle] = dbCategoryData.name;

  // 🔥 DYNAMICZNY H1 i tekst SEO - bez dublowania "Części do"
  const baseName = (dbCategoryData.name || currentHandle.replace(/-/g, ' ')).trim();

  // H1 w mianowniku (nazwa kategorii z bazy) - zawsze poprawnie gramatycznie, bez odmiany.
  // np. "Termostaty Case", "Wentylatory Ursus C-385", "Części do ciągników Ursus"
  if (brandName && modelName) {
    dbCategoryData.h1_dynamic = `${baseName} ${brandName} ${modelName}`.trim();
    dbCategoryData.top_seo_text = `Szukasz części do maszyny ${brandName} ${modelName}? W kategorii ${baseName.toLowerCase()} mamy szeroki wybór komponentów dopasowanych do tego modelu, zgodnych z OEM. Gwarancja dopasowania i szybka wysyłka.`;
  } else if (brandName) {
    dbCategoryData.h1_dynamic = `${baseName} ${brandName}`.trim();
    dbCategoryData.top_seo_text = `Części zamienne do maszyn ${brandName} w kategorii ${baseName.toLowerCase()}. Szeroki wybór komponentów zgodnych z OEM, gwarancja dopasowania i niezawodności. Szybka wysyłka i wsparcie techniczne.`;
  }

  const breadcrumbs: any[] = categorySegments.map((s: string, i: number) => ({
    name: (categoryNames[s] || s.replace(/-/g, ' ')).toUpperCase(),
    slug: s,
    path: categorySegments.slice(0, i + 1).join('/')
  }));
  if (brandName) {
    breadcrumbs.push({
      name: brandName.toUpperCase(),
      slug: brandSlug,
      path: [...categorySegments, brandSlug].join('/')
    });
  }
  if (modelName) {
    breadcrumbs.push({
      name: modelName.toUpperCase(),
      slug: modelSlug,
      path: [...categorySegments, brandSlug, modelSlug].join('/')
    });
  }

  const searchData = {
    category: dbCategoryData,
    breadcrumbs,
    subcategories: currentCategory?.category_children?.map((c: any) => c.name) || []
  };

  const index = meiliClient.index('products');

  const categoryFilterStr = allowedHandles.length > 0
    ? `category_handles IN [${allowedHandles.map(h => `"${h}"`).join(', ')}]`
    : '';

  const baseFilterParts: string[] = [];
  if (categoryFilterStr) baseFilterParts.push(categoryFilterStr);
  if (brandName) baseFilterParts.push(`"Pasuje do marki" = "${brandName.replace(/"/g, '\\"')}"`);
  if (modelName) baseFilterParts.push(`"Pasuje do modelu" = "${modelName.replace(/"/g, '\\"')}"`);
  const baseFilter = baseFilterParts.join(' AND ');

  let initialData: any = { filters: {}, narrowedFilters: {}, disjunctiveFacets: {}, products: [], totalCount: 0 };

  try {
    const filterArray: string[] = baseFilterParts.slice();
    const activeFilters: Record<string, string> = {};
    Object.entries({ ...resolvedSearchParams }).forEach(([k, v]) => {
      if (['fullPath', 'limit', 'sort', 'minPrice', 'maxPrice', 'q', 'page', 'view'].includes(k)) return;
      if (v) activeFilters[k] = v as string;
    });

    Object.entries(activeFilters).forEach(([key, val]) => {
      if (!val) return;
      const f = buildFilterValue(key, val as string);
      if (f) filterArray.push(f);
    });

    if (resolvedSearchParams.minPrice) filterArray.push(`price >= ${resolvedSearchParams.minPrice}`);
    if (resolvedSearchParams.maxPrice) filterArray.push(`price <= ${resolvedSearchParams.maxPrice}`);

    const sortParam = resolvedSearchParams.sort;
    let meiliSort = undefined;
    if (sortParam === 'price_asc') meiliSort = ['price:asc'];
    if (sortParam === 'price_desc') meiliSort = ['price:desc'];

    // 🔥 Pomocnik disjunctive: filtry z pominięciem jednego klucza (do osobnych facetów)
    const buildFiltersSkip = (skipKey?: string): string => {
      const arr: string[] = baseFilterParts.slice();
      Object.entries(activeFilters).forEach(([key, val]) => {
        if (skipKey && key === skipKey) return;
        const f = buildFilterValue(key, val as string);
        if (f) arr.push(f);
      });
      if (resolvedSearchParams.minPrice) arr.push(`price >= ${resolvedSearchParams.minPrice}`);
      if (resolvedSearchParams.maxPrice) arr.push(`price <= ${resolvedSearchParams.maxPrice}`);
      return arr.join(' AND ');
    };

    const activeKeys = Object.keys(activeFilters);
    const disjunctivePromises = activeKeys.map(key =>
      index.search(resolvedSearchParams.q || "", {
        limit: 0,
        filter: buildFiltersSkip(key) || undefined,
        facets: [key],
      })
    );

    // 🔁 Wybór filtrów dla kategorii — BEST EFFORT.
    // CAŁA ta sekcja jest opakowana tak, by jej awaria NIGDY nie wywaliła listingu produktów.
    let categoryFacets: string[] = FACET_FALLBACK;
    let baseDist: Record<string, any> = {};
    try {
      let baseFacetsResult: any;
      try {
        // Małe/średnie kategorie: pełny wachlarz pól ("*") — daje NAJLEPSZE filtry z realnych danych
        // (każda kategoria dostaje swoje pola, nie tylko z naszej puli). Meili to wytrzymuje.
        baseFacetsResult = await index.search(resolvedSearchParams.q || "", {
          limit: 0, filter: baseFilter || undefined, facets: ["*"],
        });
      } catch {
        // DUŻE kategorie: "*" wywala Meili (panic na polach-potworach) → bezpieczna lista kandydatów.
        baseFacetsResult = await index.search(resolvedSearchParams.q || "", {
          limit: 0, filter: baseFilter || undefined, facets: CANDIDATE_FACETS,
        });
      }
      baseDist = baseFacetsResult.facetDistribution || {};
      const ranked = rankCategoryFacets(baseDist);
      if (ranked.length) categoryFacets = ranked;
    } catch (e) {
      console.warn("Sonda filtrów nie powiodła się — pokażę filtry podstawowe:", e);
      // categoryFacets zostaje = FACET_FALLBACK; produkty i tak się załadują niżej
    }

    // Pola liczbowe wśród wybranych → zapytamy o ich zakresy (min/max) dla suwaków.
    const numericTwins = categoryFacets.filter(looksNumeric).map(f => NUM_TWIN + f);

    // 🔥 PEŁNA lista marek: tylko kategoria (BEZ marki/modelu) - żeby user mógł zmienić markę
    const categoryOnlyFilter = categoryFilterStr || undefined;
    // 🔥 Modele dla wybranej marki: kategoria + marka (BEZ modelu) - żeby user mógł zmienić model
    const brandOnlyParts: string[] = [];
    if (categoryFilterStr) brandOnlyParts.push(categoryFilterStr);
    if (brandName) brandOnlyParts.push(`"Pasuje do marki" = "${brandName.replace(/"/g, '\\"')}"`);
    const brandOnlyFilter = brandOnlyParts.join(' AND ') || undefined;

    // 🔁 KROK GŁÓWNY — produkty. Facety to mała, bezpieczna lista (≤14; w najgorszym razie marka/model/typ).
    const [searchResult, allBrandsResult, allModelsResult, rangeStatsResult, ...disjunctiveResults] = await Promise.all([
      index.search(resolvedSearchParams.q || "", {
        limit: resolvedSearchParams.limit ? parseInt(resolvedSearchParams.limit) : 48,
        filter: filterArray.join(' AND ') || undefined,
        sort: meiliSort,
        facets: categoryFacets
      }),
      // wszystkie marki w kategorii (bez zawężenia marką/modelem)
      index.search(resolvedSearchParams.q || "", { limit: 0, filter: categoryOnlyFilter, facets: ['Pasuje do marki'] }),
      // wszystkie modele dla wybranej marki (bez zawężenia modelem)
      brandName
        ? index.search(resolvedSearchParams.q || "", { limit: 0, filter: brandOnlyFilter, facets: ['Pasuje do modelu'] })
        : Promise.resolve({ facetDistribution: {} } as any),
      // zakresy (min/max) pól liczbowych w kategorii — pod suwaki (facetStats).
      // PARTIAMI po 8: jeśli któreś pole n_ nie jest filtrowalne, pada tylko jego partia, reszta suwaków działa.
      numericTwins.length
        ? (async () => {
            const chunks: string[][] = [];
            for (let i = 0; i < numericTwins.length; i += 8) chunks.push(numericTwins.slice(i, i + 8));
            const parts = await Promise.all(chunks.map(c =>
              index.search(resolvedSearchParams.q || "", { limit: 0, filter: categoryOnlyFilter, facets: c })
                .then((r: any) => r.facetStats || {})
                .catch(() => ({}))
            ));
            return { facetStats: Object.assign({}, ...parts) } as any;
          })()
        : Promise.resolve({ facetStats: {} } as any),
      ...disjunctivePromises,
    ]);

    // Zbuduj mapę disjunctive per aktywny filtr
    const disjunctiveFacets: Record<string, any> = {};
    activeKeys.forEach((key, i) => {
      const res: any = disjunctiveResults[i];
      if (res?.facetDistribution?.[key]) {
        disjunctiveFacets[key] = res.facetDistribution[key];
      }
    });

    // Rozkład bazowy do filtrów; gdy sonda padła, użyj rozkładu z głównego searcha (i tak są tam facety).
    const narrowDist = searchResult.facetDistribution || {};
    if (Object.keys(baseDist).length === 0) baseDist = narrowDist;
    const trimmedFilters: Record<string, any> = {};
    const trimmedNarrowed: Record<string, any> = {};
    categoryFacets.forEach((k) => {
      if (baseDist[k]) trimmedFilters[k] = baseDist[k];
      if (narrowDist[k]) trimmedNarrowed[k] = narrowDist[k];
    });

    initialData = {
      filters: trimmedFilters,
      narrowedFilters: trimmedNarrowed,
      facetOrder: categoryFacets,
      disjunctiveFacets,
      allBrands: allBrandsResult.facetDistribution?.['Pasuje do marki'] || {},
      allModels: allModelsResult.facetDistribution?.['Pasuje do modelu'] || {},
      facetStats: rangeStatsResult.facetStats || {},
      products: searchResult.hits.map((p: any) => ({
        id: p.id, sku: p.id, name: p.title, price: p.price || 0, slug: p.handle,
        category_text: p.Kategoria || p['Typ produktu'] || '', images: p.thumbnail ? [{ url: p.thumbnail }] : []
      })),
      totalCount: searchResult.estimatedTotalHits || 0
    };
  } catch (e) {
    console.error("Meilisearch server error:", e);
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", position: 1, name: "Start", item: SITE_URL },
      ...breadcrumbs.map((b, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: b.name,
        item: `${SITE_URL}/kategoria/${b.path}`
      }))
    ]
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">{/* pb na pasek nav jest już w Footer (pb-32) - bez podwójnego paddingu */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Header />
      <CategoryHeader
        initialData={searchData}
        searchParams={resolvedSearchParams}
        fullPath={fullPath}
        topSeoText={dbCategoryData.top_seo_text}
        brands={initialData.allBrands || initialData.filters?.['Pasuje do marki'] || {}}
        categoryPath={categorySegments.join('/')}
        showBrands={!brandName}
        brandSlug={brandSlug}
        modelSlug={modelSlug}
      />

      <CategoryWorkspace
        key={fullPath}
        initialData={initialData}
        fullPath={fullPath}
        currentHandle={currentHandle}
        allowedHandles={allowedHandles}
        categoryPath={categorySegments.join('/')}
        currentBrandSlug={brandSlug}
        currentBrandName={brandName}
        currentModelSlug={modelSlug}
        currentModelName={modelName}
      />

      {dbCategoryData.bottom_seo_text && <DynamicSeoSection text={dbCategoryData.bottom_seo_text} />}
      {dbCategoryData.faqs && dbCategoryData.faqs.length > 0 && <DynamicFaqSection faqs={dbCategoryData.faqs} />}
      <MobileBottomNav />
      <DynamicFooter />
    </div>
  );
}