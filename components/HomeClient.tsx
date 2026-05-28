'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import SearchBar from '@/components/SearchBar';
import VehicleGarage from '@/components/VehicleGarage';
import KnowledgeSection from '@/components/KnowledgeSection';

const bunnyLoader = ({ src, width }: { src: string; width: number }) => {
  if (!src.includes('b-cdn.net')) return src;
  const cleanSrc = src.split('?')[0]; 
  return `${cleanSrc}?width=${width}&format=webp`;
};

const generateSlug = (text: string) => {
  if (!text) return '';
  return text.toLowerCase()
    .replace(/[ą]/g, 'a').replace(/[ć]/g, 'c').replace(/[ę]/g, 'e')
    .replace(/[ł]/g, 'l').replace(/[ń]/g, 'n').replace(/[ó]/g, 'o')
    .replace(/[ś]/g, 's').replace(/[źż]/g, 'z')
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
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
  { name: "Elektronika i precyzja", slug: "elektronika-i-precyzja", icon: "📡" },
  { name: "Hodowla i zootechnika", slug: "hodowla-i-zootechnika", icon: "🐄" }
];

const QUICK_SILOS = [
  { name: "Warsztat i uniwersalne", slug: "warsztat-i-uniwersalne", img: "🔧" },
  { name: "Części uniwersalne", slug: "czesci-uniwersalne", img: "🔩" },
  { name: "Chemia i smary", slug: "chemia-i-smary", img: "🛢️" },
  { name: "Części do ciągników", slug: "czesci-do-ciagnikow", img: "🚜" },
  { name: "Hydraulika siłowa", slug: "hydraulika-silowa", img: "🗜️" },
  { name: "Elektronika i precyzja", slug: "elektronika-i-precyzja", img: "📡" },
  { name: "Hodowla i zootechnika", slug: "hodowla-i-zootechnika", img: "🐄" },
  { name: "Części do maszyn", slug: "czesci-do-maszyn", img: "⚙️" },
  { name: "Części ciągniki/maszyny", slug: "czesci-do-ciagnikow-i-maszyn", img: "🔗" },
  { name: "Dom, ogród, las", slug: "dom-ogrod-las", img: "🌲" },
  { name: "Materiały eksploatacyjne", slug: "materialy-eksploatacyjne", img: "📦" }
];

