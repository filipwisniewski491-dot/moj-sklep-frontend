'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { MEGA_MENU_DATA, MegaCategory } from './megaMenuData';

// Pełnoekranowe menu kategorii na mobile — wzorzec drill-down (poziom 0: filary,
// poziom 1: podkategorie filaru). Kontrolowane z zewnątrz przez open/onClose,
// żeby otwierał je przycisk „Działy" w dolnym pasku (MobileBottomNav).
export default function MobileCategoryMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  // Który filar jest „otwarty" (drill-down). null = lista filarów.
  const [active, setActive] = useState<MegaCategory | null>(null);

  // Blokada scrolla tła + reset drill-downu przy każdym otwarciu.
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      setActive(null);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Zamknięcie klawiszem Esc (i cofnięcie drill-downu, jeśli jesteśmy w filarze).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (active) setActive(null);
      else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, active, onClose]);

  // Klik w link kategorii = nawigacja + zamknięcie menu.
  const handleNavigate = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] lg:hidden flex flex-col bg-white animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Menu kategorii"
    >
      {/* NAGŁÓWEK — zmienia się w zależności od poziomu */}
      <div className="flex items-center gap-2 px-4 h-16 border-b border-slate-100 shrink-0">
        {active ? (
          <button
            type="button"
            onClick={() => setActive(null)}
            aria-label="Wstecz do listy kategorii"
            className="w-11 h-11 -ml-2 flex items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 active:scale-95 transition"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        ) : (
          <span className="w-2" />
        )}

        <h2 className="flex-1 text-[13px] font-black uppercase tracking-widest text-slate-900 truncate">
          {active ? (active.fullTitle || active.title) : 'Kategorie'}
        </h2>

        <button
          type="button"
          onClick={onClose}
          aria-label="Zamknij menu"
          className="w-11 h-11 -mr-2 flex items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 active:scale-95 transition"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
      </div>

      {/* TOR DWÓCH PANELI — przesuwa się w bok przy drill-down */}
      <div className="flex-1 overflow-hidden">
        <div
          className="flex h-full w-[200%] transition-transform duration-300 ease-out"
          style={{ transform: active ? 'translateX(-50%)' : 'translateX(0)' }}
        >
          {/* POZIOM 0: filary */}
          <nav className="w-1/2 h-full overflow-y-auto overscroll-contain px-4 py-4">
            <ul className="flex flex-col gap-2">
              {MEGA_MENU_DATA.map((cat) => (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => setActive(cat)}
                    className={
                      "w-full min-h-[56px] px-5 flex items-center justify-between gap-3 rounded-xl border text-left transition-all active:scale-[0.99] " +
                      (cat.featured
                        ? "border-red-100 bg-red-50 text-red-700 hover:border-red-200"
                        : "border-slate-200 bg-white text-slate-900 hover:border-slate-900")
                    }
                  >
                    <span className="text-[13px] font-black uppercase tracking-wide">{cat.fullTitle || cat.title}</span>
                    <svg className="w-5 h-5 opacity-50 shrink-0" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                </li>
              ))}
            </ul>

            {/* Skróty na dole listy filarów */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
              <Link href="/promocje" prefetch={false} onClick={handleNavigate}
                className="min-h-[52px] px-5 flex items-center gap-2 rounded-xl bg-slate-900 text-white text-[12px] font-black uppercase tracking-widest active:scale-[0.99] transition">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M9 14l6-6M9.5 9h.01M14.5 14h.01M6 3h12l3 6-9 12L3 9z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Promocje
              </Link>
              <Link href="/kategorie" prefetch={false} onClick={handleNavigate}
                className="min-h-[52px] px-5 flex items-center rounded-xl border border-slate-200 text-slate-800 text-[12px] font-black uppercase tracking-widest active:scale-[0.99] transition">
                Cały katalog &rarr;
              </Link>
            </div>
          </nav>

          {/* POZIOM 1: podkategorie aktywnego filaru */}
          <div className="w-1/2 h-full overflow-y-auto overscroll-contain px-4 py-4">
            {active && (
              <>
                {/* „Zobacz wszystko" — wejście w cały filar */}
                <Link
                  href={active.href}
                  prefetch={false}
                  onClick={handleNavigate}
                  className="mb-4 min-h-[56px] px-5 flex items-center justify-between rounded-xl bg-slate-900 text-white active:scale-[0.99] transition"
                >
                  <span className="text-[13px] font-black uppercase tracking-widest">Zobacz wszystko</span>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </Link>

                {active.columns.map((col, ci) => (
                  <div key={ci} className="mb-5">
                    {col.heading && (
                      <div className="mb-2 px-1 text-[11px] font-black uppercase tracking-widest text-slate-400">
                        {col.heading}
                      </div>
                    )}
                    <ul className="flex flex-col gap-2">
                      {col.links.map((lnk) => (
                        <li key={lnk.href}>
                          <Link
                            href={lnk.href}
                            prefetch={false}
                            onClick={handleNavigate}
                            className="min-h-[52px] px-5 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white text-slate-800 hover:border-slate-900 active:scale-[0.99] transition-all"
                          >
                            <span className="text-[13px] font-bold">{lnk.text}</span>
                            {lnk.badge ? (
                              <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-red-600">
                                {lnk.badge}
                              </span>
                            ) : (
                              <svg className="w-4 h-4 opacity-40 shrink-0" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}