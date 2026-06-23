'use client'; // 🚀 Kluczowa zmiana: pozwala nam czytać adres URL na żywo

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SubcategoryNav from './SubcategoryNav';

// 📚 Słownik głównych kategorii (aby zapewnić idealne polskie znaki dla L1 i L2)
const BREADCRUMB_DICTIONARY: Record<string, string> = {
  'czesci-do-ciagnikow': 'Części do ciągników',
  'czesci-do-maszyn': 'Części do maszyn',
  'hydraulika-silowa': 'Hydraulika siłowa',
  'warsztat-i-uniwersalne': 'Warsztat i Uniwersalne',
  'hodowla-i-zootechnika': 'Hodowla i Zootechnika',
  'zbior-zielonki': 'Zbiór zielonki',
  'uklad-chlodzenia': 'Układ chłodzenia',
  'uklad-paliwowy-i-wydechowy': 'Układ paliwowy i wydechowy',
  'siedzenia-i-fotele': 'Siedzenia i fotele',
  'silnik-i-osprzet': 'Silnik i osprzęt',
  'uprawa-ziemi': 'Uprawa ziemi'
};

const capitalizeWords = (str: string) => {
  if (!str) return '';
  return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

const parseMarkdown = (text: string) => {
  if (!text) return '';
  let html = text.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-4 mb-2 text-slate-900">$1</h2>');
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-red-600 hover:underline font-bold">$1</a>');
  html = html.replace(/\n\n/gim, '<br /><br />');
  return html;
};

export default function CategoryHeader({ initialData, searchParams, topSeoText }: { initialData: any, searchParams: any, fullPath?: string, topSeoText?: string }) {
  const pathname = usePathname(); // Pobieramy pełny adres, np. "/kategoria/czesci-do-ciagnikow/uklad-chlodzenia"
  const categoryData = initialData?.category || null;
  
  let subcategories = initialData?.subcategories;
  if (!subcategories || subcategories.length === 0) {
    subcategories = categoryData?.category_children || categoryData?.children || [];
  }
  
  // 🚀 ZMIANA: Tniemy URL prosto z przeglądarki, wyrzucając słowo "kategoria"
  const pathSegments = pathname.split('/').filter(p => p && p !== 'kategoria');
  
  const breadcrumbs = pathSegments.map((slugPart: string, index: number) => {
    // Budujemy link narastająco: kategoria1 -> kategoria1/kategoria2
    const cumulativePath = pathSegments.slice(0, index + 1).join('/');
    
    let prettyName = '';
    // Jeśli to ostatni okruszek (czyli kategoria, na której właśnie jesteśmy),
    // bierzemy jej idealną nazwę wprost z bazy danych Medusy.
    if (index === pathSegments.length - 1 && categoryData?.name) {
      prettyName = categoryData.name;
    } else {
      // Dla wcześniejszych kategorii używamy słownika lub kapitalizujemy
      prettyName = BREADCRUMB_DICTIONARY[slugPart.toLowerCase()] || slugPart
        .replace(/-/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    return {
      name: prettyName,
      path: cumulativePath
    };
  });

  const rawBrandLabel = searchParams?.['Pasuje do marki'];
  const rawModelLabel = searchParams?.['Pasuje do modelu'];
  const brandLabel = rawBrandLabel ? capitalizeWords(rawBrandLabel) : null;
  const modelLabel = rawModelLabel ? capitalizeWords(rawModelLabel) : null;
  
  let displayH1 = categoryData?.h1_dynamic;
  if (!displayH1 && breadcrumbs.length > 0) displayH1 = breadcrumbs[breadcrumbs.length - 1].name;
  if (!displayH1) displayH1 = "Kategoria";
  
  if (brandLabel) {
    if (!displayH1.toLowerCase().includes(brandLabel.toLowerCase())) {
      displayH1 += ` DO ${brandLabel.toUpperCase()}`;
      if (modelLabel) displayH1 += ` ${modelLabel.toUpperCase()}`;
    }
  }

  return (
    <div className="bg-white border-b pt-8 pb-6 px-6 relative z-20">
      <div className="max-w-7xl mx-auto">
        {breadcrumbs.length > 0 && (
          <nav className="flex text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 gap-2 items-center flex-wrap min-h-[32px]" aria-label="Breadcrumb">
            <Link href="/" prefetch={false} className="hover:text-red-600 transition-colors p-2 min-h-[32px] flex items-center">Start</Link>
            {breadcrumbs.map((crumb: any, idx: number) => (
              <React.Fragment key={idx}>
                <span className="text-slate-500">/</span>
                <Link href={`/kategoria/${crumb.path}`} prefetch={false} className="hover:text-red-600 transition-colors p-2 min-h-[32px] flex items-center">{crumb.name}</Link>
              </React.Fragment>
            ))}
          </nav>
        )}
        
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black uppercase text-slate-900 mb-2 max-w-4xl leading-tight">
          {displayH1}
        </h1>
        
        {topSeoText && (
          <div 
            className="text-sm md:text-base text-slate-600 max-w-4xl mb-6 mt-4 leading-relaxed prose prose-slate"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(topSeoText) }}
          />
        )}

        {subcategories && subcategories.length > 0 && (
          <SubcategoryNav subcategories={subcategories} fullPath={pathname.replace('/kategoria/', '')} />
        )}
      </div>
    </div>
  );
}