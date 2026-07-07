"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { MEGA_MENU_DATA, MegaCategory } from "./megaMenuData";

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
                prefetch={false}
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
                      <Link href={cat.href} prefetch={false} className="text-[14px] font-semibold text-red-600 hover:text-red-700">
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
                                  prefetch={false}
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