'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import MegaMenu from '@/components/MegaMenu';
import MobileBottomNav from '@/components/MobileBottomNav';
import { useCart } from '@/store/useCart';

const generateSlug = (text: string) => {
  if (!text) return '';
  return text.toLowerCase()
    .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e')
    .replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o')
    .replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
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
  { 
    name: "Hodowla i zootechnika", slug: "hodowla-i-zootechnika", icon: "🐄",
    columns: [
      { title: "Wyposażenie budynków", slug: "wyposazenie-budynkow", links: ["Poidła", "Koryta", "Wygrodzenia", "Mocowania"] },
      { title: "Dój i higiena", slug: "doj-i-higiena", links: ["Dojarki", "Filtry do mleka", "Płyny myjące", "Akcesoria udojowe"] },
      { title: "Elektryzatory", slug: "elektryzatory", links: ["Urządzenia", "Izolatory", "Taśmy i plecionki", "Baterie"] },
      { title: "Pielęgnacja", slug: "pielegnacja", links: ["Korekcje racic", "Szczotki", "Maszynki", "Preparaty"] }
    ]
  }
];

export default function CatalogIndexPage() {
  const { items } = useCart();
  const [cartCount, setCartCount] = useState(0);
  const [cartValue, setCartValue] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isMounted, setIsMounted] = useState(false);
  
  // Stan dla urządzeń mobilnych - który dział jest rozwinięty
  const [openMobileCat, setOpenMobileCat] = useState<string | null>(null);

  const freeShippingThreshold = 500;
  const progressPercent = Math.min((cartValue / freeShippingThreshold) * 100, 100);

  useEffect(() => {
    setIsMounted(true);
    if (items) {
      setCartCount(items.reduce((sum: number, item: any) => sum + item.quantity, 0));
      setCartValue(items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0));
    }
  }, [items]);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const cutoff = new Date();
      cutoff.setHours(15, 0, 0, 0); 
      if (now > cutoff) cutoff.setDate(cutoff.getDate() + 1);
      const diff = cutoff.getTime() - now.getTime();
      setTimeLeft({
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, slug: string) => {
    e.preventDefault();
    const element = document.getElementById(slug);
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  const toggleMobileCategory = (slug: string) => {
    setOpenMobileCat(openMobileCat === slug ? null : slug);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 md:pb-0">
      {/* GLOBALNY HEADER - TEN SAM CO WSZĘDZIE */}
      <div className="hidden sm:block bg-slate-50 text-slate-600 py-2 px-4 font-bold relative z-[60] border-b border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-row justify-between items-center text-center gap-3">
          <div className="flex items-center space-x-6 text-xs uppercase tracking-[0.2em]">
            <a href="tel:+48257888900" className="flex items-center gap-2 hover:text-red-600 transition-colors group text-slate-800">
              <span className="text-red-600 text-sm group-hover:animate-bounce">📞</span> <span className="tabular-nums tracking-wider">25 788 89 00</span>
            </a>
            <span className="hidden md:flex items-center gap-2 text-slate-500">
              <span className="text-emerald-500">✓</span> Ekspercki Dobór Części
            </span>
          </div>
          <div className="flex items-center gap-2 bg-red-50 px-4 py-1 rounded-full border border-red-100 text-red-800">
            <span className="text-[10px] uppercase tracking-widest hidden md:inline">Wysyłamy dzisiaj. Zamów w:</span>
            <span suppressHydrationWarning className="text-red-600 font-black tabular-nums text-sm tracking-widest">
              ⏳ {isMounted ? `${String(timeLeft.hours).padStart(2, '0')}:${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')}` : '00:00:00'}
            </span>
          </div>
        </div>
      </div>

      <header className="bg-white relative z-50 shadow-sm border-b border-slate-100 py-3 md:py-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-row items-center justify-between gap-3 md:gap-8">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" aria-label="CentrumRolnictwa.pl - Strona Główna">
              <img src="https://centrumrolnictwa-cdn.b-cdn.net/logo/logo-centrumrolnictwapl-2-1.jpeg" alt="CentrumRolnictwa.pl" className="h-10 sm:h-14 md:h-20 w-auto transition-transform hover:scale-105 duration-300" fetchPriority="high" />
            </Link>
          </div>
          <div className="flex-1 w-full relative z-50">
             <SearchBar />
          </div>
          <nav className="hidden md:flex items-center space-x-6 text-slate-800">
            <div className="hidden xl:block text-right mr-4">
               <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">
                 Do darmowej: <span className="text-red-600 font-black">{Math.max(0, freeShippingThreshold - cartValue).toFixed(2)} zł</span>
               </p>
               <div className="w-40 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                 <div className="h-full bg-red-600 transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
               </div>
            </div>
            <Link href="/konto" aria-label="Twoje Konto" className="flex flex-col items-center cursor-pointer hover:text-red-600 transition-all group">
              <div className="p-3 bg-slate-50 rounded-full group-hover:bg-red-50 transition-colors border border-slate-200">
                 <svg className="w-5 h-5 transition-transform text-slate-600 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              </div>
              <span className="text-[9px] font-black mt-1.5 uppercase tracking-widest text-slate-500">Konto</span>
            </Link>
          </nav>
        </div>
      </header>

      <MegaMenu />

      <div className="bg-slate-900 border-b-4 border-red-600 py-10 md:py-14 relative z-10 px-4 overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-red-600 rounded-full blur-[120px] opacity-20 -mr-20 -mt-20"></div>
        <div className="max-w-7xl mx-auto relative z-10">
           <nav className="flex text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 gap-2 items-center" aria-label="Breadcrumb">
             <Link href="/" className="hover:text-red-500 transition-colors p-1">Start</Link>
             <span className="text-slate-600">/</span>
             <span className="text-white">Katalog Działów</span>
           </nav>
           <h1 className="text-3xl md:text-5xl lg:text-6xl font-black uppercase text-white tracking-tight mb-4">Wybierz odpowiedni dział</h1>
           <p className="text-slate-400 font-bold max-w-2xl text-sm md:text-base leading-relaxed">
             Nasza struktura została zaprojektowana tak, abyś szybko dotarł do konkretnych podzespołów. Wykorzystaj boczne menu, aby błyskawicznie przeskakiwać między kategoriami.
           </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8 md:py-16 relative z-10">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-12 items-start">
           
           {/* STICKY SIDEBAR (Nawigacja boczna Top B2B - WIDOCZNA TYLKO NA DESKTOP) */}
           <aside className="w-full lg:w-1/4 shrink-0 lg:sticky lg:top-8 hidden lg:block">
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                 <h3 className="font-black uppercase tracking-widest text-slate-900 text-xs mb-6 border-b border-slate-100 pb-4">
                   Struktura Kategorii
                 </h3>
                 <ul className="space-y-2">
                   {MEGA_MENU_DATA.map(cat => (
                     <li key={cat.slug}>
                        <a 
                          href={`#${cat.slug}`} 
                          onClick={(e) => scrollToSection(e, cat.slug)}
                          className="flex items-center gap-3 text-slate-500 hover:text-red-600 font-bold text-[13px] uppercase tracking-wide transition-all p-3 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-100 group"
                        >
                          <span className="text-lg group-hover:scale-110 transition-transform grayscale group-hover:grayscale-0">{cat.icon}</span> 
                          <span>{cat.name}</span>
                        </a>
                     </li>
                   ))}
                 </ul>
              </div>
           </aside>

           {/* GŁÓWNA SIATKA (Katalog Kaskadowy / Akordeon na Mobile) */}
           <div className="w-full lg:w-3/4 flex flex-col gap-4 lg:gap-12">
              {MEGA_MENU_DATA.map((cat) => {
                const isOpenOnMobile = openMobileCat === cat.slug;
                
                return (
                  <section key={cat.slug} id={cat.slug} className="scroll-mt-8 bg-white rounded-[24px] lg:rounded-[40px] border border-slate-100 shadow-sm overflow-hidden transition-all duration-300">
                     
                     {/* NAGŁÓWEK KATEGORII (Klikalny na Mobile) */}
                     <div 
                        className={`bg-slate-50 p-4 md:p-8 flex items-center justify-between gap-4 border-slate-100 cursor-pointer lg:cursor-default transition-colors ${isOpenOnMobile ? 'border-b bg-red-50/30' : ''}`}
                        onClick={() => toggleMobileCategory(cat.slug)}
                     >
                        <div className="flex items-center gap-3 md:gap-4 flex-1">
                          <div className={`w-12 h-12 md:w-16 md:h-16 border shadow-sm rounded-xl md:rounded-2xl flex items-center justify-center text-2xl md:text-3xl transition-colors ${isOpenOnMobile ? 'bg-red-600 border-red-700 text-white grayscale-0' : 'bg-white border-slate-200 grayscale'}`}>
                            {cat.icon}
                          </div>
                          <h2 className={`text-lg md:text-2xl font-black uppercase tracking-tight flex-1 ${isOpenOnMobile ? 'text-red-700' : 'text-slate-900'}`}>{cat.name}</h2>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {/* Przycisk widoczny tylko na Desktop */}
                          <Link href={`/kategoria/${cat.slug}`} className="hidden lg:block bg-slate-900 text-white px-6 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors shadow-md text-center">
                            Otwórz ten dział ➔
                          </Link>
                          {/* Ikona rozwijania widoczna tylko na Mobile */}
                          <div className={`lg:hidden w-10 h-10 rounded-full flex items-center justify-center border shadow-sm transition-transform duration-300 ${isOpenOnMobile ? 'bg-red-100 border-red-200 text-red-600 rotate-180' : 'bg-white border-slate-200 text-slate-400'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
                          </div>
                        </div>
                     </div>

                     {/* ZAWARTOŚĆ PODKATEGORII (Akordeon Mobile / Zawsze otwarte na Desktop) */}
                     <div className={`p-4 md:p-8 animate-in fade-in slide-in-from-top-4 duration-300 ${isOpenOnMobile ? 'block' : 'hidden lg:block'}`}>
                        
                        {/* Główny link mobilny przeniesiony na samą górę sekcji, dla wygody kciuka */}
                        <Link href={`/kategoria/${cat.slug}`} className="lg:hidden w-full mb-8 bg-slate-900 text-white px-6 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors shadow-lg flex items-center justify-center gap-2 active:scale-95">
                          Przeglądaj wszystkie z {cat.name} ➔
                        </Link>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                          {cat.columns?.map(col => (
                            <div key={col.slug}>
                               <Link href={`/kategoria/${cat.slug}/${col.slug}`} className="text-red-600 font-black uppercase tracking-widest text-[11px] lg:text-[12px] mb-4 block hover:text-slate-900 border-b-2 border-red-100 w-fit pb-1.5 transition-colors">
                                 {col.title}
                               </Link>
                               <ul className="space-y-3 lg:space-y-4">
                                 {col.links.map(link => (
                                   <li key={link}>
                                     <Link href={`/kategoria/${cat.slug}/${col.slug}/${generateSlug(link)}`} className="text-sm font-bold text-slate-600 hover:text-red-600 hover:translate-x-1.5 transition-transform flex items-center gap-3 group py-1">
                                       <span className="w-1.5 h-1.5 bg-slate-200 rounded-full group-hover:bg-red-600 transition-colors"></span>
                                       {link}
                                     </Link>
                                   </li>
                                 ))}
                               </ul>
                            </div>
                          ))}
                        </div>
                     </div>

                  </section>
                )
              })}
           </div>
        </div>
      </main>

      <MobileBottomNav />

      <footer className="bg-slate-900 text-white py-16 border-t-4 border-red-600 pb-32 md:pb-16 mt-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12">
          <div>
            <img src="https://centrumrolnictwa-cdn.b-cdn.net/logo/logo-centrumrolnictwapl-2-1.jpeg" alt="CentrumRolnictwa Logo" className="h-10 w-auto mb-6 brightness-0 invert" loading="lazy" />
            <p className="text-[10px] font-bold text-slate-400 uppercase leading-loose tracking-widest">
              Niezawodny Sklep Rolniczy.<br/> Części, maszyny, doradztwo.
            </p>
          </div>
          <div>
             <h4 className="text-white font-black mb-6 uppercase text-[11px] tracking-widest">Sklep</h4>
             <ul className="space-y-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {MEGA_MENU_DATA.slice(0, 4).map(cat => (
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