export default function HomeClient({ initialProducts }: { initialProducts: any[] }) {
  const [products] = useState<any[]>(initialProducts || []);
  const [isNetto, setIsNetto] = useState(false); 
  const [cartValue, setCartValue] = useState(120); 
  const freeShippingThreshold = 500; 
  
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [liveSale, setLiveSale] = useState<{text: string, id: number} | null>(null);
  const [isMounted, setIsMounted] = useState(false); 

  useEffect(() => {
    setIsMounted(true);
    
    const calculateTimeLeft = () => {
      const now = new Date();
      const cutoff = new Date();
      cutoff.setHours(15, 0, 0, 0); 
      if (now > cutoff) cutoff.setDate(cutoff.getDate() + 1);
      const difference = cutoff.getTime() - now.getTime();
      setTimeLeft({
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    };
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

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

    return () => { clearInterval(timer); clearInterval(saleTimer); };
  }, []);

  const getDisplayPrice = (priceBrutto: number) => {
    return isNetto ? (priceBrutto / 1.23).toFixed(2) : parseFloat(priceBrutto as any).toFixed(2);
  };

  const progressPercent = Math.min((cartValue / freeShippingThreshold) * 100, 100);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "CentrumRolnictwa",
    "url": "https://centrumrolnictwa.pl",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://centrumrolnictwa.pl/szukaj?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 md:pb-0">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* --- POWIADOMIENIE LIVE SALES --- */}
      <div className={`fixed bottom-24 md:bottom-8 left-4 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl z-[100] border-l-4 border-red-600 transition-all duration-500 ease-out transform ${liveSale ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          <p className="text-[10px] uppercase tracking-widest text-slate-400">Na żywo w sklepie</p>
        </div>
        <p className="text-xs font-bold pr-4 leading-tight">{liveSale?.text}</p>
      </div>

      {/* --- TOP BAR INFO --- */}
      <div className="bg-slate-900 text-white py-2 px-4 font-bold relative z-[60] shadow-sm border-b border-red-600/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center text-center gap-3">
          <div className="flex items-center space-x-6 text-[10px] sm:text-xs uppercase tracking-[0.2em]">
            <a href="tel:+48257888900" className="flex items-center gap-2 hover:text-red-500 transition-colors group">
              <span className="text-red-600 text-sm group-hover:animate-bounce">📞</span> <span className="tabular-nums tracking-wider">25 788 89 00</span>
            </a>
            <span className="hidden md:flex items-center gap-2 text-slate-300">
              <span className="text-emerald-500">✓</span> Ekspercki Dobór Części
            </span>
          </div>
          
          <div className="flex items-center gap-2 bg-red-600/20 px-4 py-1 rounded-full border border-red-600/30">
            <span className="text-[10px] uppercase tracking-widest text-red-100 hidden md:inline">Wysyłamy dzisiaj. Zamów w:</span>
            <span suppressHydrationWarning className="text-red-500 font-black tabular-nums text-sm tracking-widest">
              ⏳ {isMounted ? `${String(timeLeft.hours).padStart(2, '0')}:${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')}` : '00:00:00'}
            </span>
          </div>

          <div className="flex items-center gap-3 bg-black/40 p-1 rounded-full border border-slate-700">
            <button aria-label="Pokaż ceny brutto" className={`text-[10px] uppercase tracking-widest px-4 py-1 rounded-full transition-all ${!isNetto ? 'bg-white text-slate-900 font-black shadow-sm' : 'text-slate-400 hover:text-white'}`} onClick={() => setIsNetto(false)}>Brutto</button>
            <button aria-label="Pokaż ceny netto" className={`text-[10px] uppercase tracking-widest px-4 py-1 rounded-full transition-all ${isNetto ? 'bg-white text-slate-900 font-black shadow-sm' : 'text-slate-400 hover:text-white'}`} onClick={() => setIsNetto(true)}>Netto</button>
          </div>
        </div>
      </div>

      {/* --- GŁÓWNY HEADER Z WYSZUKIWARKĄ --- */}
      <header className="bg-white relative z-50 shadow-sm border-b border-slate-100 py-4 md:py-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8">
          
          <div className="flex-shrink-0 w-full md:w-auto flex justify-center md:justify-start">
            <Link href="/" aria-label="CentrumRolnictwa.pl - Strona Główna">
              <img src="https://centrumrolnictwa-cdn.b-cdn.net/logo/logo-centrumrolnictwapl-2-1.jpeg" 
  alt="CentrumRolnictwa.pl" 
  className="h-16 md:h-24 w-auto transition-transform hover:scale-105 duration-300" 
  fetchPriority="high" 
/>
            </Link>
          </div>

          <div className="flex-1 w-full max-w-3xl relative z-50">
             <SearchBar />
          </div>

          <nav className="hidden md:flex items-center space-x-6 text-slate-800">
            <div className="hidden xl:block text-right mr-4">
               <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">
                 Do darmowej: <span className="text-red-600 font-black">{(freeShippingThreshold - cartValue).toFixed(2)} zł</span>
               </p>
               <div className="w-40 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                 <div className="h-full bg-red-600 transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
               </div>
            </div>

            <Link href="/konto" aria-label="Twoje Konto" className="flex flex-col items-center cursor-pointer hover:text-red-600 transition-all group">
              <div className="p-3 bg-slate-50 rounded-full group-hover:bg-red-50 transition-colors border border-slate-200">
                 <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              </div>
              <span className="text-[9px] font-black mt-1.5 uppercase tracking-widest text-slate-500">Konto</span>
            </Link>
            
            <Link href="/koszyk" aria-label="Twój Koszyk" className="flex flex-col items-center cursor-pointer hover:text-red-600 transition-all relative group">
              <div className="p-3 bg-slate-50 rounded-full group-hover:bg-red-50 transition-colors relative border border-slate-200">
                 <div className="absolute -top-1.5 -right-2 bg-red-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md border-2 border-white group-hover:animate-bounce">2</div>
                 <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              </div>
              <span className="text-[10px] font-black mt-1.5 uppercase tracking-widest text-slate-800">{getDisplayPrice(cartValue)} zł</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* --- MEGA MENU DESKTOP (Złoty Standard - Lepsze odstępy) --- */}
      <div className="hidden lg:block bg-slate-900 text-white relative z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 flex items-center">
          <Link href="/kategorie" className="flex items-center gap-2 py-4 px-6 font-black text-white bg-red-600 uppercase text-[11px] tracking-widest hover:bg-red-700 transition-colors shrink-0 z-10 relative">
            <span>☰</span> Pełny Katalog 2026
          </Link>
          
          <ul className="flex flex-1 items-center justify-center gap-6 xl:gap-8 px-4">
            {MEGA_MENU_DATA.map((cat) => (
              <li key={cat.slug} className="group text-center py-4">
                <Link href={`/kategoria/${cat.slug}`} className="block font-bold text-slate-300 hover:text-white transition-all uppercase text-[10px] xl:text-[11px] tracking-widest whitespace-nowrap group-hover:underline decoration-red-600 underline-offset-4">
                  <span className="mr-1.5 text-base align-middle">{cat.icon}</span> {cat.name}
                </Link>

                {cat.columns && cat.columns.length > 0 && (
                  <div className="absolute left-0 top-full w-full bg-white border border-slate-200 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 rounded-b-2xl p-8 z-50 text-left text-slate-900">
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

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* --- HERO & WIRTUALNY GARAŻ --- */}
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

        {/* --- SILOSY SEO (Dwurzędowa Elegancka Siatka) --- */}
        <section className="mb-20">
           <h2 className="sr-only">Kategorie Główne Sklepu Rolniczego</h2>
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 lg:gap-4">
             {QUICK_SILOS.map((silo, index) => (
                <Link key={silo.slug} href={`/kategoria/${silo.slug}`} className={`bg-white border border-slate-100 p-4 lg:p-6 rounded-[24px] flex flex-col items-center justify-center text-center gap-3 hover:border-red-500 hover:shadow-lg transition-all group ${index === QUICK_SILOS.length - 1 ? 'lg:col-start-3' : ''}`}>
                  <span className="text-3xl lg:text-4xl group-hover:scale-110 transition-transform">{silo.img}</span>
                  <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider group-hover:text-red-600 leading-tight">{silo.name}</span>
                </Link>
             ))}
           </div>
        </section>

        {/* --- PRODUKTY (BESTSELLERY Z SERWERA) --- */}
        <section className="mb-24">
          <div className="flex justify-between items-end mb-8 border-b-2 border-slate-100 pb-6">
            <div>
              <p className="text-red-600 font-black uppercase text-[10px] tracking-[0.3em] mb-2 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping"></span> Top Wybory Rolników</p>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">Bestsellery Sezonu</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
                  <article key={product.id} className="group flex flex-col bg-white border border-slate-100 rounded-[32px] p-5 hover:shadow-xl hover:border-red-200 transition-all duration-300 relative h-full">
                    <Link href={`/produkt/${product.slug || product.id}`} className="absolute inset-0 z-10" aria-label={`Przejdź do ${product.name}`}></Link>
                    
                    <div className="aspect-[4/3] bg-slate-50 rounded-2xl mb-4 flex items-center justify-center overflow-hidden relative border border-slate-100 p-6">
                      {imageUrl ? (
                        <Image loader={imageUrl.includes('b-cdn.net') ? bunnyLoader : undefined} src={imageUrl} alt={product.name} fill sizes="(max-width: 640px) 100vw, 25vw" className="object-contain group-hover:scale-110 transition-transform duration-700 mix-blend-multiply p-4" />
                      ) : (
                        <div className="text-slate-300 font-black text-[10px] uppercase tracking-widest">Brak zdjęcia</div>
                      )}
                      
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-20">
                        {index === 0 && <span className="bg-red-600 text-white text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow-sm">Nr 1 w Sklepie</span>}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 mb-2">
                      <div className="flex text-amber-400 text-xs">★★★★★</div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">({buyCount} kupiło)</span>
                    </div>

                    <div className="flex-1">
                      <h3 className="font-black text-sm text-slate-800 leading-snug group-hover:text-red-600 transition-colors line-clamp-2 tracking-tight relative z-20">
                        <Link href={`/produkt/${product.slug || product.id}`}>{product.name}</Link>
                      </h3>
                      <p className="text-[9px] text-slate-400 mt-2 font-black uppercase tracking-widest bg-slate-50 w-fit px-2 py-0.5 rounded-md border border-slate-100">SKU: {product.sku || 'Brak'}</p>
                    </div>
                    
                    <div className="mt-5 flex flex-col relative z-20 pt-4 border-t border-slate-50">
                      <div className="flex justify-between items-end mb-4">
                        <span className="text-2xl font-black text-slate-900 tracking-tighter">
                          {getDisplayPrice(product.price)} <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isNetto ? 'zł netto' : 'zł brutto'}</span>
                        </span>
                      </div>
                      <button aria-label="Dodaj do koszyka" className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest group-hover:bg-red-600 transition-colors shadow-md active:scale-95 flex items-center justify-center gap-2 relative z-20">
                        <span>🛒</span> Dodaj do koszyka
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        {/* --- STREFA WIEDZY --- */}
        <KnowledgeSection />

        {/* --- BLOK SEO DLA STRONY GŁÓWNEJ (Sklep Rolniczy) --- */}
        <section className="mb-12 mt-16 bg-white rounded-[32px] p-8 md:p-12 border border-slate-100 shadow-sm">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight">Internetowy Sklep Rolniczy - Części do maszyn i ciągników</h2>
          <div className="text-xs text-slate-600 leading-relaxed columns-1 md:columns-2 gap-10 text-justify font-medium">
            <p className="mb-4">
              Prowadzenie nowoczesnego gospodarstwa wymaga niezawodnego sprzętu. Jako profesjonalny <strong>internetowy sklep rolniczy</strong>, dostarczamy najwyższej jakości części zamienne do ciągników (Ursus, Zetor, John Deere, Massey Ferguson, Case) oraz maszyn polowych. Nasz katalog obejmuje tysiące oryginalnych podzespołów oraz wyselekcjonowanych, sprawdzonych w polu zamienników OEM. Niezależnie od tego, czy potrzebujesz filtrów do bieżącego serwisu, czy skomplikowanych elementów hydrauliki siłowej – znajdziesz je u nas.
            </p>
            <p>
              Rozumiemy, że w trakcie sezonu liczy się każda godzina. Dlatego nasz system logistyczny został zoptymalizowany pod kątem błyskawicznej wysyłki. Zamówienia złożone do godziny 15:00 na części warsztatowe, chemię rolniczą czy elektrykę nadajemy tego samego dnia. CentrumRolnictwa.pl to nie tylko sprzedaż, to przede wszystkim doradztwo techniczne – nasi specjaliści pomogą Ci dobrać odpowiedni model części do Twojej maszyny po numerze VIN lub katalogowym (OEM).
            </p>
          </div>
        </section>

      </main>

      {/* --- MOBILE BOTTOM NAVIGATION --- */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 z-[70] flex justify-between items-center px-6 py-3 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] pb-safe" aria-label="Nawigacja mobilna">
        <Link href="/" className="flex flex-col items-center text-red-600">
          <svg className="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path></svg>
          <span className="text-[9px] font-black uppercase tracking-widest">Start</span>
        </Link>
        <Link href="/kategorie" className="flex flex-col items-center text-slate-400 hover:text-slate-900 transition-colors">
          <span className="text-xl mb-1">☰</span>
          <span className="text-[9px] font-black uppercase tracking-widest">Działy</span>
        </Link>
        <Link href="/konto" className="flex flex-col items-center text-slate-400 hover:text-slate-900 transition-colors">
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          <span className="text-[9px] font-black uppercase tracking-widest">Konto</span>
        </Link>
        <Link href="/koszyk" className="flex flex-col items-center text-slate-400 hover:text-slate-900 transition-colors relative">
          <div className="absolute -top-1 -right-2 bg-red-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white">2</div>
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
          <span className="text-[9px] font-black uppercase tracking-widest">Koszyk</span>
        </Link>
      </nav>

      {/* --- STOPKA --- */}
      <footer className="bg-slate-900 text-white py-16 border-t-4 border-red-600 pb-32 md:pb-16 mt-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12">
          <div>
            <img src="/logo-centrumrolnictwapl-2-2.webp" alt="CentrumRolnictwa Logo" className="h-10 w-auto mb-6 brightness-0 invert" loading="lazy" />
            <p className="text-[10px] font-bold text-slate-400 uppercase leading-loose tracking-widest">
              Niezawodny Sklep Rolniczy.<br/> Części, maszyny, doradztwo.
            </p>
          </div>
          <div>
             <h4 className="text-white font-black mb-6 uppercase text-[11px] tracking-widest">Sklep</h4>
             <ul className="space-y-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {QUICK_SILOS.slice(0, 4).map(cat => (
                  <li key={cat.slug}><Link href={`/kategoria/${cat.slug}`} className="hover:text-red-500 transition-colors">{cat.name}</Link></li>
                ))}
             </ul>
          </div>
          <div className="md:col-span-2 bg-slate-800/50 p-8 rounded-[32px] border border-slate-700 flex flex-col justify-center">
             <h4 className="text-slate-300 font-black mb-4 uppercase text-[10px] tracking-[0.2em]">Infolinia i Doradztwo Techniczne</h4>
             <a href="tel:+48257888900" className="font-black text-3xl md:text-4xl text-white tracking-tighter tabular-nums mb-3 hover:text-red-500 transition-colors w-fit">25 788 89 00</a>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Czynne Pn-Pt: 8:00 - 16:00
             </p>
          </div>
        </div>
      </footer>
    </div>
  );
}