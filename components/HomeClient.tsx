'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import VehicleGarage from '@/components/VehicleGarage';
import KnowledgeSection from '@/components/KnowledgeSection';

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
    name: "Hydraulika siłowa", slug: "hydraulika", icon: "🗜️",
    columns: [
      { title: "Elementy układu", slug: "elementy-ukladu", links: ["Pompy hydrauliczne", "Rozdzielacze", "Siłowniki", "Szybkozłącza"] }
    ]
  }, 
  { name: "Łożyska i uszczelniacze", slug: "lozyska", icon: "⭕" },
  { name: "Filtry i oleje", slug: "filtry-oleju-i-paliwa", icon: "🛢️" },
  { name: "Warsztat i BHP", slug: "warsztat", icon: "🔧" }
];

export default function HomeClient({ initialProducts }: { initialProducts: any[] }) {
  // Brak skeletonów ładujących! Produkty pochodzą prosto z wygenerowanego serwera
  const [products] = useState<any[]>(initialProducts || []);
  
  const [isNetto, setIsNetto] = useState(false); 
  const [cartValue, setCartValue] = useState(120); 
  const freeShippingThreshold = 500; 
  
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [liveSale, setLiveSale] = useState<{text: string, id: number} | null>(null);
  const [isMounted, setIsMounted] = useState(false); // Zapobiega błędom hydracji czasu

  useEffect(() => {
    setIsMounted(true);
    
    // FOMO Timer
    const calculateTimeLeft = () => {
      const now = new Date();
      const cutoff = new Date();
      cutoff.setHours(14, 0, 0, 0); 
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

    // Social Proof Engine
    const sales = [
      "Jan (woj. lubelskie) kupił: Pompa wody Ursus C-360",
      "Gospodarstwo (Wielkopolska) kupiło: Komplet filtrów",
      "Ktoś z Mazowsza kupił: Olej hydrauliczny HL46 20L",
      "Michał (Podlasie) kupił: Wałek przekaźnika mocy WOM"
    ];
    
    let saleId = 0;
    const saleTimer = setInterval(() => {
      if(Math.random() > 0.4) {
        setLiveSale({ text: sales[Math.floor(Math.random() * sales.length)], id: ++saleId });
        setTimeout(() => setLiveSale(null), 6000);
      }
    }, 18000); 

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

      {/* --- POWIADOMIENIE LIVE --- */}
      <div className={`fixed bottom-24 md:bottom-8 left-4 bg-[#1A1A1A] text-white p-4 rounded-2xl shadow-2xl z-[100] border-l-4 border-[#FFD700] transition-all duration-500 ease-out transform ${liveSale ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <p className="text-[10px] uppercase tracking-widest text-slate-400">Na żywo ze sklepu</p>
        </div>
        <p className="text-xs font-bold pr-4">{liveSale?.text}</p>
      </div>

      {/* --- 1. TOP BAR --- */}
      <div className="bg-[#1A1A1A] text-white py-2 px-4 font-bold relative z-[60] shadow-md border-b border-red-600/30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center text-center gap-3">
          <div className="flex items-center space-x-6 text-[10px] sm:text-xs uppercase tracking-[0.2em]">
            <a href="tel:+48257888900" className="flex items-center gap-2 hover:text-red-500 transition-colors group">
              <span className="text-red-600 text-sm group-hover:animate-bounce">📞</span> <span className="tabular-nums tracking-wider">25 788 89 00</span>
            </a>
            <span className="hidden md:flex items-center gap-2 text-slate-300">
              <span className="text-green-500">✓</span> Bezpieczne zakupy SSL
            </span>
          </div>
          
          <div className="flex items-center gap-2 bg-red-600/20 px-4 py-1 rounded-full border border-red-600/50 shadow-[0_0_15px_rgba(220,38,38,0.2)]">
            <span className="text-[10px] uppercase tracking-widest text-red-100 hidden md:inline">Wysyłka dziś. Zamów w:</span>
            <span suppressHydrationWarning className="text-red-500 font-black tabular-nums text-sm tracking-widest">
              ⏳ {isMounted ? `${String(timeLeft.hours).padStart(2, '0')}:${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')}` : '00:00:00'}
            </span>
          </div>

          <div className="flex items-center gap-3 bg-black/50 p-1 rounded-full border border-slate-800">
            <button className={`text-[10px] uppercase tracking-widest px-4 py-1 rounded-full transition-all ${!isNetto ? 'bg-white text-black font-black shadow-sm' : 'text-slate-400 hover:text-white'}`} onClick={() => setIsNetto(false)}>Brutto</button>
            <button className={`text-[10px] uppercase tracking-widest px-4 py-1 rounded-full transition-all ${isNetto ? 'bg-[#FFD700] text-black font-black shadow-sm' : 'text-slate-400 hover:text-white'}`} onClick={() => setIsNetto(true)}>Netto</button>
          </div>
        </div>
      </div>

      {/* --- 2. HEADER GŁÓWNY --- */}
      <header className="bg-white relative z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between gap-8">
          <div className="flex-shrink-0">
            <Link href="/" aria-label="Strona główna">
              <img src="/logo-centrumrolnictwapl-2-2.webp" alt="CentrumRolnictwa.pl" className="h-10 md:h-14 w-auto transition-transform hover:scale-105 duration-300" fetchPriority="high" />
            </Link>
          </div>

          <div className="flex-1 max-w-3xl hidden lg:block relative z-50">
            <SearchBar />
          </div>

          <nav className="flex items-center space-x-6 text-slate-800 hidden md:flex">
            <div className="hidden xl:block text-right mr-4">
               <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">
                 Brakuje <span className="text-red-600">{(freeShippingThreshold - cartValue).toFixed(2)} zł</span> do darmowej
               </p>
               <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                 <div className="h-full bg-gradient-to-r from-red-600 to-[#FFD700] transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
               </div>
            </div>

            <Link href="/konto" className="flex flex-col items-center cursor-pointer hover:text-red-600 transition-all group">
              <div className="p-2.5 bg-slate-50 rounded-full group-hover:bg-red-50 transition-colors border border-slate-100">
                 <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              </div>
              <span className="text-[9px] font-black mt-1.5 uppercase tracking-[0.1em]">Konto</span>
            </Link>
            
            <Link href="/koszyk" className="flex flex-col items-center cursor-pointer hover:text-red-600 transition-all relative group">
              <div className="p-2.5 bg-slate-50 rounded-full group-hover:bg-red-50 transition-colors relative border border-slate-100">
                 <div className="absolute -top-1 -right-2 bg-red-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg border-2 border-white group-hover:animate-bounce">2</div>
                 <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              </div>
              <span className="text-[10px] font-black mt-1.5 uppercase tracking-[0.1em]">{getDisplayPrice(cartValue)} zł</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* --- 3. MEGA MENU --- */}
      <div className="hidden lg:block bg-white relative z-40 shadow-[0_10px_20px_rgba(0,0,0,0.03)] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex items-center justify-between space-x-1 relative">
            <li className="relative">
               <Link href="/kategorie" className="flex items-center gap-2 py-3.5 px-6 font-black text-white bg-red-600 uppercase text-[11px] tracking-widest hover:bg-slate-900 transition-colors rounded-t-xl mt-1">
                 <span>☰</span> Katalog 2026
               </Link>
            </li>
            
            {MEGA_MENU_DATA.map((cat) => (
              <li key={cat.slug} className="group flex-1 text-center">
                <Link href={`/kategoria/${cat.slug}`} className="block py-4 px-2 font-bold text-slate-700 hover:text-red-600 transition-all uppercase text-[10px] xl:text-[11px] tracking-widest whitespace-nowrap">
                  <span className="mr-1.5 opacity-60 text-base align-middle">{cat.icon}</span> {cat.name}
                </Link>

                {cat.columns && cat.columns.length > 0 && (
                  <div className="absolute left-0 top-full w-full bg-white border border-slate-100 shadow-[0_30px_60px_rgba(0,0,0,0.12)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 rounded-b-3xl p-8 z-50 text-left">
                    <div className="grid grid-cols-4 gap-8">
                      {cat.columns.map(col => (
                        <div key={col.slug}>
                          <Link href={`/kategoria/${cat.slug}/${col.slug}`} className="text-red-600 font-black uppercase tracking-widest text-xs border-b-2 border-red-600/10 pb-2 mb-4 block hover:text-slate-900 transition-colors">
                            {col.title}
                          </Link>
                          <ul className="space-y-2.5">
                            {col.links.map(link => (
                              <li key={link}>
                                <Link href={`/kategoria/${cat.slug}/${col.slug}/${generateSlug(link)}`} className="text-sm font-medium text-slate-600 hover:text-red-600 hover:translate-x-1 inline-block transition-all">
                                  {link}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                      <div className="col-span-4 lg:col-span-1 lg:col-start-4 bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col justify-between">
                         <div>
                            <span className="bg-[#FFD700] text-black text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4 inline-block">Bestseller Sezonu</span>
                            <h4 className="font-black italic uppercase text-lg text-slate-900 leading-tight mb-2">Przygotuj się na żniwa</h4>
                            <p className="text-xs text-slate-500 font-medium">Sprawdź kompletne zestawy serwisowe do Twojej maszyny i zaoszczędź do 15%.</p>
                         </div>
                         <Link href={`/kategoria/${cat.slug}`} className="mt-4 text-[10px] font-black text-red-600 uppercase tracking-widest hover:underline flex items-center gap-1">
                           Przejdź do działu <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
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

      {/* --- MOBILE BOTTOM NAVIGATION --- */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 z-[70] flex justify-between items-center px-6 py-3 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] pb-safe" aria-label="Nawigacja mobilna">
        <Link href="/" className="flex flex-col items-center text-red-600">
          <svg className="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path></svg>
          <span className="text-[9px] font-black uppercase tracking-widest">Start</span>
        </Link>
        <Link href="/kategorie" className="flex flex-col items-center text-slate-400 hover:text-slate-900 transition-colors">
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          <span className="text-[9px] font-black uppercase tracking-widest">Działy</span>
        </Link>
        <Link href="/wiedza" className="flex flex-col items-center text-slate-400 hover:text-slate-900 transition-colors relative -top-5">
          <div className="bg-[#1A1A1A] w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-xl shadow-black/20 border-4 border-white transform transition-transform active:scale-95">🚜</div>
          <span className="text-[9px] font-black uppercase tracking-widest mt-1 text-slate-900">Garaż</span>
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

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* --- 4. STREFA HERO & WIRTUALNY GARAŻ --- */}
        <section className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-16">
          <nav className="hidden lg:block bg-white rounded-[40px] shadow-sm border border-slate-100 p-8 h-full">
            <h3 className="font-black border-b-2 border-red-600/10 pb-4 mb-6 text-red-600 uppercase tracking-[0.2em] text-[11px] italic">Szybki Skok</h3>
            <ul className="space-y-3">
              {MEGA_MENU_DATA.map((cat) => (
                <li key={cat.slug}>
                  <Link href={`/kategoria/${cat.slug}`} className="flex items-center gap-3 py-2 text-[13px] font-bold text-slate-700 hover:text-red-600 transition-all uppercase tracking-tighter hover:translate-x-2">
                    <span className="text-xl opacity-80">{cat.icon}</span> {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <article className="lg:col-span-2 bg-[#1A1A1A] rounded-[50px] p-8 md:p-12 flex flex-col justify-center items-start text-white relative overflow-hidden shadow-2xl group border border-slate-800">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-red-600 rounded-full blur-[140px] opacity-20 -mr-20 -mt-20 group-hover:opacity-40 transition-opacity duration-700"></div>
            
            <span className="bg-red-600/20 text-red-400 border border-red-600/50 text-[10px] font-black px-4 py-1.5 rounded-full mb-8 uppercase tracking-[0.3em] relative z-10">Zaczynamy Żniwa 2026</span>
            
            <h1 className="text-4xl md:text-6xl font-black mb-6 relative z-10 leading-[0.85] uppercase italic tracking-tighter">
              Awarie nie <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-[#FFD700]">wybaczają.</span>
            </h1>
            
            <p className="text-slate-400 mb-10 max-w-md relative z-10 text-sm md:text-base font-medium leading-relaxed italic">
              Zapewnij ciągłość pracy swojemu gospodarstwu. Zamów oryginalne części z najszybszą dostawą w Polsce. Baza 140,000+ podzespołów.
            </p>
            
            <Link href="/kategorie" className="bg-red-600 text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#FFD700] hover:text-black transition-all relative z-10 shadow-xl shadow-red-600/30 active:scale-95 flex items-center gap-3">
              Katalog Produktów <span className="text-lg transition-transform group-hover:translate-x-2">➔</span>
            </Link>
          </article>

          <aside className="lg:col-span-1">
            <VehicleGarage />
          </aside>
        </section>

        {/* --- TRUST BRANDS BAR --- */}
        <section className="mb-24 py-10 border-y border-slate-200">
           <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-40 grayscale hover:grayscale-0 transition-all duration-1000">
              {['KRAMP', 'GRANIT', 'URSUS', 'ZETOR', 'DE LAVAL', 'JOHN DEERE'].map(b => (
                <span key={b} className="text-xl md:text-3xl font-black italic tracking-tighter text-slate-400 cursor-default hover:text-slate-900 transition-colors">{b}</span>
              ))}
           </div>
        </section>

        {/* --- 5. PRODUKTY (BESTSELLERY Z SERWERA) --- */}
        <section className="mb-24">
          <div className="flex justify-between items-end mb-12 border-b-2 border-slate-100 pb-8">
            <div>
              <p className="text-red-600 font-black uppercase text-[10px] tracking-[0.3em] mb-3 flex items-center gap-2"><span className="w-2 h-2 bg-red-600 rounded-full animate-ping"></span> Najczęściej wybierane</p>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Bestsellery</h2>
            </div>
            <Link href="/kategoria/czesci-do-ciagnikow" className="text-slate-400 font-black text-[11px] hover:text-red-600 transition-colors uppercase tracking-[0.2em] mb-1 hidden sm:block">Pełna oferta ➔</Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {products.length === 0 ? (
              <p className="col-span-4 text-center font-bold text-slate-400 py-10 uppercase">Brak produktów do wyświetlenia.</p>
            ) : (
              products.map((product: any, index: number) => {
                // Rozpoznajemy obraz z obiektu lub JSON stringa (Strapi)
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
                  <article key={product.id} className="group flex flex-col bg-white border border-slate-100 rounded-[40px] p-5 hover:shadow-2xl hover:border-red-600/30 transition-all duration-300 cursor-pointer relative h-full">
                    <Link href={`/produkt/${product.slug || product.id}`} className="absolute inset-0 z-10"></Link>
                    
                    <div className="aspect-square bg-slate-50 rounded-[30px] mb-6 flex items-center justify-center overflow-hidden relative border border-slate-100">
                      {imageUrl ? (
                        <img src={imageUrl} alt={product.name} loading="lazy" className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700 mix-blend-multiply p-4" />
                      ) : (
                        <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300 font-black text-[11px] uppercase tracking-widest">Brak foto</div>
                      )}
                      
                      <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
                        {index === 0 && <span className="bg-[#FFD700] text-black text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-md">Bestseller</span>}
                        {product.price > 300 && <span className="bg-green-500 text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-md">Darmowa dostawa</span>}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 mb-3">
                      <div className="flex text-[#FFD700] text-sm">★★★★★</div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">({buyCount} szt. dziś)</span>
                    </div>

                    <div className="flex-1">
                      <h3 className="font-black text-[14px] text-slate-800 leading-tight group-hover:text-red-600 transition-colors line-clamp-2 uppercase italic tracking-tighter relative z-20">
                        <Link href={`/produkt/${product.slug || product.id}`}>{product.name}</Link>
                      </h3>
                      <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-widest">NR KAT: {product.sku || 'B/D'}</p>
                    </div>
                    
                    <div className="mt-6 flex flex-col relative z-20">
                      <div className="flex justify-between items-end mb-4">
                        <span className="text-3xl font-black text-slate-900 tabular-nums tracking-tighter">
                          {getDisplayPrice(product.price)} <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{isNetto ? 'zł netto' : 'zł brutto'}</span>
                        </span>
                      </div>
                      <button className="w-full bg-[#1A1A1A] text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] group-hover:bg-red-600 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 relative z-20">
                        Do koszyka ➔
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        {/* --- 5B. CROSS-SELLING / B2B AGRO-PARTNER --- */}
        <section className="mb-24 bg-[#1A1A1A] rounded-[40px] md:rounded-[50px] p-8 md:p-16 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl border-l-8 border-[#FFD700]">
           <div className="absolute top-0 right-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1592982537447-6f2a6a0c7c18?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
           <div className="relative z-10 max-w-2xl">
             <div className="bg-[#FFD700] text-black w-fit px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-6 shadow-md">Oferta B2B</div>
             <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter leading-none mb-6">Prowadzisz duże <br/> gospodarstwo?</h2>
             <p className="text-slate-300 font-medium text-sm md:text-lg mb-8 leading-relaxed italic">
               Załóż darmowe konto Agro-Partner na NIP. Zyskaj stały rabat <span className="text-[#FFD700] font-black">-10% na wszystko</span>, darmowe zwroty do 60 dni i priorytetową wysyłkę.
             </p>
             <button className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-white hover:text-black transition-colors shadow-xl active:scale-95">
                Dołącz do programu B2B
             </button>
           </div>
        </section>

        <KnowledgeSection />

        {/* --- 6. SEO TEXT BLOCK --- */}
        <section className="mb-12 mt-24 bg-slate-100/50 rounded-[40px] p-8 md:p-12 border border-slate-200">
          <h2 className="text-2xl font-black text-slate-900 mb-4 uppercase italic tracking-tighter">Części rolnicze najwyższej jakości - Sklep CentrumRolnictwa</h2>
          <div className="text-xs text-slate-500 leading-loose columns-1 md:columns-2 gap-12 text-justify">
            <p className="mb-4">
              Niezależnie od tego, czy prowadzisz niewielkie gospodarstwo rolne, czy zarządzasz potężnym parkiem maszynowym, szybki dostęp do niezawodnych podzespołów to fundament Twojej pracy. Oferujemy najwyższej jakości <strong>części do ciągników</strong> (Ursus, Zetor, John Deere, Massey Ferguson) oraz maszyn rolniczych, które gwarantują bezawaryjną pracę nawet w najcięższych warunkach polowych.
            </p>
            <p>
              Nasz nowoczesny sklep internetowy został zaprojektowany z myślą o maksymalnej użyteczności. Błyskawiczna wyszukiwarka, szczegółowe opisy techniczne oraz wsparcie doradców sprawiają, że znajdziesz potrzebną część w kilka sekund. Zamówienia złożone do godziny 14:00 realizujemy tego samego dnia, minimalizując ryzyko kosztownych przestojów maszyny.
            </p>
          </div>
        </section>

      </main>

      {/* --- STOPKA --- */}
      <footer className="bg-white text-slate-900 py-16 border-t border-slate-200 pb-32 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12">
          <div>
            <img src="/logo-centrumrolnictwapl-2-2.webp" alt="CentrumRolnictwa Logo" className="h-10 w-auto mb-6" loading="lazy" />
            <p className="text-[11px] font-bold text-slate-500 uppercase leading-loose tracking-widest">
              Najszybszy sklep rolniczy w Polsce. Headless E-commerce Engine 2026.
            </p>
          </div>
          <div>
             <h4 className="text-slate-900 font-black mb-6 uppercase text-[10px] tracking-[0.3em]">Nawigacja</h4>
             <ul className="space-y-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                {MEGA_MENU_DATA.slice(0, 4).map(cat => (
                  <li key={cat.slug}><Link href={`/kategoria/${cat.slug}`} className="hover:text-red-600 transition-colors">{cat.name}</Link></li>
                ))}
             </ul>
          </div>
          <div className="md:col-span-2 bg-slate-50 p-6 rounded-[30px] border border-slate-100 flex flex-col justify-center">
             <h4 className="text-slate-900 font-black mb-4 uppercase text-[10px] tracking-[0.3em]">Kontakt Infolinia (Doradztwo Techniczne)</h4>
             <a href="tel:+48257888900" className="font-black text-3xl md:text-4xl text-red-600 italic tracking-tighter tabular-nums mb-2 hover:text-red-700 transition-colors w-fit">25 788 89 00</a>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <span className="w-2 h-2 bg-green-500 rounded-full"></span> Czynne Pn - Pt: 8:00 - 16:00
             </p>
          </div>
        </div>
      </footer>
    </div>
  );
}