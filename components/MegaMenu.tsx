"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";

type MegaLink = {
  text: string;
  href: string;
  badge?: string;
};

type MegaColumn = {
  heading?: string;
  links: MegaLink[];
};

type MegaCategory = {
  id: string;
  title: string;
  href: string;
  featured?: boolean;
  columns: MegaColumn[];
};

const P = "/kategoria/";

const MEGA_MENU_DATA: MegaCategory[] = [
  {
    id: "hodowla",
    title: "Hodowla i udój",
    href: P + "hodowla-i-zootechnika",
    featured: true,
    columns: [
      {
        heading: "Sprzęt udojowy",
        links: [
          { text: "Instalacje udojowe i rurociągi", href: P + "instalacje-udojowe-i-rurociagi", badge: "flagowe" },
          { text: "Dojarki bańkowe i akcesoria", href: P + "dojarki-bankowe-i-akcesoria" },
        ],
      },
      {
        heading: "Bydło i produkcja",
        links: [
          { text: "Artykuły dla bydła i cieląt", href: P + "artykuly-dla-bydla-i-cielat" },
          { text: "Poidła, karmidła i paśniki", href: P + "poidla-karmidla-i-pasniki" },
          { text: "Higiena, pielęgnacja, zdrowie", href: P + "higiena-pielegnacja-i-zdrowie" },
          { text: "Wyposażenie budynków inwentarskich", href: P + "wyposazenie-budynkow-inwentarskich" },
        ],
      },
      {
        heading: "Zwierzęta i wyposażenie",
        links: [
          { text: "Konie i jeździectwo", href: P + "artykuly-dla-koni-i-jezdziectwo" },
          { text: "Ogrodzenia elektryczne", href: P + "ogrodzenia-elektryczne" },
        ],
      },
    ],
  },
  {
    id: "ciagniki",
    title: "Części do ciągników",
    href: P + "czesci-do-ciagnikow",
    columns: [
      {
        links: [
          { text: "Kabina, szyby, karoseria", href: P + "kabina-szyby-karoseria-i-silowniki-gazowe" },
          { text: "Układ napędowy i sprzęgła", href: P + "uklad-napedowy-i-sprzegla" },
          { text: "Silnik i osprzęt", href: P + "silnik-i-osprzet" },
          { text: "TUZ i hydraulika ciągnikowa", href: P + "tuz-podnosnik-i-hydraulika-ciagnikowa" },
        ],
      },
      {
        links: [
          { text: "Układ paliwowy i wydechowy", href: P + "uklad-paliwowy-i-wydechowy" },
          { text: "Układ chłodzenia", href: P + "uklad-chlodzenia" },
          { text: "Instalacja elektryczna", href: P + "instalacja-elektryczna-i-rozruszniki" },
          { text: "Siedzenia i fotele", href: P + "siedzenia-i-fotele" },
        ],
      },
      {
        links: [
          { text: "Układ kierowniczy i oś", href: P + "uklad-kierowniczy-i-os-przednia" },
          { text: "Oświetlenie i LED", href: P + "oswietlenie-lampy-robocze-i-led" },
          { text: "Układ hamulcowy", href: P + "uklad-hamulcowy" },
        ],
      },
    ],
  },
  {
    id: "maszyny",
    title: "Części do maszyn",
    href: P + "czesci-do-maszyn",
    columns: [
      {
        links: [
          { text: "Uprawa ziemi", href: P + "uprawa-ziemi" },
          { text: "Zbiór i żniwa", href: P + "zbior-i-zniwa" },
          { text: "Zbiór zielonki", href: P + "zbior-zielonki" },
          { text: "Maszyny komunalne i mulczery", href: P + "maszyny-komunalne-i-mulczery" },
        ],
      },
      {
        links: [
          { text: "Ładowacze czołowe (TUR)", href: P + "ladowacze-czolowe-tur-i-osprzet" },
          { text: "Siew i sadzenie", href: P + "siew-i-sadzenie" },
          { text: "Wycinaki i ładowacze kiszonki", href: P + "wycinaki-do-kiszonki-i-ladowacze" },
          { text: "Beczkowozy i rozrzutniki", href: P + "beczkowozy-asenizacja-i-rozrzutniki" },
        ],
      },
      {
        links: [
          { text: "Ochrona roślin i nawożenie", href: P + "ochrona-roslin-i-nawozenie" },
          { text: "Wozy paszowe", href: P + "wozy-paszowe-i-technika-paszowa" },
        ],
      },
    ],
  },
  {
    id: "zaczepy",
    title: "Zaczepy, koła i osprzęt",
    href: P + "czesci-do-ciagnikow-i-maszyn",
    columns: [
      {
        links: [
          { text: "Pneumatyka rolnicza i złącza", href: P + "pneumatyka-rolnicza-i-zlacza" },
          { text: "Zaczepy, dyszle, technika sprzęgu", href: P + "zaczepy-dyszle-i-technika-sprzegu" },
        ],
      },
      {
        links: [
          { text: "Oświetlenie ostrzegawcze i znakowanie", href: P + "oswietlenie-ostrzegawcze-i-znakowanie" },
        ],
      },
    ],
  },
  {
    id: "hydraulika",
    title: "Hydraulika siłowa",
    href: P + "hydraulika-silowa",
    columns: [
      {
        links: [
          { text: "Szybkozłącza i złącza gwintowane", href: P + "szybkozlacza-i-zlacza-gwintowane", badge: "bestseller" },
          { text: "Siłowniki hydrauliczne", href: P + "silowniki-hydrauliczne" },
        ],
      },
      {
        links: [
          { text: "Pompy, silniki, hydroakumulatory", href: P + "pompy-silniki-i-hydroakumulatory" },
          { text: "Rozdzielacze i zawory", href: P + "rozdzielacze-i-zawory" },
        ],
      },
      {
        links: [
          { text: "Akcesoria i filtry hydrauliczne", href: P + "akcesoria-i-filtry-hydrauliczne" },
          { text: "Przewody, węże i rury", href: P + "przewody-weze-i-rury" },
        ],
      },
    ],
  },
  {
    id: "uniwersalne",
    title: "Części uniwersalne",
    href: P + "czesci-uniwersalne",
    columns: [
      {
        heading: "Elementy złączne",
        links: [
          { text: "Śruby i nakrętki", href: P + "sruby-i-nakretki" },
          { text: "Pierścienie", href: P + "pierscienie" },
          { text: "Uchwyty", href: P + "uchwyty" },
        ],
      },
      {
        heading: "Łożyska i uszczelnienia",
        links: [
          { text: "Talerze", href: P + "talerze" },
          { text: "Pierścienie uszczelniające", href: P + "pierscienie-uszczelniajace" },
        ],
      },
      {
        heading: "Pasy i łańcuchy",
        links: [
          { text: "Pasy klinowe", href: P + "pasy-klinowe" },
          { text: "Łańcuchy", href: P + "lancuchy" },
        ],
      },
    ],
  },
];

