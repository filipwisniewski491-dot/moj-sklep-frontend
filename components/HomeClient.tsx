'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import SearchBar from '@/components/SearchBar';
import VehicleGarage from '@/components/VehicleGarage';
import KnowledgeSection from '@/components/KnowledgeSection';

// Pomocnicza funkcja do linków
const generateSlug = (text: string) => {
  return text.toLowerCase()
    .replace(/[ą]/g, 'a').replace(/[ć]/g, 'c').replace(/[ę]/g, 'e')
    .replace(/[ł]/g, 'l').replace(/[ń]/g, 'n').replace(/[ó]/g, 'o')
    .replace(/[ś]/g, 's').replace(/[źż]/g, 'z')
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
};

export default function HomeClient({ bestsellers, articles, megaMenuTree }: any) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  return (
    <div className="w-full flex flex-col min-h-screen">
      
      {/* --- 1. SUPER NOWOCZESNY HEADER & MEGA MENU --- */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-slate-100 transition-all">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="text-2xl font-black tracking-tighter text-slate-900 flex items-center gap-2">
            <span className="text-red-600 text-3xl">🚜</span> CR.pl
          </Link>
          
          <nav className="hidden lg:flex items-center gap-8 h-full">
            {megaMenuTree.map((cat: any) => (
              <div 
                key={cat.slug}
                className="h-full flex items-center group"
                onMouseEnter={() => setActiveMenu(cat.slug)}
                onMouseLeave={() => setActiveMenu(null)}
              >
                <Link 
                  href={`/kategoria/${cat.slug}`} 
                  className="text-sm font-black uppercase tracking-widest text-slate-700 group-hover:text-red-600 transition-colors flex items-center gap-1"
                >
                  {cat.name} <span className="text-[10px]">▼</span>
                </Link>

                {/* Dropdown Mega Menu */}
                {activeMenu === cat.slug && (
                  <div className="absolute top-20 left-0 w-full bg-white border-b border-slate-100 shadow-2xl shadow-slate-900/10 animate-in slide-in-from-top-2 duration-200">
                    <div className="max-w-[1400px] mx-auto p-10 grid grid-cols-4 gap-12">
                      {cat.columns.map((col: any) => (
                        <div key={col.slug} className="flex flex-col">
                          <Link href={`/kategoria/${cat.slug}/${col.slug}`} className="text-slate-900 font-black mb-4 uppercase text-sm tracking-widest hover:text-red-600 border-b-2 border-slate-100 pb-2 inline-block">
                            {col.title}
                          </Link>
                          <ul className="space-y-3">
                            {col.links.map((link: string) => (
                              <li key={link}>
                                <Link 
                                  href={`/kategoria/${cat.slug}/${col.slug}/${generateSlug(link)}`} 
                                  className="text-sm font-medium text-slate-500 hover:text-red-600 hover:pl-2 transition-all flex items-center"
                                >
                                  {link}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                      {/* Puste pole na reklamę w mega menu */}
                      <div className="bg-slate-50 rounded-2xl p-6 flex flex-col justify-end border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Polecane w tej kategorii</span>
                        <span className="text-xl font-black text-slate-900 leading-tight">Sprawdź nowości od {cat.name.includes('ciąg') ? 'John Deere' : 'Granit'} ➔</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/konto" className="text-sm font-bold text-slate-700 hover:text-red-600 hidden md:block">Logowanie</Link>
            <button className="bg-slate-900 text-white w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-red-600 transition-all shadow-lg hover:scale-105">
              🛒
            </button>
          </div>
        </div>
      </header>

      {/* --- 2. HERO SECTION (Wyszukiwarka + Garaż) --- */}
      <section className="relative w-full bg-slate-950 px-6 py-20 lg:py-32 overflow-hidden">
        {/* Tło - subtelny gradient technologiczny */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-red-950/20 z-0"></div>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-red-600/5 blur-[120px] rounded-full z-0"></div>

        <div className="max-w-[1200px] mx-auto relative z-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 bg-red-600/10 border border-red-600/20 text-red-500 font-bold px-4 py-2 rounded-full text-xs uppercase tracking-widest mb-8">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span> Baza 250,000+ części
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[1.1] mb-6">
            Twój park maszynowy<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-600 italic">nie może stać w miejscu.</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mb-12">
            Znajdź każdą śrubę, filtr i tłok w 3 sekundy. Wybierz maszynę z garażu lub skorzystaj z inteligentnej wyszukiwarki.
          </p>

          <div className="w-full max-w-4xl bg-white/5 backdrop-blur-xl border border-white/10 p-2 md:p-4 rounded-[32px] grid grid-cols-1 lg:grid-cols-2 gap-4 shadow-2xl">
            <div className="bg-white rounded-[24px] shadow-inner p-2 h-full flex items-center">
               <div className="w-full relative z-[60]"> {/* Z-index dla dropdownu szukajki */}
                 <SearchBar />
               </div>
            </div>
            <div className="bg-white rounded-[24px] shadow-inner p-4">
              <VehicleGarage />
            </div>
          </div>
        </div>
      </section>

      {/* --- 3. TRUST BADGES (Dowód społeczny) --- */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-[1400px] mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-4 divide-x divide-slate-100">
          {[
            { t: "Wysyłka w 24H", s: "Zamów do 14:00" },
            { t: "Gwarancja Dopasowania", s: "Weryfikacja po VIN/OEM" },
            { t: "30 Dni na Zwrot", s: "Bez zbędnych pytań" },
            { t: "Eksperckie Doradztwo", s: "Mechanicy na infolinii" }
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center justify-center text-center px-4">
              <span className="text-sm font-black text-slate-900 uppercase tracking-widest">{item.t}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">{item.s}</span>
            </div>
          ))}
        </div>
      </section>

      {/* --- 4. SZYBKIE KATEGORIE VISUAL --- */}
      <section className="max-w-[1400px] mx-auto px-6 py-20 w-full">
        <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-10 text-center">Czego szukasz?</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {megaMenuTree.slice(0, 4).map((cat: any) => (
            <Link href={`/kategoria/${cat.slug}`} key={cat.slug} className="group relative h-48 md:h-64 rounded-[32px] bg-slate-50 border border-slate-100 overflow-hidden flex flex-col items-center justify-center p-6 hover:border-red-200 transition-colors">
              <div className="text-5xl md:text-7xl mb-4 group-hover:scale-110 transition-transform duration-500">{cat.icon}</div>
              <span className="text-sm md:text-base font-black text-slate-900 uppercase tracking-widest text-center">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* --- 5. BESTSELLERY --- */}
      {bestsellers?.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-6 py-20 w-full bg-slate-50 rounded-[40px] mb-20">
          <div className="flex justify-between items-end mb-10">
            <div>
              <p className="text-red-600 font-black uppercase text-[10px] tracking-[0.3em] mb-2">Najczęściej kupowane</p>
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">Bestsellery sezonu</h2>
            </div>
            <Link href="/bestsellery" className="hidden md:block text-slate-400 hover:text-red-600 font-bold text-sm uppercase tracking-widest transition-colors">Zobacz wszystkie ➔</Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {bestsellers.map((product: any) => (
              <Link href={`/produkt/${product.slug || product.id}`} key={product.id} className="bg-white rounded-[24px] p-6 border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all group flex flex-col">
                <div className="h-48 w-full bg-slate-50 rounded-xl mb-6 flex items-center justify-center overflow-hidden">
                   {product.images?.[0]?.url || product.external_images?.[0]?.url ? (
                     <img src={product.images?.[0]?.url || product.external_images?.[0]?.url} alt={product.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform" />
                   ) : <span className="text-slate-300 font-bold">Brak zdjęcia</span>}
                </div>
                <h3 className="font-bold text-slate-900 leading-tight mb-2 line-clamp-2">{product.name}</h3>
                <span className="text-[10px] font-bold text-slate-400 mb-4 block">SKU: {product.sku}</span>
                <div className="mt-auto flex justify-between items-end">
                  <span className="text-2xl font-black text-slate-900 tracking-tighter">{product.price.toFixed(2)} <span className="text-xs">zł</span></span>
                  <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center group-hover:bg-red-600 transition-colors">➔</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* --- 6. WIEDZA EKSPERCKA --- */}
      {/* Wiedzę wywołujemy, ale teraz może korzystać z danych przekazanych z serwera, zamiast pobierać z API! */}
      <div className="max-w-[1400px] mx-auto px-6 w-full mb-20">
         <KnowledgeSection initialArticles={articles} />
      </div>

    </div>
  );
}