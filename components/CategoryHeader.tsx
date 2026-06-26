'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SubcategoryNav from './SubcategoryNav';
import PopularBrands from './PopularBrands';

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
  html = html.replace(/^# (.*$)/gim, '<h2 class="text-xl font-bold mt-4 mb-2 text-slate-900">$1</h2>');
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-red-600 hover:underline font-bold">$1</a>');
  html = html.replace(/\n\n/gim, '<br /><br />');
  return html;
};

export default function CategoryHeader({ initialData, searchParams, topSeoText, brands, categoryPath, showBrands, brandSlug = null, modelSlug = null }: { initialData: any, searchParams: any, fullPath?: string, topSeoText?: string, brands?: Record<string, number>, categoryPath?: string, showBrands?: boolean, brandSlug?: string | null, modelSlug?: string | null }) {
  const pathname = usePathname();
  const categoryData = initialData?.category || null;

  let subcategories = initialData?.subcategories;
  if (!subcategories || subcategories.length === 0) {
    subcategories = categoryData?.category_children || categoryData?.children || [];
  }

  // PRIORYTET: breadcrumby z page.tsx (kategorie + marka + model). Fallback: z URL.
  let breadcrumbs: any[] = [];
  if (Array.isArray(initialData?.breadcrumbs) && initialData.breadcrumbs.length > 0) {
    breadcrumbs = initialData.breadcrumbs.map((b: any) => ({ name: b.name, path: b.path }));
  } else {
    const pathSegments = pathname.split('/').filter(p => p && p !== 'kategoria');
    breadcrumbs = pathSegments.map((slugPart: string, index: number) => {
      const cumulativePath = pathSegments.slice(0, index + 1).join('/');
      let prettyName = '';
      if (index === pathSegments.length - 1 && categoryData?.name) {
        prettyName = categoryData.name;
      } else {
        prettyName = BREADCRUMB_DICTIONARY[slugPart.toLowerCase()] || slugPart
          .replace(/-/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
      return { name: prettyName, path: cumulativePath };
    });
  }

  // H1 wprost z page.tsx (h1_dynamic poprawny dla marka/model)
  let displayH1 = categoryData?.h1_dynamic;
  if (!displayH1 && breadcrumbs.length > 0) displayH1 = breadcrumbs[breadcrumbs.length - 1].name;
  if (!displayH1) displayH1 = "Kategoria";

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
          <SubcategoryNav
            subcategories={subcategories}
            fullPath={pathname.replace('/kategoria/', '')}
            categoryPath={categoryPath}
            brandSlug={brandSlug}
            modelSlug={modelSlug}
          />
        )}

        {/* Popularne marki - tuż pod podkategoriami, w tym samym bloku wyboru */}
        {showBrands && brands && categoryPath && (
          <PopularBrands brands={brands} categoryPath={categoryPath} />
        )}
      </div>
    </div>
  );
}