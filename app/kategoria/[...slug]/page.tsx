import { Metadata } from 'next';
import { Suspense } from 'react';
import { preload } from 'react-dom'; // 🚀 OSTATECZNA BROŃ NA LCP
import Loading from './loading';
import CategoryClient from './CategoryClient';
import { getCategoryData } from '@/lib/api';

export const revalidate = 60;

// === GENEROWANIE METADANYCH SEO Z OBSŁUGĄ FASETOWANIA (LONG-TAIL) ===
export async function generateMetadata({ params, searchParams }: any): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const fullPath = resolvedParams?.slug ? resolvedParams.slug.join('/') : '';
  const currentSlug = resolvedParams?.slug ? resolvedParams.slug[resolvedParams.slug.length - 1] : 'Kategoria';
  
  const baseCategoryName = currentSlug.replace(/-/g, ' ').toUpperCase();
  const seoFriendlyParams = ['Pasuje do marki', 'Pasuje do modelu', 'page'];
  const allParamKeys = Object.keys(resolvedSearchParams || {}).filter(k => k !== 'fullPath');
  const hasNonSeoFilters = allParamKeys.some(key => !seoFriendlyParams.includes(key));

  const brand = resolvedSearchParams?.['Pasuje do marki'] || '';
  const model = resolvedSearchParams?.['Pasuje do modelu'] || '';
  const page = resolvedSearchParams?.page || '1';
  
  let dynamicTitle = baseCategoryName;
  if (brand) dynamicTitle += ` do ${brand.toUpperCase()}`;
  if (model) dynamicTitle += ` ${model.toUpperCase()}`;
  
  dynamicTitle += ` - Największy katalog części | CentrumRolnictwa.pl`;
  
  if (page !== '1') {
    dynamicTitle += ` (Strona ${page})`;
  }

  let robotsInstruction = 'index, follow';
  if (hasNonSeoFilters || page !== '1') {
    robotsInstruction = 'noindex, follow';
  }

  return {
    title: dynamicTitle.substring(0, 70),
    description: `Szukasz ${baseCategoryName.toLowerCase()} ${brand ? `do ${brand}` : ''}? Sprawdź w CentrumRolnictwa.pl. Szybka wysyłka, fachowe doradztwo i gwarancja dopasowania!`.substring(0, 160),
    robots: robotsInstruction,
    alternates: {
      canonical: `https://centrumrolnictwa.pl/kategoria/${fullPath}`
    }
  };
}

// === GŁÓWNY KOMPONENT STRONY KATEGORII (SERVER COMPONENT) ===
export default async function CategoryPage({ params, searchParams }: any) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const fullPath = resolvedParams?.slug ? resolvedParams.slug.join('/') : '';
  
  const { searchData, filtersData } = await getCategoryData(fullPath, resolvedSearchParams);

  // === 🔥 EKSTREMALNA OPTYMALIZACJA LCP 🔥 ===
  // Serwer samodzielnie zagląda do danych, znajduje pierwsze zdjęcie, które wyświetli się na mobile
  // i wstrzykuje instrukcję pobrania go poza główną kolejką (FetchPriority: High).
  const firstProduct = searchData?.products?.[0];
  if (firstProduct) {
    const imageUrl = firstProduct.external_images?.[0] || firstProduct.images?.[0]?.url || firstProduct.thumbnail || null;
    if (imageUrl && imageUrl.includes('b-cdn.net')) {
      const cleanSrc = imageUrl.split('?')[0];
      // Odwzorowujemy precyzyjnie parametry z bunnyLoader, aby przeglądarka pobrała dokładnie ten sam plik
      preload(`${cleanSrc}?width=640&format=webp`, { as: 'image', fetchPriority: 'high' });
    }
  }

  // Wstrzykiwanie Google JSON-LD dla FAQ wygenerowanego przez AI
  const faqs = searchData?.category?.faqs || [];
  const jsonLd = faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq: any) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      
      <Suspense fallback={<Loading />}>
        <CategoryClient 
          initialData={searchData} 
          initialFilters={filtersData} 
          fullPath={fullPath}
        />
      </Suspense>
    </>
  );
}