'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import VehicleGarage from '@/components/VehicleGarage';
import HeroSearch from '@/components/HeroSearch';
import KnowledgeSection from '@/components/KnowledgeSection';
import { useCart } from '@/store/useCart';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileBottomNav from '@/components/MobileBottomNav';

const bunnyLoader = ({ src, width }: { src: string; width: number }) => {
  if (!src.includes('b-cdn.net')) return src;
  const cleanSrc = src.split('?')[0];
  return `${cleanSrc}?width=${width}&format=webp`;
};

// Główne kategorie sklepu (drzwi wejściowe dla rolnika — przeglądanie po dziale).
const QUICK_SILOS = [
  { name: 'Części do ciągników', slug: 'czesci-do-ciagnikow', img: '🚜' },
  { name: 'Części do maszyn', slug: 'czesci-do-maszyn', img: '⚙️' },
  { name: 'Hydraulika siłowa', slug: 'hydraulika-silowa', img: '🗜️' },
  { name: 'Zaczepy, koła i osprzęt', slug: 'czesci-do-ciagnikow-i-maszyn', img: '🔗' },
  { name: 'Hodowla i zootechnika', slug: 'hodowla-i-zootechnika', img: '🐄' },
  { name: 'Części uniwersalne', slug: 'czesci-uniwersalne', img: '🔩' },
  { name: 'Warsztat i narzędzia', slug: 'warsztat-i-uniwersalne', img: '🔧' },
  { name: 'Chemia i smary', slug: 'chemia-i-smary', img: '🛢️' },
  { name: 'Dom, ogród, las', slug: 'dom-ogrod-las', img: '🌲' },
  { name: 'Materiały eksploatacyjne', slug: 'materialy-eksploatacyjne', img: '📦' },
];

// Filary zaufania — to, co realnie decyduje u rolnika: czas, pewność dopasowania, wsparcie.
const TRUST = [
  { icon: '🚚', title: 'Wysyłka w 24h', desc: 'Zamów do 15:00 — nadajemy tego samego dnia.' },
  { icon: '✅', title: 'Gwarancja dopasowania', desc: 'Dobierzemy część po modelu, VIN lub numerze OEM.' },
  { icon: '📦', title: 'Darmowa dostawa od 500 zł', desc: 'Kurier pod gospodarstwo, śledzenie przesyłki.' },
  { icon: '📞', title: 'Doradztwo techniczne', desc: 'Zadzwoń: 25 788 89 00 (pn–pt 8:00–16:00).' },
];

