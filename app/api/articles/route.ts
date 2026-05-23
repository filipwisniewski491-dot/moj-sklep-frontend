import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const marka = searchParams.get('marka');

  // Dane testowe (Docelowo ze Strapi)
  const allArticles = [
    {
      id: 1,
      title: "Sezonowy przegląd opryskiwacza",
      excerpt: "Sprawny opryskiwacz to klucz do ochrony roślin. Sprawdź te 5 punktów...",
      category: "Poradniki",
      marka: "Wszystkie",
      slug: "przeglad-opryskiwacza",
      image: "https://images.unsplash.com/photo-1592982537447-6f2a6a0c7c18?w=800"
    },
    {
      id: 2,
      title: "Ustawienie rozrządu w Ursusie C-360",
      excerpt: "Kompletny poradnik krok po kroku jak ustawić rozrząd w popularnej sześćdziesiątce...",
      category: "Serwis",
      marka: "Ursus",
      slug: "rozrzad-ursus-c360",
      image: "https://images.unsplash.com/photo-1530268576341-949890a5996f?w=800"
    },
    {
      id: 3,
      title: "Wymiana filtrów w Zetorze Proxima",
      excerpt: "Dowiedz się jak samodzielnie wymienić filtry paliwa i oleju w Zetorze...",
      category: "Serwis",
      marka: "Zetor",
      slug: "filtry-zetor-proxima",
      image: "https://images.unsplash.com/photo-1589923188900-85dae523342b?w=800"
    }
  ];

  // Filtrowanie: Pokaż artykuły dla konkretnej marki + ogólne
  const filtered = marka 
    ? allArticles.filter(a => a.marka === marka || a.marka === "Wszystkie")
    : allArticles;

  return NextResponse.json({ data: filtered });
}