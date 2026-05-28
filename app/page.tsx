import HomeClient from '@/components/HomeClient';

// 🚀 ISR: Vercel "piecze" stronę i serwuje ją z krawędzi (Edge Cache) w 50ms
export const revalidate = 86400; 

// Funkcja budująca drzewo kategorii (jeśli API Strapi nie jest idealnie zagnieżdżone, używamy bezpiecznego hybrydowego fallbacku opartego o Twoje dane)
async function getStoreData() {
  const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://178.105.201.145:1337";
  const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;
  
  // BEZPIECZNA DEKLARACJA NAGŁÓWKÓW DLA TYPESCRIPT
  const reqHeaders: Record<string, string> = {};
  if (STRAPI_TOKEN) {
    reqHeaders['Authorization'] = `Bearer ${STRAPI_TOKEN}`;
  }

  // 1. Pobieranie Bestsellerów
  let bestsellers = [];
  try {
    const res = await fetch(`${STRAPI_URL}/api/products?pagination[pageSize]=4&populate=*`, {
      headers: reqHeaders, 
      next: { revalidate: 86400 }
    });
    const json = await res.json();
    if (json.data) {
      bestsellers = json.data.map((p: any) => ({
        id: p.documentId || p.id,
        sku: p.sku,
        slug: p.slug,
        name: p.seo_title || p.name,
        price: p.price || 0,
        images: p.images || [],
        external_images: p.external_images || []
      }));
    }
  } catch (e) { console.error("Błąd Bestsellerów", e); }

  // 2. Pobieranie Artykułów z bazy do sekcji wiedzy na serwerze (SEO Boost!)
  let articles = [];
  try {
    const res = await fetch(`${STRAPI_URL}/api/articles?pagination[pageSize]=3&populate=*`, {
      headers: reqHeaders, 
      next: { revalidate: 86400 }
    });
    const json = await res.json();
    if (json.data) articles = json.data;
  } catch (e) { console.error("Błąd Artykułów", e); }

  // 3. Zbudowane perfekcyjne drzewo MegaMenu na podstawie Twoich danych 
  // (Bezpieczniej wysłać to z serwera, niż polegać na płaskiej strukturze ze Strapi)
  const megaMenuTree = [
    { 
      name: "Części do ciągników", slug: "czesci-do-ciagnikow", icon: "🚜",
      columns: [
        { title: "Silnik i osprzęt", slug: "silnik-i-osprzet", links: ["Węże", "Prowadnice", "Uszczelki", "Śruby i mocowania", "Zawory", "Tłoki"] },
        { title: "Układ napędowy", slug: "uklad-napedowy-i-sprzegla", links: ["Kołki", "Kosze", "Krzyżaki", "Mechanizmy różnicowe", "Tarcze sprzęgła"] },
        { title: "Układ paliwowy", slug: "uklad-paliwowy-i-wydechowy", links: ["Pompy wtryskowe", "Wtryskiwacze", "Tłumiki"] },
        { title: "Kabina i oblachowanie", slug: "kabina-i-oblachowanie", links: ["Lusterka", "Szyby", "Fotele", "Oświetlenie", "Rozruszniki"] }
      ]
    },
    {
      name: "Części do maszyn", slug: "czesci-do-maszyn", icon: "🌾",
      columns: [
        { title: "Uprawa ziemi", slug: "uprawa-ziemi", links: ["Lemiesze", "Dłuta", "Odkładnice", "Piętki"] },
        { title: "Zbiór i żniwa", slug: "zbior-i-zniwa", links: ["Bagnety", "Nożyki", "Paski klinowe", "Palce podbieracza"] }
      ]
    },
    {
      name: "Hydraulika", slug: "hydraulika", icon: "🛢️",
      columns: [
        { title: "Układ siłowy", slug: "elementy-ukladu", links: ["Siłowniki", "Pompy hydrauliczne", "Rozdzielacze", "Przewody"] }
      ]
    }
  ];

  return { bestsellers, articles, megaMenuTree };
}

export default async function HomePage() {
  // Pobieramy wszystko naraz na serwerze!
  const { bestsellers, articles, megaMenuTree } = await getStoreData();

  return (
    <main className="flex flex-col w-full bg-white">
      <HomeClient 
        bestsellers={bestsellers} 
        articles={articles} 
        megaMenuTree={megaMenuTree} 
      />
    </main>
  );
}