export default function HomeClient({ initialProducts, children }: { initialProducts: any[]; children?: React.ReactNode }) {
  const [products] = useState<any[]>(initialProducts || []);
  const [isNetto, setIsNetto] = useState(false);
  const { setIsOpen: setCartOpen } = useCart() as any;

  const [liveSale, setLiveSale] = useState<{ text: string; id: number } | null>(null);

  useEffect(() => {
    const sales = [
      'Jan (woj. lubelskie) kupił: Filtry do Ursus C-360',
      'Gospodarstwo (Wielkopolska) kupiło: Zestaw oświetlenia LED',
      'Michał (Podlasie) kupił: Szybkozłącza hydrauliczne',
      'Krzysztof (Mazowsze) kupił: Olej silnikowy 15W-40 20L',
      'Rolnik z Kujaw kupił: Paski klinowe do kombajnu',
    ];
    let saleId = 0;
    const t = setInterval(() => {
      if (Math.random() > 0.3) {
        setLiveSale({ text: sales[Math.floor(Math.random() * sales.length)], id: ++saleId });
        setTimeout(() => setLiveSale(null), 6000);
      }
    }, 15000);
    return () => clearInterval(t);
  }, []);

  const getDisplayPrice = (priceBrutto: number) => {
    const p = parseFloat(priceBrutto as any) || 0;
    return (isNetto ? p / 1.23 : p).toFixed(2);
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: 'CentrumRolnictwa.pl',
    description: 'Internetowy sklep rolniczy — części do ciągników i maszyn rolniczych, zgodne z OEM.',
    url: 'https://centrumrolnictwa.pl',
    telephone: '+48257888900',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://centrumrolnictwa.pl/kategorie?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Toast „na żywo" — CAŁY kontener ma pointer-events-none, więc NIGDY nie łapie klików.
          Renderowany tylko gdy jest komunikat. */}
      {liveSale && (
        <div className="fixed bottom-24 md:bottom-8 left-4 z-[60] pointer-events-none max-w-[calc(100vw-2rem)]">
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border-l-4 border-red-600 animate-in slide-in-from-left-4 fade-in duration-500">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-[10px] uppercase tracking-widest text-slate-400">Na żywo w sklepie</p>
            </div>
            <p className="text-xs font-bold pr-2 leading-tight">{liveSale.text}</p>
          </div>
        </div>
      )}

      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* HERO: wyszukiwarka OEM/SKU jako bohater (opakowuje istniejący SearchBar) */}
        <HeroSearch />

        {/* WIRTUALNY GARAŻ — killer feature: dobór części po marce/modelu maszyny */}
        <section className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2 bg-slate-900 rounded-[32px] md:rounded-[40px] p-8 md:p-10 flex flex-col justify-center text-white relative overflow-hidden border border-slate-800">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-red-600 rounded-full blur-[140px] opacity-15 -mr-16 -mt-16 pointer-events-none" />
            <p className="text-red-500 font-black uppercase text-[10px] tracking-[0.3em] mb-3 relative z-10">Oszczędź czas</p>
            <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight leading-tight mb-4 relative z-10">
              Nie znasz numeru części?<br />
              <span className="text-slate-400">Dobierz ją pod swoją maszynę.</span>
            </h2>
            <p className="text-slate-400 text-sm md:text-base font-medium max-w-lg relative z-10 leading-relaxed">
              Wybierz markę i model ciągnika — pokażemy wyłącznie części pasujące do Twojej maszyny. Zero pomyłek, zero zwrotów.
            </p>
          </div>
          <aside className="lg:col-span-1 h-full">
            <VehicleGarage />
          </aside>
        </section>

        {/* PASEK ZAUFANIA */}
        <section aria-label="Dlaczego my" className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-16">
          {TRUST.map((t) => (
            <div key={t.title} className="bg-white border border-slate-100 rounded-2xl p-4 md:p-5 flex flex-col gap-1.5">
              <span className="text-2xl md:text-3xl">{t.icon}</span>
              <span className="text-[12px] md:text-sm font-black uppercase tracking-tight text-slate-900 leading-tight">{t.title}</span>
              <span className="text-[11px] md:text-xs text-slate-500 font-medium leading-snug">{t.desc}</span>
            </div>
          ))}
        </section>

        {/* KATEGORIE — główna nawigacja sklepu */}
        <section className="mb-20">
          <div className="mb-8">
            <p className="text-red-600 font-black uppercase text-[10px] tracking-[0.3em] mb-2">Przeglądaj po dziale</p>
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">Kategorie części rolniczych</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-6">
            {QUICK_SILOS.map((silo) => (
              <Link
                key={silo.slug}
                href={`/kategoria/${silo.slug}`}
                prefetch={true}
                className="bg-white border border-slate-100 p-6 lg:p-8 rounded-[32px] lg:rounded-[40px] flex flex-col items-center justify-center text-center gap-4 hover:border-red-600 hover:shadow-2xl hover:shadow-red-600/10 transition-all duration-300 group min-h-[150px]"
              >
                <span className="text-4xl lg:text-5xl group-hover:scale-110 transition-transform duration-300">{silo.img}</span>
                <span className="text-[11px] font-black uppercase text-slate-900 tracking-[0.15em] group-hover:text-red-600 leading-tight">{silo.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* BESTSELLERY */}
        <section className="mb-20">
          <div className="flex justify-between items-end mb-8 border-b-2 border-slate-100 pb-6">
            <div>
              <p className="text-red-600 font-black uppercase text-[10px] tracking-[0.3em] mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping" /> Top wybory rolników
              </p>
              <h2 className="text-2xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">Bestsellery sezonu</h2>
            </div>
            {products.length > 0 && (
              <button
                type="button"
                onClick={() => setIsNetto((v) => !v)}
                className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:border-slate-900 hover:text-slate-900 transition-colors"
              >
                Pokaż ceny: {isNetto ? 'netto' : 'brutto'}
              </button>
            )}
          </div>

          {products.length === 0 ? (
            <div className="text-center py-16 bg-white border-2 border-dashed border-slate-200 rounded-[32px]">
              <span className="text-4xl block mb-3 opacity-50">🛠️</span>
              <p className="font-black text-slate-900 uppercase tracking-widest text-sm mb-1">Wkrótce bestsellery</p>
              <p className="text-slate-500 text-sm font-medium mb-6">Przeglądaj pełny katalog i znajdź część do swojej maszyny.</p>
              <Link href="/kategorie" prefetch={true} className="inline-flex bg-slate-900 text-white px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors">
                Otwórz katalog ➔
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
              {products.map((product: any, index: number) => {
                let cdn: string[] = [];
                if (Array.isArray(product.external_images)) cdn = product.external_images;
                else if (typeof product.external_images === 'string') {
                  try { cdn = JSON.parse(product.external_images); } catch { /* ignore */ }
                }
                const fallback = (product.images || []).map((img: any) => img?.url_standard || img?.url || img?.src).filter(Boolean);
                const imageUrl = (cdn.length > 0 ? cdn : fallback)[0] || null;

                return (
                  <article key={product.id} className="group relative flex flex-col bg-white border border-slate-100 rounded-[24px] md:rounded-[32px] p-3 md:p-5 hover:shadow-xl hover:border-red-200 transition-all duration-300 h-full">
                    {/* Link pokrywa kartę, ale przycisk koszyka jest wyżej (z-20) i ma stopPropagation */}
                    <Link href={`/produkt/${product.slug || product.sku || product.id}`} prefetch={false} className="absolute inset-0 z-10" aria-label={`Przejdź do ${product.name}`} />

                    <div className="aspect-square bg-slate-50 rounded-[16px] md:rounded-2xl mb-3 md:mb-4 flex items-center justify-center overflow-hidden relative border border-slate-100 p-3 md:p-6">
                      {imageUrl ? (
                        <Image
                          loader={imageUrl.includes('b-cdn.net') ? bunnyLoader : undefined}
                          src={imageUrl}
                          alt={product.name}
                          fill
                          sizes="(max-width: 640px) 50vw, 25vw"
                          priority={index < 4}
                          className="object-contain group-hover:scale-110 transition-transform duration-500 mix-blend-multiply p-2 md:p-4"
                        />
                      ) : (
                        <div className="text-slate-300 font-black text-[9px] md:text-[10px] uppercase tracking-widest text-center">Brak zdjęcia</div>
                      )}
                      {index === 0 && (
                        <span className="absolute top-2 left-2 z-20 bg-red-600 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-sm">Nr 1</span>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col relative z-20 pointer-events-none">
                      <h3 className="font-bold text-xs md:text-sm text-slate-800 leading-snug group-hover:text-red-600 transition-colors line-clamp-2 tracking-tight mt-1">{product.name}</h3>
                      <p className="text-[8px] md:text-[9px] text-slate-400 mt-1 md:mt-2 font-black uppercase tracking-widest bg-slate-50 w-fit px-2 py-0.5 rounded-md border border-slate-100">SKU: {product.sku || 'Brak'}</p>
                    </div>

                    <div className="mt-3 md:mt-5 flex items-end justify-between relative z-20 pt-3 md:pt-4 border-t border-slate-50">
                      <span className="text-base md:text-2xl font-black text-slate-900 tracking-tighter pointer-events-none">
                        {getDisplayPrice(product.price)}
                        <span className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{isNetto ? 'zł netto' : 'zł'}</span>
                      </span>
                      <button
                        type="button"
                        aria-label="Dodaj do koszyka"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCartOpen?.(true); }}
                        className="bg-slate-900 text-white w-9 h-9 md:w-auto md:px-4 md:py-3.5 rounded-lg md:rounded-xl font-black text-[10px] uppercase tracking-widest group-hover:bg-red-600 transition-colors shadow-md active:scale-95 flex items-center justify-center gap-2 relative z-30 cursor-pointer shrink-0"
                      >
                        <span className="text-[14px] md:text-base leading-none">🛒</span>
                        <span className="hidden md:inline">Dodaj</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <KnowledgeSection />

        {/* TEKST SEO */}
        <section className="mb-12 mt-16 bg-white rounded-[32px] p-8 md:p-12 border border-slate-100 shadow-sm">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight">
            Internetowy sklep rolniczy — części do maszyn i ciągników
          </h2>
          <div className="text-xs text-slate-600 leading-relaxed columns-1 md:columns-2 gap-10 text-justify font-medium">
            <p className="mb-4">
              Prowadzenie nowoczesnego gospodarstwa wymaga niezawodnego sprzętu. Jako profesjonalny <strong>internetowy sklep rolniczy</strong> dostarczamy najwyższej jakości części zamienne do ciągników oraz maszyn polowych. Nasz katalog obejmuje tysiące oryginalnych podzespołów oraz sprawdzonych w polu zamienników OEM — od filtrów i części do silnika, przez hydraulikę siłową, po sprzęt udojowy i akcesoria do hodowli.
            </p>
            <p>
              W trakcie sezonu liczy się każda godzina. Dlatego zamówienia złożone do 15:00 nadajemy tego samego dnia, a nasz zespół pomoże dobrać właściwą część po numerze VIN, katalogowym (OEM) lub po prostu po modelu maszyny. CentrumRolnictwa.pl to nie tylko sprzedaż — to doradztwo techniczne i pewność, że zamówiona część będzie pasować.
            </p>
          </div>
        </section>

        {/* Sekcja opinii (serwerowa, przekazana z page.tsx jako children) — przed stopką */}
        {children}
      </main>

      <MobileBottomNav />
      <Footer />
    </div>
  );
}