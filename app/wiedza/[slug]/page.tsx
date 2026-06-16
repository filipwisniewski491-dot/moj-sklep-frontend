'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/store/useCart';

// --- MOCK DANYCH: Przykładowy artykuł prosto z CMS ---
const MOCK_ARTICLE = {
  title: 'Jak szybko odpowietrzyć układ paliwowy w Zetorze 7211?',
  category: 'Porady Mechanika',
  readTime: '6 min',
  author: 'Michał (Główny Mechanik)',
  date: '12 Czerwca 2026',
  image: 'https://images.unsplash.com/photo-1592838064575-70ed626d3a0e?q=80&w=1200&auto=format&fit=crop',
  // Zwróć uwagę na tagi [PRODUKT:SKU] wplecione w treść HTML!
  content: `
    <h2 id="objawy">1. Objawy zapowietrzonego układu paliwowego</h2>
    <p>Jeżeli Twój Zetor 7211 zaczyna przerywać pod obciążeniem, gaśnie na wolnych obrotach lub w ogóle nie chce odpalić po wymianie filtrów paliwa, na 99% masz zapowietrzony układ. Zanim wezwiesz serwis, możesz rozwiązać ten problem samodzielnie w 15 minut.</p>
    <p>Najczęstszą przyczyną zapowietrzania są zużyte uszczelki odstojnika lub pęknięte przewody paliwowe. Warto zacząć od wymiany filtrów na nowe.</p>
    
    [PRODUKT:FILTR-ZET-7211]

    <h2 id="przygotowanie">2. Przygotowanie do odpowietrzania</h2>
    <p>Upewnij się, że w baku jest odpowiednia ilość paliwa (minimum 1/4 zbiornika) i kranik jest otwarty. Oczyść okolice pompy zasilającej i wtryskowej z błota i smaru, aby zanieczyszczenia nie dostały się do wnętrza układu precyzyjnego.</p>
    
    <h2 id="krok-po-kroku">3. Procedura krok po kroku</h2>
    <p>Zacznij od poluzowania śruby odpowietrzającej na pierwszym (wstępnym) filtrze paliwa. Następnie użyj ręcznej pompki zasilającej. Pompuj tak długo, aż z pod gwintu śruby zacznie wypływać czyste paliwo bez pęcherzyków powietrza.</p>
    <p><strong>Wskazówka mechanika:</strong> Jeśli ręczna pompka nie stawia oporu, prawdopodobnie uszkodzone są w niej zaworki zwrotne. To bardzo częsta usterka w Zetorach, która uniemożliwia odpowietrzenie. Wymiana pompki to koszt zaledwie kilkudziesięciu złotych, a oszczędza mnóstwo nerwów.</p>

    [PRODUKT:POMPA-ZAS-ZET]

    <h2 id="finalizacja">4. Uruchomienie silnika</h2>
    <p>Gdy filtry i pompa wtryskowa są odpowietrzone (paliwo leci czystym strumieniem), dokręć wszystkie śruby z wyczuciem, aby nie zerwać gwintów. Uruchom rozrusznik. Silnik powinien "załapać" po kilku sekundach. Pozwól mu popracować na wyższych obrotach przez 2-3 minuty, aby resztki powietrza samoczynnie uszły powrotem do zbiornika.</p>
  `,
  toc: [
    { id: 'objawy', title: '1. Objawy zapowietrzonego układu' },
    { id: 'przygotowanie', title: '2. Przygotowanie do pracy' },
    { id: 'krok-po-kroku', title: '3. Procedura krok po kroku' },
    { id: 'finalizacja', title: '4. Uruchomienie silnika' }
  ]
};

