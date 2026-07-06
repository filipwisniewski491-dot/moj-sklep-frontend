"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";

type MegaLink = { text: string; href: string; badge?: string };
type MegaColumn = { heading?: string; links: MegaLink[] };
type MegaCategory = { id: string; title: string; fullTitle?: string; href: string; featured?: boolean; columns: MegaColumn[] };

const P = "/kategoria/";

const MEGA_MENU_DATA: MegaCategory[] = [
  {
    id: "hodowla",
    title: "Hodowla", fullTitle: "Hodowla i udój",
    href: P + "hodowla-i-zootechnika",
    featured: true,
    columns: [
      {
        heading: "Sprzęt udojowy",
        links: [
          { text: "Instalacje udojowe i rurociągi", href: P + "hodowla-i-zootechnika/instalacje-udojowe-i-rurociagi", badge: "flagowe" },
          { text: "Dojarki bańkowe i akcesoria", href: P + "hodowla-i-zootechnika/dojarki-bankowe-i-akcesoria" },
        ],
      },
      {
        heading: "Bydło i produkcja",
        links: [
          { text: "Artykuły dla bydła i cieląt", href: P + "hodowla-i-zootechnika/artykuly-dla-bydla-i-cielat" },
          { text: "Poidła, karmidła i paśniki", href: P + "hodowla-i-zootechnika/poidla-karmidla-i-pasniki" },
          { text: "Higiena, pielęgnacja, zdrowie", href: P + "hodowla-i-zootechnika/higiena-pielegnacja-i-zdrowie" },
          { text: "Wyposażenie budynków inwentarskich", href: P + "hodowla-i-zootechnika/wyposazenie-budynkow-inwentarskich" },
        ],
      },
      {
        heading: "Zwierzęta i wyposażenie",
        links: [
          { text: "Konie i jeździectwo", href: P + "hodowla-i-zootechnika/artykuly-dla-koni-i-jezdziectwo" },
          { text: "Ogrodzenia elektryczne", href: P + "hodowla-i-zootechnika/ogrodzenia-elektryczne" },
        ],
      },
    ],
  },
  {
    id: "ciagniki",
    title: "Ciągniki", fullTitle: "Części do ciągników",
    href: P + "czesci-do-ciagnikow",
    columns: [
      {
        links: [
          { text: "Kabina, szyby, karoseria", href: P + "czesci-do-ciagnikow/kabina-szyby-karoseria-i-silowniki-gazowe" },
          { text: "Układ napędowy i sprzęgła", href: P + "czesci-do-ciagnikow/uklad-napedowy-i-sprzegla" },
          { text: "Silnik i osprzęt", href: P + "czesci-do-ciagnikow/silnik-i-osprzet" },
          { text: "TUZ i hydraulika ciągnikowa", href: P + "czesci-do-ciagnikow/tuz-podnosnik-i-hydraulika-ciagnikowa" },
        ],
      },
      {
        links: [
          { text: "Układ paliwowy i wydechowy", href: P + "czesci-do-ciagnikow/uklad-paliwowy-i-wydechowy" },
          { text: "Układ chłodzenia", href: P + "czesci-do-ciagnikow/uklad-chlodzenia" },
          { text: "Instalacja elektryczna", href: P + "czesci-do-ciagnikow/instalacja-elektryczna-i-rozruszniki" },
          { text: "Siedzenia i fotele", href: P + "czesci-do-ciagnikow/siedzenia-i-fotele" },
        ],
      },
      {
        links: [
          { text: "Oświetlenie i LED", href: P + "czesci-do-ciagnikow/oswietlenie-lampy-robocze-i-led" },
          { text: "Układ hamulcowy", href: P + "czesci-do-ciagnikow/uklad-hamulcowy" },
        ],
      },
    ],
  },
  {
    id: "maszyny",
    title: "Maszyny", fullTitle: "Części do maszyn",
    href: P + "czesci-do-maszyn",
    columns: [
      {
        links: [
          { text: "Uprawa ziemi", href: P + "czesci-do-maszyn/uprawa-ziemi" },
          { text: "Zbiór i żniwa", href: P + "czesci-do-maszyn/zbior-i-zniwa" },
          { text: "Zbiór zielonki", href: P + "czesci-do-maszyn/zbior-zielonki" },
          { text: "Maszyny komunalne i mulczery", href: P + "czesci-do-maszyn/maszyny-komunalne-i-mulczery" },
        ],
      },
      {
        links: [
          { text: "Ładowacze czołowe (TUR)", href: P + "czesci-do-maszyn/ladowacze-czolowe-tur-i-osprzet" },
          { text: "Siew i sadzenie", href: P + "czesci-do-maszyn/siew-i-sadzenie" },
          { text: "Wycinaki i ładowacze kiszonki", href: P + "czesci-do-maszyn/wycinaki-do-kiszonki-i-ladowacze" },
          { text: "Beczkowozy i rozrzutniki", href: P + "czesci-do-maszyn/beczkowozy-asenizacja-i-rozrzutniki" },
        ],
      },
      {
        links: [
          { text: "Ochrona roślin i nawożenie", href: P + "czesci-do-maszyn/ochrona-roslin-i-nawozenie" },
          { text: "Wozy paszowe", href: P + "czesci-do-maszyn/wozy-paszowe-i-technika-paszowa" },
        ],
      },
    ],
  },
  {
    id: "zaczepy",
    title: "Zaczepy i koła", fullTitle: "Zaczepy, koła i osprzęt",
    href: P + "czesci-do-ciagnikow-i-maszyn",
    columns: [
      {
        links: [
          { text: "Pneumatyka rolnicza i złącza", href: P + "czesci-do-ciagnikow-i-maszyn/pneumatyka-rolnicza-i-zlacza" },
          { text: "Zaczepy, dyszle, technika sprzęgu", href: P + "czesci-do-ciagnikow-i-maszyn/zaczepy-dyszle-i-technika-sprzegu" },
        ],
      },
      {
        links: [
          { text: "Oświetlenie ostrzegawcze i znakowanie", href: P + "czesci-do-ciagnikow-i-maszyn/oswietlenie-ostrzegawcze-i-znakowanie" },
        ],
      },
    ],
  },
  {
    id: "hydraulika",
    title: "Hydraulika", fullTitle: "Hydraulika siłowa",
    href: P + "hydraulika-silowa",
    columns: [
      {
        links: [
          { text: "Szybkozłącza i złącza gwintowane", href: P + "hydraulika-silowa/szybkozlacza-i-zlacza-gwintowane", badge: "bestseller" },
          { text: "Siłowniki hydrauliczne", href: P + "hydraulika-silowa/silowniki-hydrauliczne" },
        ],
      },
      {
        links: [
          { text: "Pompy, silniki, hydroakumulatory", href: P + "hydraulika-silowa/pompy-silniki-i-hydroakumulatory" },
          { text: "Rozdzielacze i zawory", href: P + "hydraulika-silowa/rozdzielacze-i-zawory" },
        ],
      },
      {
        links: [
          { text: "Akcesoria i filtry hydrauliczne", href: P + "hydraulika-silowa/akcesoria-i-filtry-hydrauliczne" },
          { text: "Przewody, węże i rury", href: P + "hydraulika-silowa/przewody-weze-i-rury" },
        ],
      },
    ],
  },
  {
    id: "uniwersalne",
    title: "Uniwersalne", fullTitle: "Części uniwersalne",
    href: P + "czesci-uniwersalne",
    columns: [
      {
        heading: "Elementy złączne",
        links: [
          { text: "Śruby i nakrętki", href: P + "czesci-uniwersalne/elementy-zlaczne-i-montazowe/sruby-i-nakretki" },
          { text: "Pierścienie", href: P + "czesci-uniwersalne/elementy-zlaczne-i-montazowe/pierscienie" },
          { text: "Uchwyty", href: P + "czesci-uniwersalne/elementy-zlaczne-i-montazowe/uchwyty" },
        ],
      },
      {
        heading: "Łożyska i uszczelnienia",
        links: [
          { text: "Talerze", href: P + "czesci-uniwersalne/lozyska-uszczelnienia-i-o-ringi/talerze" },
          { text: "Pierścienie uszczelniające", href: P + "czesci-uniwersalne/lozyska-uszczelnienia-i-o-ringi/pierscienie-uszczelniajace" },
        ],
      },
      {
        heading: "Pasy i łańcuchy",
        links: [
          { text: "Pasy klinowe", href: P + "czesci-uniwersalne/pasy-klinowe-i-lancuchy-napedowe/pasy-klinowe" },
          { text: "Łańcuchy", href: P + "czesci-uniwersalne/pasy-klinowe-i-lancuchy-napedowe/lancuchy" },
        ],
      },
    ],
  },
  {
    id: "wiecej",
    title: "Więcej", fullTitle: "Pozostałe kategorie",
    href: P + "warsztat-i-uniwersalne",
    columns: [
      {
        links: [
          { text: "Warsztat i narzędzia", href: P + "warsztat-i-uniwersalne" },
          { text: "Filtry", href: P + "filtry" },
        ],
      },
      {
        links: [
          { text: "Elektronika i GPS", href: P + "elektronika-i-precyzja" },
          { text: "Chemia i smary", href: P + "chemia-i-smary" },
        ],
      },
      {
        links: [
          { text: "Dom, ogród, las", href: P + "dom-ogrod-las" },
          { text: "Materiały eksploatacyjne", href: P + "materialy-eksploatacyjne" },
        ],
      },
    ],
  },
];