const MORE_LINKS: MegaLink[] = [
  { text: "Warsztat i narzędzia", href: P + "warsztat-i-uniwersalne" },
  { text: "Filtry", href: P + "filtry" },
  { text: "Elektronika i GPS", href: P + "elektronika-i-precyzja" },
  { text: "Chemia i smary", href: P + "chemia-i-smary" },
  { text: "Dom, ogród, las", href: P + "dom-ogrod-las" },
  { text: "Materiały eksploatacyjne", href: P + "materialy-eksploatacyjne" },
];

export default function MegaMenu() {
  const [openId, setOpenId] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      <ul className="mx-auto flex max-w-7xl items-stretch gap-1 px-4">
        {MEGA_MENU_DATA.map((cat) => {
          const isOpen = openId === cat.id;
          return (
            <li key={cat.id} className="static" onMouseEnter={() => open(cat.id)}>
              <Link
                href={cat.href}
                className={
                  "flex items-center gap-1.5 px-4 py-3.5 text-[13px] font-semibold tracking-tight transition-colors " +
                  (cat.featured ? "text-red-700 hover:text-red-800" : "text-slate-700 hover:text-slate-900") +
                  (isOpen ? " text-slate-900" : "")
                }
                aria-expanded={isOpen}
              >
                {cat.title}
                <svg className="h-3.5 w-3.5 opacity-60" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M5.5 7.5L10 12l4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>

              {isOpen && (
                <div
                  className="absolute left-0 right-0 top-full z-40 border-t border-slate-200 bg-white shadow-xl"
                  onMouseEnter={() => open(cat.id)}
                >
                  <div className="mx-auto max-w-7xl px-6 py-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-[15px] font-bold text-slate-900">{cat.title}</h3>
                      <Link href={cat.href} className="text-[12px] font-semibold text-red-600 hover:text-red-700">
                        Zobacz wszystko &rarr;
                      </Link>
                    </div>
                    <div className="grid grid-cols-3 gap-x-8 gap-y-6">
                      {cat.columns.map((col, ci) => (
                        <div key={ci}>
                          {col.heading && (
                            <div className="mb-2.5 text-[12px] font-bold uppercase tracking-wide text-slate-400">
                              {col.heading}
                            </div>
                          )}
                          <ul className="space-y-1.5">
                            {col.links.map((lnk) => (
                              <li key={lnk.href}>
                                <Link
                                  href={lnk.href}
                                  className="group flex items-center gap-2 text-[13.5px] text-slate-600 hover:text-red-600 transition-colors"
                                >
                                  <span>{lnk.text}</span>
                                  {lnk.badge && (
                                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-600">
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

        <li className="static" onMouseEnter={() => open("more")}>
          <button
            type="button"
            className={
              "flex items-center gap-1.5 px-4 py-3.5 text-[13px] font-semibold tracking-tight text-slate-700 hover:text-slate-900 " +
              (openId === "more" ? "text-slate-900" : "")
            }
            aria-expanded={openId === "more"}
          >
            Więcej
            <svg className="h-3.5 w-3.5 opacity-60" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M5.5 7.5L10 12l4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {openId === "more" && (
            <div
              className="absolute right-4 top-full z-40 min-w-[240px] rounded-b-xl border border-slate-200 bg-white p-3 shadow-xl"
              onMouseEnter={() => open("more")}
            >
              <ul className="space-y-1">
                {MORE_LINKS.map((lnk) => (
                  <li key={lnk.href}>
                    <Link
                      href={lnk.href}
                      className="block rounded-lg px-3 py-2 text-[13.5px] text-slate-600 hover:bg-slate-50 hover:text-red-600 transition-colors"
                    >
                      {lnk.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      </ul>
    </nav>
  );
}