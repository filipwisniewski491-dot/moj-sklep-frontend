'use client';
import React, { useState } from 'react';
import Link from 'next/link';

const generateSlug = (text: string) => {
  if (!text) return '';
  return text.toLowerCase()
    .replace(/[ą]/g, 'a').replace(/[ć]/g, 'c').replace(/[ę]/g, 'e')
    .replace(/[ł]/g, 'l').replace(/[ń]/g, 'n').replace(/[ó]/g, 'o')
    .replace(/[ś]/g, 's').replace(/[źż]/g, 'z')
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};

// 🔥 categoryPath = ścieżka SAMEJ kategorii (bez marki/modelu), np. "czesci-do-ciagnikow"
// brandSlug/modelSlug = aktualna marka/model z URL (zachowywane przy zmianie podkategorii)
export default function SubcategoryNav({
  subcategories,
  fullPath,
  categoryPath = '',
  brandSlug = null,
  modelSlug = null,
}: {
  subcategories: any[],
  fullPath: string,
  categoryPath?: string,
  brandSlug?: string | null,
  modelSlug?: string | null,
}) {
  const [showAllSubcats, setShowAllSubcats] = useState(false);

  const displayList = showAllSubcats ? subcategories : subcategories.slice(0, 7);

  // Baza kategorii: jeśli mamy categoryPath użyj go, inaczej fallback do fullPath
  // (fullPath może zawierać markę/model, więc preferujemy czysty categoryPath)
  const categoryBase = categoryPath || fullPath;

  return (
    <div className="mb-4 border-t border-slate-100 pt-5">
      <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-600 mb-4">Wybierz podkategorię:</h2>
      <div className="flex flex-wrap gap-2 lg:gap-3">
        {displayList.map((sub: any, idx: number) => {
            const subName = typeof sub === 'string' ? sub : sub.name;
            const subSlug = typeof sub === 'string' ? generateSlug(sub) : (sub.handle || generateSlug(sub.name));

            // 🚀 BUDOWANIE ŚCIEŻKI z zachowaniem marki/modelu:
            // {kategoria}/{podkategoria}/{marka}/{model}
            // np. czesci-do-ciagnikow/uklad-chlodzenia/ursus/c-330
            const segments: string[] = [];
            if (categoryBase) segments.push(categoryBase);
            segments.push(subSlug);
            if (brandSlug) segments.push(brandSlug);
            if (brandSlug && modelSlug) segments.push(modelSlug);
            const targetPath = segments.join('/');

            return (
              <Link
                aria-label={`Przejdź do podkategorii ${subName}`}
                key={`${subSlug}-${idx}`}
                href={`/kategoria/${targetPath}`}
                prefetch={false}
                className="px-5 py-3.5 bg-white border border-slate-200 hover:border-slate-900 hover:bg-slate-900 hover:text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm min-h-[48px] flex items-center justify-center"
              >
                {subName}
              </Link>
            );
        })}
        {subcategories.length > 7 && (
          <button aria-label="Pokaż wszystkie podkategorie" onClick={() => setShowAllSubcats(!showAllSubcats)} className="px-5 py-3.5 bg-slate-50 border-2 border-slate-200 text-slate-700 hover:border-red-600 hover:text-red-600 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-1.5 min-h-[48px] justify-center">
            {showAllSubcats ? <><span>↑</span> Zwiń listę</> : <><span>+ {subcategories.length - 7}</span> więcej ▾</>}
          </button>
        )}
      </div>
    </div>
  );
}