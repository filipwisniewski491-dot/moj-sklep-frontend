'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import VehicleGarage from '@/components/VehicleGarage';
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

const QUICK_SILOS = [
  { name: "Warsztat i uniwersalne", slug: "warsztat-i-uniwersalne", img: "🔧" },
  { name: "Części uniwersalne", slug: "czesci-uniwersalne", img: "🔩" },
  { name: "Chemia i smary", slug: "chemia-i-smary", img: "🛢️" },
  { name: "Części do ciągników", slug: "czesci-do-ciagnikow", img: "🚜" },
  { name: "Hydraulika siłowa", slug: "hydraulika-silowa", img: "🗜️" },
  { name: "Hodowla i zootechnika", slug: "hodowla-i-zootechnika", img: "🐄" },
  { name: "Części do maszyn", slug: "czesci-do-maszyn", img: "⚙️" },
  { name: "Części ciągniki/maszyny", slug: "czesci-do-ciagnikow-i-maszyn", img: "🔗" },
  { name: "Dom, ogród, las", slug: "dom-ogrod-las", img: "🌲" },
  { name: "Materiały eksploatacyjne", slug: "materialy-eksploatacyjne", img: "📦" }
];

export default function HomeClient({ initialProducts }: { initialProducts: any[] }) {
  const [products] = useState<any[]>(initialProducts || []);
  const [isNetto, setIsNetto] = useState(false); 
  
  const { setIsOpen: setCartOpen } = useCart() as any;

  const [liveSale, setLiveSale] = useState<{text: string, id: number} | null>(null);

  // Symulacja powiadomień o zakupach (Social Proof)
  useEffect(() => {
    const sales = [
      "Jan (woj. lubelskie) kupił: Filtry do Ursus C-360",
      "Gospodarstwo (Wielkopolska) kupiło: Zestaw oświetlenia LED",
      "Michał (Podlasie) kupił: Szybkozłącza hydrauliczne",
      "Krzysztof (Mazowsze) kupił: Olej silnikowy 15W-40 20L",
      "Rolnik z Kujaw kupił: Paski klinowe do kombajnu"
    ];
    
    let saleId = 0;
    const saleTimer = setInterval(() => {
      if(Math.random() > 0.3) { 
        setLiveSale({ text: sales[Math.floor(Math.random() * sales.length)], id: ++saleId });
        setTimeout(() => setLiveSale(null), 6000);
      }
    }, 15000); 

    return () => { clearInterval(saleTimer); };
  }, []);

  const getDisplayPrice = (priceBrutto: number) => {
    return isNetto ? (priceBrutto / 1.23).toFixed(2) : parseFloat(priceBrutto as any).toFixed(2);
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "CentrumRolnictwa",
    "url": "https://centrumrolnictwa.pl",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://centrumrolnictwa.pl/kategorie?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 md:pb-0">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Powiadomienie Live Sale */}
      <div className={`fixed bottom-24 md:bottom-8 left-4 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl z-[100] border-l-4 border-red-600 transition-all duration-500 ease-out transform ${liveSale ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          <p className="text-[10px] uppercase tracking-widest text-slate-400">Na żywo w sklepie</p>
        </div>
        <p className="text-xs font-bold pr-4 leading-tight">{liveSale?.text}</p>
      </div>

      {/* Globalny Nagłówek (Zastępuje zduplikowany kod) */}
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Sekcja Hero z Garażem */}
        <section className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
          <article className="lg:col-span-3 bg-slate-900 rounded-[32px] md:rounded-[48px] p-8 md:p-14 flex flex-col justify-center items-start text-white relative overflow-hidden shadow-xl border border-slate-800">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600 rounded-full blur-[140px] opacity-20 -mr-20 -mt-20"></div>
            <span className="bg-white/10 text-white border border-white/20 text-[10px] font-black px-4 py-1.5 rounded-full mb-6 uppercase tracking-widest relative z-10 backdrop-blur-sm">Sezon Polowy 2026</span>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black mb-6 relative z-10 leading-[1.1] uppercase tracking-tight text-slate-50">
              Awaria na polu to <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-600">strata czasu i pieniędzy.</span>
            </h1>
            <p className="text-slate-400 mb-10 max-w-lg relative z-10 text-sm md:text-base font-medium leading-relaxed">
              Zapewnij ciągłość pracy swojemu gospodarstwu. Zamów oryginalne części i sprawdzone zamienniki OEM z najszybszą dostawą kurierską.
            </p>
            <Link href="/kategorie" className="bg-red-600 text-white px-8 py-5 rounded-2xl font-black uppercase text-[11px] lg:text-xs tracking-widest hover:bg-red-700 transition-all relative z-10 shadow-lg shadow-red-600/30 flex items-center gap-3 w-full sm:w-auto justify-center">
              Przeglądaj Katalog Części <span className="text-lg">➔</span>
            </Link>
          </article>
          <aside className="lg:col-span-1 hidden lg:block h-full">
            <div className="h-full">
              <VehicleGarage />
            </div>
          </aside>
        </section>

        {/* Główne Kategorie */}
        <section className="mb-24">
           <h2 className="sr-only">Kategorie Główne Sklepu Rolniczego</h2>
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 lg:gap-8">
             {QUICK_SILOS.map((silo, index) => (
                <Link key={silo.slug} href={`/kategoria/${silo.slug}`} className={`bg-white border border-slate-100 p-8 lg:p-10 rounded-[40px] flex flex-col items-center justify-center text-center gap-5 hover:border-red-600 hover:shadow-2xl hover:shadow-red-600/10 transition-all duration-300 group`}>
                  <span className="text-5xl lg:text-6xl group-hover:scale-110 transition-transform">{silo.img}</span>
                  <span className="text-[11px] font-black uppercase text-slate-900 tracking-[0.2em] group-hover:text-red-600 leading-tight max-w-[120px]">{silo.name}</span>
                </Link>
             ))}
           </div>
        </section>

        {/* Sekcja Bestsellery (Dane ze Strapi via ISR) */}
        <section className="mb-24">
          <div className="flex justify-between items-end mb-8 border-b-2 border-slate-100 pb-6">
            <div>
              <p className="text-red-600 font-black uppercase text-[10px] tracking-[0.3em] mb-2 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping"></span> Top Wybory Rolników</p>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">Bestsellery Sezonu</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {products.length === 0 ? (
              <p className="col-span-4 text-center font-bold text-slate-400 py-10 uppercase">Brak produktów do wyświetlenia.</p>
            ) : (
              products.map((product: any, index: number) => {
                let cdnImages: string[] = [];
                if (product.external_images) {
                  if (Array.isArray(product.external_images)) cdnImages = product.external_images;
                  else if (typeof product.external_images === 'string') {
                    try { cdnImages = JSON.parse(product.external_images); } catch (e) {}
                  }
                }
                const fallbackImages = (product.images || []).map((img: any) => img?.url_standard || img?.url || img?.src).filter(Boolean);
                const displayImages = cdnImages.length > 0 ? cdnImages : fallbackImages;
                const imageUrl = displayImages.length > 0 ? displayImages[0] : null;
                const buyCount = Math.floor(Math.random() * 20) + 5; 

                return (
                  <article key={product.id} className="group flex flex-col bg-white border border-slate-100 rounded-[24px] md:rounded-[32px] p-3 md:p-5 hover:shadow-xl hover:border-red-200 transition-all duration-300 relative h-full">
                    <Link href={`/produkt/${product.slug || product.sku || product.id}`} className="absolute inset-0 z-10" aria-label={`Przejdź do ${product.name}`}></Link>
                    
                    <div className="aspect-square bg-slate-50 rounded-[16px] md:rounded-2xl mb-3 md:mb-4 flex items-center justify-center overflow-hidden relative border border-slate-100 p-3 md:p-6">
                      {imageUrl ? (
                        <Image loader={imageUrl.includes('b-cdn.net') ? bunnyLoader : undefined} src={imageUrl} alt={product.name} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-contain group-hover:scale-110 transition-transform duration-700 mix-blend-multiply p-2 md:p-4" />
                      ) : (
                        <div className="text-slate-300 font-black text-[9px] md:text-[10px] uppercase tracking-widest text-center">Brak zdjęcia</div>
                      )}
                      
                      <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-20">
                        {index === 0 && <span className="bg-red-600 text-white text-[7px] md:text-[8px] font-black px-2 py-0.5 md:py-1 rounded-full uppercase tracking-widest shadow-sm">Nr 1</span>}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 mb-1.5 md:mb-2">
                      <div className="flex text-amber-400 text-[9px] md:text-xs">★★★★★</div>
                      <span className="text-[7px] md:text-[9px] text-slate-400 font-bold uppercase tracking-wider hidden sm:inline-block">({buyCount} kupiło)</span>
                    </div>

                    <div className="flex-1 flex flex-col">
                      <h3 className="font-bold text-xs md:text-sm text-slate-800 leading-snug group-hover:text-red-600 transition-colors line-clamp-2 tracking-tight relative z-20">
                        {product.name}
                      </h3>
                      <p className="text-[8px] md:text-[9px] text-slate-400 mt-1 md:mt-2 font-black uppercase tracking-widest bg-slate-50 w-fit px-1.5 md:px-2 py-0.5 rounded-md border border-slate-100">SKU: {product.sku || 'Brak'}</p>
                    </div>
                    
                    <div className="mt-3 md:mt-5 flex items-end justify-between relative z-20 pt-3 md:pt-4 border-t border-slate-50">
                      <div className="flex flex-col">
                        <span className="text-base md:text-2xl font-black text-slate-900 tracking-tighter">
                          {getDisplayPrice(product.price)} 
                          <span className="text-[7px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:inline ml-1">{isNetto ? 'zł netto' : 'zł brutto'}</span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest md:hidden ml-0.5">zł</span>
                        </span>
                      </div>
                      <button aria-label="Dodaj do koszyka" onClick={(e) => { e.preventDefault(); setCartOpen(true); }} className="bg-slate-900 text-white w-9 h-9 md:w-auto md:px-4 md:py-3.5 rounded-lg md:rounded-xl font-black text-[10px] uppercase tracking-widest group-hover:bg-red-600 transition-colors shadow-md active:scale-95 flex items-center justify-center gap-2 relative z-20 cursor-pointer shrink-0">
                        <span className="text-[14px] md:text-base leading-none">🛒</span>
                        <span className="hidden md:inline">Dodaj</span>
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        <KnowledgeSection />

        <section className="mb-12 mt-16 bg-white rounded-[32px] p-8 md:p-12 border border-slate-100 shadow-sm">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight">Internetowy Sklep Rolniczy - Części do maszyn i ciągników</h2>
          <div className="text-xs text-slate-600 leading-relaxed columns-1 md:columns-2 gap-10 text-justify font-medium">
            <p className="mb-4">
              Prowadzenie nowoczesnego gospodarstwa wymaga niezawodnego sprzętu. Jako profesjonalny <strong>internetowy sklep rolniczy</strong>, dostarczamy najwyższej jakości części zamienne do ciągników oraz maszyn polowych. Nasz katalog obejmuje tysiące oryginalnych podzespołów oraz wyselekcjonowanych, sprawdzonych w polu zamienników OEM. Niezależnie od tego, czy potrzebujesz filtrów do bieżącego serwisu, czy skomplikowanych elementów hydrauliki siłowej – znajdziesz je u nas.
            </p>
            <p>
              Rozumiemy, że w trakcie sezonu liczy się każda godzina. Dlatego nasz system logistyczny został zoptymalizowany pod kątem błyskawicznej wysyłki. Zamówienia złożone do godziny 15:00 nadajemy tego samego dnia. CentrumRolnictwa.pl to nie tylko sprzedaż, to przede wszystkim doradztwo techniczne – nasi specjaliści pomogą Ci dobrać odpowiedni model części po numerze VIN lub katalogowym (OEM).
            </p>
          </div>
        </section>
      </main>

      <MobileBottomNav />
      
      {/* Globalna Stopka (Zastępuje zduplikowany kod) */}
      <Footer />

    </div>
  );
}