'use client';

import React from 'react';
import Link from 'next/link';
import SearchBar from '@/components/SearchBar';

// Sekcja „bohatera" wyszukiwania na stronę główną.
// NIE buduje własnego silnika — opakowuje istniejący <SearchBar /> (debounce, /api/search,
// live-dropdown, router.push, animowany placeholder). Dodaje wokół to, co robią najlepsi
// sklepy rolnicze: mocny nagłówek pod frazę OEM/SKU + szybkie skróty (marki, VIN).

const POPULAR_BRANDS = [
  { name: 'Ursus', slug: 'ursus' },
  { name: 'Zetor', slug: 'zetor' },
  { name: 'John Deere', slug: 'john-deere' },
  { name: 'MTZ / Belarus', slug: 'mtz-belarus' },
  { name: 'Claas', slug: 'claas' },
  { name: 'New Holland', slug: 'new-holland' },
];

export default function HeroSearch() {
  return (
    <section className="relative bg-slate-900 rounded-[32px] md:rounded-[48px] overflow-hidden border border-slate-800 shadow-xl mb-8">
      {/* Poświata w tle */}
      <div className="absolute top-0 right-0 w-[520px] h-[520px] bg-red-600 rounded-full blur-[150px] opacity-20 -mr-24 -mt-24 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[360px] h-[360px] bg-emerald-500 rounded-full blur-[150px] opacity-10 -ml-16 -mb-16 pointer-events-none" />

      <div className="relative z-10 px-5 py-10 md:px-14 md:py-16 flex flex-col items-center text-center">
        <span className="bg-white/10 border border-white/20 text-white text-[10px] font-black px-4 py-1.5 rounded-full mb-6 uppercase tracking-widest backdrop-blur-sm">
          Sezon polowy 2026 · Wysyłka w 24h
        </span>

        <h1 className="text-white text-3xl md:text-5xl font-black uppercase tracking-tight leading-[1.05] mb-3 max-w-3xl">
          Znajdź część po numerze <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-600">OEM lub SKU</span>
        </h1>
        <p className="text-slate-400 text-sm md:text-base font-medium mb-8 max-w-xl leading-relaxed">
          Wpisz numer katalogowy ze starej części, kod SKU albo nazwę maszyny — dobierzemy pasujący zamiennik z gwarancją dopasowania.
        </p>

        {/* ⬇️ Twój sprawdzony silnik wyszukiwania. Szeroki, wyeksponowany. */}
        <div className="w-full max-w-2xl">
          <SearchBar />
        </div>

        {/* Szybkie skróty — popularne marki + wejście „po VIN/modelu" (wirtualny garaż) */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
          <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest mr-1 hidden sm:inline">
            Popularne:
          </span>
          {POPULAR_BRANDS.map((b) => (
            <Link
              key={b.slug}
              href={`/kategoria/czesci-do-ciagnikow/${b.slug}`}
              prefetch={false}
              className="px-3.5 py-2 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-slate-200 text-[11px] font-bold uppercase tracking-wide transition-colors"
            >
              {b.name}
            </Link>
          ))}
          <Link
            href="/kategorie"
            prefetch={false}
            className="px-3.5 py-2 rounded-full bg-red-600/90 hover:bg-red-600 text-white text-[11px] font-black uppercase tracking-wide transition-colors flex items-center gap-1.5"
          >
            <span>🔧</span> Dobierz po modelu maszyny
          </Link>
        </div>

        {/* Mikro-zaufanie pod skrótami */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-slate-400 text-[11px] font-bold">
          <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> Gwarancja dopasowania</span>
          <span className="flex items-center gap-1.5"><span className="text-emerald-400">🚚</span> Wysyłka w 24h</span>
          <span className="flex items-center gap-1.5"><span className="text-emerald-400">📞</span> Doradztwo: 25 788 89 00</span>
        </div>
      </div>
    </section>
  );
}