export default function MegaMenu() {
  const [openId, setOpenId] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Prefetch: gdy klient najedzie na filar, w tle pobieramy dane jego podkategorii,
  // zeby po kliknieciu strona wskoczyla natychmiast (z cache przegladarki).
  const prefetched = useRef<Set<string>>(new Set());

  const prefetchCategory = useCallback((cat: MegaCategory) => {
    const hrefs: string[] = [cat.href];
    for (const col of cat.columns) for (const l of col.links) hrefs.push(l.href);
    for (const href of hrefs) {
      const slug = href.replace("/kategoria/", "");
      if (!slug || prefetched.current.has(slug)) continue;
      prefetched.current.add(slug);
      // pobieramy tylko naglowek listy (limit=48) - to samo co pobierze strona kategorii
      fetch(`/api/search?fullPath=${encodeURIComponent(slug)}&limit=48`).catch(() => {});
    }
  }, []);

  const open = useCallback((id: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenId(id);
  }, []);

  const scheduleClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenId(null), 120);
  }, []);

  return (
    <nav
      className="relative hidden lg:block border-b border-slate-200 bg-white"
      aria-label="Menu kategorii"
      onMouseLeave={scheduleClose}
    >
      <ul className="mx-auto flex max-w-7xl items-stretch gap-0.5 px-4">
        {MEGA_MENU_DATA.map((cat) => {
          const isOpen = openId === cat.id;
          return (
            <li key={cat.id} className="static" onMouseEnter={() => { open(cat.id); prefetchCategory(cat); }}>
              <Link
                href={cat.href}
                className={
                  "flex items-center gap-1.5 px-3.5 py-4 text-[16px] font-semibold tracking-tight transition-colors " +
                  (cat.featured ? "text-red-700 hover:text-red-800" : "text-slate-800 hover:text-slate-950") +
                  (isOpen ? " text-slate-950" : "")
                }
                aria-expanded={isOpen}
              >
                {cat.title}
                <svg className="h-4 w-4 opacity-60" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M5.5 7.5L10 12l4.5-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>

              {isOpen && (
                <div
                  className="absolute left-0 right-0 top-full z-40 border-t border-slate-200 bg-white shadow-xl"
                  onMouseEnter={() => open(cat.id)}
                >
                  <div className="mx-auto max-w-7xl px-6 py-7">
                    <div className="mb-5 flex items-center justify-between">
                      <h3 className="text-[18px] font-bold text-slate-900">{cat.fullTitle || cat.title}</h3>
                      <Link href={cat.href} className="text-[14px] font-semibold text-red-600 hover:text-red-700">
                        Zobacz wszystko &rarr;
                      </Link>
                    </div>
                    <div className="grid grid-cols-3 gap-x-10 gap-y-7">
                      {cat.columns.map((col, ci) => (
                        <div key={ci}>
                          {col.heading && (
                            <div className="mb-3 text-[13px] font-bold uppercase tracking-wide text-slate-400">
                              {col.heading}
                            </div>
                          )}
                          <ul className="space-y-2.5">
                            {col.links.map((lnk) => (
                              <li key={lnk.href}>
                                <Link
                                  href={lnk.href}
                                  className="group flex items-center gap-2 text-[16px] font-medium text-slate-700 hover:text-red-600 transition-colors"
                                >
                                  <span>{lnk.text}</span>
                                  {lnk.badge && (
                                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-red-600">
                                      {lnk.badge}
                                    </span>
                                  )}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </li>
          );
        })}

        <li className="ml-auto flex items-center">
          <Link
            href="/promocje"
            className="flex items-center gap-1.5 px-4 py-4 text-[16px] font-bold text-red-600 hover:text-red-700 transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 14l6-6M9.5 9h.01M14.5 14h.01M6 3h12l3 6-9 12L3 9z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Promocje
          </Link>
          <Link
            href="/kategorie"
            className="flex items-center gap-1.5 border-l border-slate-200 px-4 py-4 text-[16px] font-semibold text-slate-800 hover:text-slate-950 transition-colors"
          >
            Cały katalog
          </Link>
        </li>
      </ul>
    </nav>
  );
}
