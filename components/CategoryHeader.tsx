import React from 'react';
import Link from 'next/link';
import SubcategoryNav from './SubcategoryNav';

const capitalizeWords = (str: string) => {
  if (!str) return '';
  return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

export default function CategoryHeader({ initialData, searchParams, fullPath }: { initialData: any, searchParams: any, fullPath: string }) {
  const categoryData = initialData?.category || null;
  const breadcrumbs = initialData?.breadcrumbs || [];
  
  // 🚀 ZMIANA 1: Pobieranie dzieci dla kategorii na głębokich poziomach (L2, L3, L4)
  let subcategories = initialData?.subcategories || [];
  if (subcategories.length === 0 && categoryData?.category_children?.length > 0) {
    subcategories = categoryData.category_children;
  }

  const rawBrandLabel = searchParams?.['Pasuje do marki'];
  const rawModelLabel = searchParams?.['Pasuje do modelu'];
  const brandLabel = rawBrandLabel ? capitalizeWords(rawBrandLabel) : null;
  const modelLabel = rawModelLabel ? capitalizeWords(rawModelLabel) : null;
  
  let displayH1 = categoryData?.h1_dynamic;
  if (!displayH1 && breadcrumbs.length > 0) displayH1 = breadcrumbs[breadcrumbs.length - 1].name;
  if (!displayH1) displayH1 = "Kategoria";
  
  // 🚀 ZMIANA 2: Gwarantowane wyciąganie tekstu z metadata, gdzie Medusa trzyma Custom Fields
  let displayTopSeo = categoryData?.top_seo_text || categoryData?.metadata?.top_seo_text || categoryData?.description || "";

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
        
        {/* Renderowanie tekstu SEO (jeśli został znaleziony w Medusie) */}
        {displayTopSeo && (
          <div 
            className="text-sm text-slate-600 max-w-3xl mb-6 leading-relaxed font-medium prose prose-slate"
            dangerouslySetInnerHTML={{ __html: displayTopSeo }}
          />
        )}

        {subcategories.length > 0 && (
          <SubcategoryNav subcategories={subcategories} fullPath={fullPath} />
        )}
      </div>
    </div>
  );
}