'use client';

import React from 'react';
import Link from 'next/link';

const generateSlug = (text: string) => {
  if (!text) return '';
  return text.toLowerCase()
    .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e')
    .replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o')
    .replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

const MEGA_MENU_DATA = [
  { 
    name: "Części do ciągników", slug: "czesci-do-ciagnikow", icon: "🚜",
    columns: [
      { title: "Silnik i osprzęt", slug: "silnik-i-osprzet", links: ["Węże", "Prowadnice", "Uszczelki", "Śruby i mocowania", "Zawory", "Tłoki"] },
      { title: "Układ napędowy", slug: "uklad-napedowy-i-sprzegla", links: ["Kołki", "Kosze", "Krzyżaki", "Mechanizmy różnicowe", "Tarcze sprzęgła"] },
      { title: "Układ paliwowy", slug: "uklad-paliwowy-i-wydechowy", links: ["Pompy wtryskowe", "Wtryskiwacze", "Tłumiki", "Filtry paliwa"] },
      { title: "Kabina i elektryka", slug: "kabina-i-oblachowanie", links: ["Lusterka", "Szyby", "Fotele", "Oświetlenie", "Rozruszniki"] }
    ]
  },
  { 
    name: "Części do maszyn", slug: "czesci-do-maszyn", icon: "⚙️",
    columns: [
      { title: "Uprawa ziemi", slug: "uprawa-ziemi", links: ["Lemiesze", "Dłuta", "Odkładnice", "Piętki"] },
      { title: "Zbiór i żniwa", slug: "zbior-i-zniwa", links: ["Bagnety", "Nożyki", "Paski klinowe", "Palce podbieracza"] }
    ]
  },
  { 
    name: "Hydraulika siłowa", slug: "hydraulika-silowa", icon: "🗜️",
    columns: [
      { title: "Elementy układu", slug: "elementy-ukladu", links: ["Pompy hydrauliczne", "Rozdzielacze", "Siłowniki", "Szybkozłącza"] }
    ]
  }, 
  { 
    name: "Warsztat i uniwersalne", slug: "warsztat-i-uniwersalne", icon: "🔧",
    columns: [
       { title: "Materiały i narzędzia", slug: "wyposazenie-warsztatu", links: ["Narzędzia ręczne", "Elektronarzędzia", "Odzież BHP"] },
       { title: "Chemia i smary", slug: "chemia-i-smary", links: ["Oleje silnikowe", "Smary", "Zmywacze", "Płyny chłodnicze"] }
    ]
  },
  { 
    name: "Hodowla i zootechnika", slug: "hodowla-i-zootechnika", icon: "🐄",
    columns: [
      { title: "Wyposażenie budynków", slug: "wyposazenie-budynkow", links: ["Poidła", "Koryta", "Wygrodzenia", "Mocowania"] },
      { title: "Dój i higiena", slug: "doj-i-higiena", links: ["Dojarki", "Filtry do mleka", "Płyny myjące", "Akcesoria udojowe"] },
      { title: "Elektryzatory (Pastuchy)", slug: "elektryzatory", links: ["Urządzenia", "Izolatory", "Taśmy i plecionki", "Baterie"] },
      { title: "Pielęgnacja zwierząt", slug: "pielegnacja-zwierzat", links: ["Korekcje racic", "Szczotki", "Maszynki do strzyżenia", "Preparaty"] }
    ]
  }
];

export default function MegaMenu() {
  return (
    <div className="hidden lg:block bg-white border-b border-slate-200 shadow-sm relative z-40">
      <div className="max-w-7xl mx-auto px-4 flex items-center relative"> 
        <Link href="/kategorie" className="flex items-center gap-2 py-4 px-6 font-black text-white bg-slate-900 uppercase text-[11px] tracking-widest hover:bg-red-600 transition-colors shrink-0 z-20">
          <span>☰</span> Pełny Katalog 2026
        </Link>
        
        <ul className="flex flex-1 items-center justify-between px-4 divide-x divide-slate-100">
          {MEGA_MENU_DATA.map((cat) => (
            <li key={cat.slug} className="group text-center py-5 flex-1">
              <Link href={`/kategoria/${cat.slug}`} className="block font-black text-slate-800 hover:text-red-600 transition-all uppercase text-[10px] xl:text-[11px] tracking-widest whitespace-nowrap">
                <span className="mr-1.5 text-base align-middle grayscale group-hover:grayscale-0 transition-all">{cat.icon}</span> {cat.name}
              </Link>

              {cat.columns && cat.columns.length > 0 && (
                <div className="absolute left-0 right-0 top-full w-full bg-white border border-slate-100 shadow-[0_30px_60px_rgba(0,0,0,0.12)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 rounded-b-2xl p-8 z-50 text-left text-slate-900">
                  <div className="grid grid-cols-4 gap-8">
                    {cat.columns.map(col => (
                      <div key={col.slug}>
                        <Link href={`/kategoria/${cat.slug}/${col.slug}`} className="text-red-600 font-black uppercase tracking-widest text-xs border-b-2 border-red-100 pb-2 mb-4 block hover:text-slate-900 transition-colors">
                          {col.title}
                        </Link>
                        <ul className="space-y-2.5">
                          {col.links.map(link => {
                            const linkSlug = generateSlug(link);
                            return (
                              <li key={linkSlug}>
                                <Link href={`/kategoria/${cat.slug}/${col.slug}/${linkSlug}`} className="text-sm font-medium text-slate-600 hover:text-red-600 hover:translate-x-1 inline-block transition-all">
                                  {link}
                                </Link>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    ))}
                    <div className="col-span-4 lg:col-span-1 lg:col-start-4 bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col justify-between">
                       <div>
                          <span className="bg-red-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-md mb-4 inline-block shadow-sm">Polecane dla mechanika</span>
                          <h4 className="font-black uppercase text-lg text-slate-900 leading-tight mb-2">Chemia i Oleje</h4>
                          <p className="text-xs text-slate-500 font-medium">Zabezpiecz maszynę na sezon. Zamów komplet smarów i płynów z szybką wysyłką.</p>
                       </div>
                       <Link href={`/kategoria/${cat.slug}`} className="mt-4 text-[10px] font-black text-slate-900 uppercase tracking-widest hover:text-red-600 flex items-center gap-1 transition-colors">
                         Zobacz cały dział <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
                       </Link>
                    </div>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}