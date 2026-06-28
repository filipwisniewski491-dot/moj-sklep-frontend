'use client';

import React from 'react';
import Link from 'next/link';

// GŁÓWNA STRUKTURA DANYCH MEGA MENU
const MEGA_MENU_DATA = [
  { 
    name: "Części do ciągników", slug: "czesci-do-ciagnikow", icon: "🚜",
    columns: [
      { 
        title: "Silnik i osprzęt", slug: "silnik-i-osprzet", 
        links: [
          { name: "Układ chłodzenia", slug: "uklad-chlodzenia" },
          { name: "Układ paliwowy", slug: "uklad-paliwowy-i-wydechowy" },
          { name: "Rozruszniki i alternatory", slug: "rozruszniki-i-alternatory" },
          { name: "Filtry", slug: "filtry" }
        ] 
      },
      { 
        title: "Układ napędowy", slug: "uklad-napedowy", 
        links: [
          { name: "Sprzęgła", slug: "sprzegla" },
          { name: "Skrzynia biegów", slug: "skrzynia-biegow" },
          { name: "Wały i mosty", slug: "waly-i-mosty" },
          { name: "Układ hamulcowy", slug: "uklad-hamulcowy" }
        ] 
      },
      { 
        title: "Kabina i TUZ", slug: "kabina-i-tuz", 
        links: [
          { name: "Siedzenia i fotele", slug: "siedzenia-i-fotele" },
          { name: "TUZ i podnośnik", slug: "tuz-podnosnik-i-hydraulika-ciagnikowa" },
          { name: "Szyby i uszczelki", slug: "szyby-i-uszczelki" },
          { name: "Oświetlenie", slug: "oswietlenie" }
        ] 
      }
    ],
    promo: {
      tag: "Top Kategoria",
      title: "Sezon na przeglądy",
      desc: "Zadbaj o silnik przed żniwami. Najwyższej jakości filtry i oleje silnikowe od ręki.",
      linkText: "Sprawdź filtry",
      linkUrl: "/kategoria/czesci-do-ciagnikow/filtry"
    }
  },
  { 
    name: "Części do maszyn", slug: "czesci-do-maszyn", icon: "⚙️",
    columns: [
      { 
        title: "Uprawa ziemi", slug: "uprawa-ziemi", 
        links: [
          { name: "Pługi (Lemiesze, dłuta)", slug: "plugi" },
          { name: "Brony i kultywatory", slug: "brony-i-kultywatory" },
          { name: "Agregaty uprawowe", slug: "agregaty" },
          { name: "Wały uprawowe", slug: "waly" }
        ] 
      },
      { 
        title: "Zbiór i żniwa", slug: "zbior-i-zniwa", 
        links: [
          { name: "Zbiór zielonki", slug: "zbior-zielonki" },
          { name: "Zbiór zbóż (Kombajny)", slug: "zbior-zboz" },
          { name: "Prasy i owijarki", slug: "prasy-i-owijarki" },
          { name: "Kosiarki", slug: "kosiarki" }
        ] 
      },
      { 
        title: "Siew, sadzenie, ochrona", slug: "siew-sadzenie-ochrona", 
        links: [
          { name: "Siewniki", slug: "siewniki" },
          { name: "Sadarki", slug: "sadzarki" },
          { name: "Opryskiwacze", slug: "ochrona-roslin-i-nawozenie" },
          { name: "Rozsiewacze nawozów", slug: "rozsiewacze-nawozow" }
        ] 
      }
    ],
    promo: {
      tag: "Przygotuj maszynę",
      title: "Zbiór zielonki",
      desc: "Nożyki, bagnety, palce podbieracza. Części do maszyn Claas, Krone, Kuhn.",
      linkText: "Przygotuj się",
      linkUrl: "/kategoria/czesci-do-maszyn/zbior-zielonki"
    }
  },
  { 
    name: "Hydraulika siłowa", slug: "hydraulika-silowa", icon: "🗜️",
    columns: [
      { 
        title: "Sterowanie i pompy", slug: "sterowanie-i-pompy", 
        links: [
          { name: "Rozdzielacze hydrauliczne", slug: "rozdzielacze-i-zawory" },
          { name: "Pompy hydrauliczne", slug: "pompy-silniki-i-hydroakumulatory" },
          { name: "Silniki hydrauliczne", slug: "silniki" },
          { name: "Filtry hydrauliczne", slug: "filtry-hydrauliczne" }
        ] 
      },
      { 
        title: "Siłowniki i złącza", slug: "silowniki-i-zlacza", 
        links: [
          { name: "Siłowniki hydrauliczne", slug: "silowniki" },
          { name: "Szybkozłącza i złącza", slug: "szybkozlacza-i-zlacza-gwintowane" },
          { name: "Przewody i węże", slug: "przewody-weze-i-rury" },
          { name: "Uszczelnienia", slug: "uszczelnienia" }
        ] 
      }
    ],
    promo: {
      tag: "Ekspert radzi",
      title: "Rozdzielacze",
      desc: "Kompletne sekcje, zawory krzyżowe i joysticki. Niezawodne sterowanie dla Twojego ładowacza.",
      linkText: "Zobacz rozdzielacze",
      linkUrl: "/kategoria/hydraulika-silowa/rozdzielacze-i-zawory"
    }
  }, 
  { 
    name: "Warsztat", slug: "warsztat-i-uniwersalne", icon: "🔧",
    columns: [
       { 
         title: "Wyposażenie", slug: "wyposazenie-warsztatu", 
         links: [
           { name: "Narzędzia ręczne", slug: "narzedzia-reczne" },
           { name: "Elektronarzędzia", slug: "elektronarzedzia" },
           { name: "Łożyska i uszczelnienia", slug: "lozyska-uszczelnienia-i-o-ringi" },
           { name: "Elementy złączne", slug: "elementy-zlaczne-i-montazowe" }
         ] 
       },
       { 
         title: "Eksploatacja", slug: "eksploatacja", 
         links: [
           { name: "Oleje i smary", slug: "oleje-i-smary" },
           { name: "Chemia warsztatowa", slug: "chemia-warsztatowa" },
           { name: "Płyny eksploatacyjne", slug: "plyny-eksploatacyjne" },
           { name: "Odzież BHP", slug: "odziez-bhp" }
         ] 
       }
    ],
    promo: {
      tag: "Polecane dla mechanika",
      title: "Chemia i Oleje",
      desc: "Zabezpiecz maszynę na sezon. Zamów komplet smarów i płynów z szybką wysyłką.",
      linkText: "Zobacz cały dział",
      linkUrl: "/kategoria/warsztat-i-uniwersalne"
    }
  },
  { 
    name: "Hodowla", slug: "hodowla-i-zootechnika", icon: "🐄",
    columns: [
      { 
        title: "Wyposażenie budynków", slug: "wyposazenie-budynkow", 
        links: [
          { name: "Poidła i karmidła", slug: "poidla-karmidla-i-pasniki" },
          { name: "Ogrodzenia elektryczne", slug: "ogrodzenia-elektryczne-pastuchy" },
          { name: "Wygrodzenia", slug: "wygrodzenia" },
          { name: "Dojarki i akcesoria", slug: "dojarki-bankowe-i-akcesoria" }
        ] 
      },
      { 
        title: "Zwierzęta", slug: "zwierzeta", 
        links: [
          { name: "Artykuły dla bydła", slug: "artykuly-dla-bydla-i-cielat" },
          { name: "Artykuły dla trzody", slug: "artykuly-dla-trzody" },
          { name: "Drób i ptactwo", slug: "drob-i-ptactwo" },
          { name: "Psy i koty", slug: "zwierzeta-domowe-psy-koty-inne" }
        ] 
      }
    ],
    promo: {
      tag: "Bestseller",
      title: "Ogrodzenia elektryczne",
      desc: "Elektryzatory, taśmy, izolatory i słupki. Skompletuj bezpieczne pastwisko.",
      linkText: "Buduj ogrodzenie",
      linkUrl: "/kategoria/hodowla-i-zootechnika/ogrodzenia-elektryczne-pastuchy"
    }
  }
];