// --- KOMPONENT WSTRZYKIWANEGO PRODUKTU ---
// Ten komponent pojawia się w miejscu tagu [PRODUKT:SKU]
const EmbeddedProduct = ({ sku }: { sku: string }) => {
  const { addItem, setIsOpen } = useCart();
  
  // W docelowej architekturze tu uderzasz do API: const product = fetchProductBySku(sku)
  // MOCKujemy bazę dla prezentacji:
  const mockProductDb: Record<string, any> = {
    'FILTR-ZET-7211': { name: 'Komplet Filtrów Paliwa Zetor 7211', price: 45.00, image: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?q=80&w=150' },
    'POMPA-ZAS-ZET': { name: 'Ręczna Pompka Zasilająca Paliwa Zetor', price: 89.50, image: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?q=80&w=150' }
  };
  
  const product = mockProductDb[sku];
  if (!product) return null;

  return (
    <div className="my-8 bg-white border-2 border-red-100 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-6 shadow-xl shadow-red-900/5 group">
      <div className="w-24 h-24 bg-slate-50 rounded-2xl p-2 shrink-0 border border-slate-100 overflow-hidden">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover mix-blend-multiply group-hover:scale-110 transition-transform" />
      </div>
      <div className="flex-1 text-center sm:text-left">
        <span className="bg-red-100 text-red-800 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest mb-2 inline-block">Rekomendowane do naprawy</span>
        <h4 className="text-lg font-black text-slate-900 leading-tight mb-1">{product.name}</h4>
        <p className="text-2xl font-black text-red-600 tracking-tighter">{product.price.toFixed(2)} <span className="text-sm font-bold text-slate-400">zł</span></p>
      </div>
      <button 
        onClick={() => {
          addItem({ id: sku, name: product.name, price: product.price, image: product.image, quantity: 1, crossSell: [], category: 'Wiedza' });
          setIsOpen(true);
        }}
        className="w-full sm:w-auto bg-slate-900 text-white px-8 py-4 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-red-600 transition-colors shadow-md active:scale-95 shrink-0"
      >
        Dodaj do koszyka ➔
      </button>
    </div>
  );
};


export default function ArticlePage() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeHeading, setActiveHeading] = useState('');

  // Pasek postępu czytania i nasłuchiwanie aktywnych nagłówków
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      const scrolled = window.scrollY;
      setScrollProgress((scrolled / documentHeight) * 100);

      // ScrollSpy do spisu treści
      const headingElements = MOCK_ARTICLE.toc.map(item => document.getElementById(item.id)).filter(Boolean);
      for (let i = headingElements.length - 1; i >= 0; i--) {
        const element = headingElements[i];
        if (element && element.getBoundingClientRect().top <= 150) {
          setActiveHeading(element.id);
          break;
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- PARSER CONTENT COMMERCE ---
  // Ta funkcja rozbija surowy HTML z CMSa na części i wstrzykuje komponenty Reacta
  const renderContentWithProducts = (htmlContent: string) => {
    const parts = htmlContent.split(/(\[PRODUKT:[a-zA-Z0-9-]+\])/g);
    
    return parts.map((part, index) => {
      const match = part.match(/\[PRODUKT:([a-zA-Z0-9-]+)\]/);
      if (match) {
        return <EmbeddedProduct key={index} sku={match[1]} />;
      }
      return <div key={index} dangerouslySetInnerHTML={{ __html: part }} className="article-html-block" />;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 relative">
      
      {/* Pasek postępu czytania na samej górze okna */}
      <div className="fixed top-0 left-0 h-1.5 bg-slate-200 w-full z-[100]">
        <div className="h-full bg-red-600 transition-all duration-150 ease-out" style={{ width: `${scrollProgress}%` }}></div>
      </div>

      {/* Hero Artykułu */}
      <section className="bg-slate-900 text-white pt-12 pb-24 px-4 relative">
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <Link href="/wiedza" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors mb-8 inline-block">
            ← Wróć do bazy wiedzy
          </Link>
          <div className="mb-4">
            <span className="bg-red-600 text-white font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-lg shadow-md">
              {MOCK_ARTICLE.category}
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-tight mb-8">
            {MOCK_ARTICLE.title}
          </h1>
          <div className="flex items-center justify-center gap-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <span className="flex items-center gap-2"><span className="text-xl grayscale">👨‍🔧</span> {MOCK_ARTICLE.author}</span>
            <span>•</span>
            <span>{MOCK_ARTICLE.date}</span>
            <span>•</span>
            <span className="text-emerald-400">Czas: {MOCK_ARTICLE.readTime}</span>
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 -mt-12 relative z-20">
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
          
          {/* Główne zdjęcie artykułu */}
          <div className="w-full h-[300px] md:h-[450px] relative">
            <Image src={MOCK_ARTICLE.image} alt={MOCK_ARTICLE.title} fill className="object-cover" priority />
          </div>

          <div className="p-8 md:p-12 lg:p-16 flex flex-col lg:flex-row gap-12 lg:gap-20 items-start relative">
            
            {/* Lewa kolumna - Treść z wstrzykniętymi produktami */}
            <article className="w-full lg:w-2/3 prose prose-lg prose-slate prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter prose-headings:text-slate-900 prose-p:font-medium prose-p:text-slate-600 prose-p:leading-relaxed prose-a:text-red-600 max-w-none">
              {renderContentWithProducts(MOCK_ARTICLE.content)}
              
              <div className="mt-12 pt-8 border-t border-slate-100">
                <p className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Udostępnij poradnik</p>
                <div className="flex gap-2">
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors">Facebook</button>
                  <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Skopiowano link!'); }} className="bg-slate-100 text-slate-800 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors">Kopiuj Link</button>
                </div>
              </div>
            </article>

            {/* Prawa kolumna - Pływający spis treści (TOC) */}
            <aside className="w-full lg:w-1/3 hidden lg:block relative h-full">
              <div className="sticky top-32 bg-slate-50 border border-slate-100 rounded-[32px] p-8 shadow-inner">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 border-b border-slate-200 pb-4">
                  Spis treści
                </h3>
                <nav className="flex flex-col gap-3">
                  {MOCK_ARTICLE.toc.map((item) => (
                    <a 
                      key={item.id} 
                      href={`#${item.id}`}
                      className={`text-xs font-bold uppercase tracking-tight transition-all duration-300 ${activeHeading === item.id ? 'text-red-600 translate-x-2' : 'text-slate-500 hover:text-slate-900'}`}
                      onClick={(e) => {
                        e.preventDefault();
                        const element = document.getElementById(item.id);
                        if (element) {
                          const yOffset = -120; 
                          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                          window.scrollTo({ top: y, behavior: 'smooth' });
                        }
                      }}
                    >
                      {item.title}
                    </a>
                  ))}
                </nav>
                
                <div className="mt-10 bg-slate-900 text-white p-6 rounded-2xl relative overflow-hidden group">
                  <div className="absolute -right-10 -top-10 w-32 h-32 bg-red-600 rounded-full blur-[40px] opacity-20"></div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest mb-2 relative z-10">Potrzebujesz pomocy?</h4>
                  <p className="text-xs font-medium text-slate-400 mb-4 relative z-10">Nasi eksperci pomogą Ci dobrać części do tej naprawy.</p>
                  <a href="tel:+48500600700" className="inline-block bg-white text-slate-900 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-colors relative z-10">
                    Zadzwoń: 500 600 700
                  </a>
                </div>
              </div>
            </aside>

          </div>
        </div>
      </main>
    </div>
  );
}