export default function MegaMenu() {
  return (
    <div className="hidden lg:block bg-white border-b border-slate-200 shadow-sm relative z-40">
      <div className="max-w-7xl mx-auto px-4 flex items-center relative"> 
        <Link href="/kategorie" prefetch={false} className="flex items-center gap-2 py-4 px-6 font-black text-white bg-slate-900 uppercase text-[11px] tracking-widest hover:bg-red-600 transition-colors shrink-0 z-20">
          <span>☰</span> Pełny Katalog 2026
        </Link>
        
        <ul className="flex flex-1 items-center justify-between px-4 divide-x divide-slate-100">
          {MEGA_MENU_DATA.map((cat) => (
            <li key={cat.slug} className="group text-center py-5 flex-1 static">
              {/* Główny link kategorii (L1) - prefetch, bo zawsze widoczny w pasku */}
              <Link href={`/kategoria/${cat.slug}`} prefetch={true} className="block font-black text-slate-800 hover:text-red-600 transition-all uppercase text-[10px] xl:text-[11px] tracking-widest whitespace-nowrap">
                <span className="mr-1.5 text-base align-middle grayscale group-hover:grayscale-0 transition-all">{cat.icon}</span> {cat.name}
              </Link>

              {cat.columns && cat.columns.length > 0 && (
                <div className="absolute left-0 right-0 top-full w-full bg-white border border-slate-100 shadow-[0_30px_60px_rgba(0,0,0,0.12)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 rounded-b-2xl p-8 z-50 text-left text-slate-900">
                  <div className="grid grid-cols-5 gap-8">
                    
                    {/* Renderowanie Kolumn z podkategoriami (L2 i L3) */}
                    <div className="col-span-4 grid grid-cols-3 gap-8">
                      {cat.columns.map(col => (
                        <div key={col.slug}>
                          <Link href={`/kategoria/${cat.slug}/${col.slug}`} prefetch={false} className="text-red-600 font-black uppercase tracking-widest text-xs border-b-2 border-red-100 pb-2 mb-4 block hover:text-slate-900 transition-colors">
                            {col.title}
                          </Link>
                          <ul className="space-y-2.5">
                            {col.links.map(link => (
                              <li key={link.slug}>
                                <Link href={`/kategoria/${cat.slug}/${col.slug}/${link.slug}`} prefetch={false} className="text-sm font-medium text-slate-600 hover:text-red-600 hover:translate-x-1 inline-block transition-all">
                                  {link.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>

                    {/* Dynamiczny baner promujący specyficzny dla danej głównej kategorii */}
                    <div className="col-span-1 bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col justify-between">
                       <div>
                          <span className="bg-red-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-md mb-4 inline-block shadow-sm">
                            {cat.promo.tag}
                          </span>
                          <h4 className="font-black uppercase text-lg text-slate-900 leading-tight mb-2">
                            {cat.promo.title}
                          </h4>
                          <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            {cat.promo.desc}
                          </p>
                       </div>
                       <Link href={cat.promo.linkUrl} prefetch={false} className="mt-4 text-[10px] font-black text-slate-900 uppercase tracking-widest hover:text-red-600 flex items-center gap-1 transition-colors">
                         {cat.promo.linkText} 
                         <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
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