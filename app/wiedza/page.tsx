'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// --- MOCK DANYCH (Docelowo pobierane ze Strapi / CMS) ---
const CATEGORIES = ['Wszystkie', 'Silnik i Osprzęt', 'Hydraulika', 'Eksploatacja', 'Porady Mechanika'];

const FEATURED_ARTICLE = {
  slug: 'jak-odpowietrzyc-uklad-paliwowy-zetor-7211',
  title: 'Jak szybko odpowietrzyć układ paliwowy w Zetorze 7211? Instrukcja krok po kroku',
  excerpt: 'Ciągnik gaśnie pod obciążeniem lub nie chce odpalić po wymianie filtrów? Zobacz, jak prawidłowo odpowietrzyć pompę i filtry, unikając kosztownych błędów.',
  category: 'Porady Mechanika',
  readTime: '6 min',
  image: 'https://images.unsplash.com/photo-1592838064575-70ed626d3a0e?q=80&w=1200&auto=format&fit=crop', // Zastąp docelowym zdjęciem z warsztatu
  author: 'Michał (Główny Mechanik)',
  date: '12 Czerwca 2026'
};

const ARTICLES = [
  {
    id: 1,
    slug: 'przyczyny-opadania-podnosnika-ursus-c360',
    title: 'Dlaczego podnośnik w Ursusie C-360 opada? Diagnoza i naprawa',
    category: 'Hydraulika',
    readTime: '8 min',
    image: 'https://images.unsplash.com/photo-1605370258548-18e0018d4515?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: 2,
    slug: 'co-ile-wymieniac-olej-w-skrzyni-biegow',
    title: 'Wymiana oleju w skrzyni biegów. Kiedy to robić, by nie zatrzeć trybów?',
    category: 'Eksploatacja',
    readTime: '4 min',
    image: 'https://images.unsplash.com/photo-1610214631317-09a25b29094f?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: 3,
    slug: 'dobor-pompy-wody-do-john-deere',
    title: 'Jak dobrać pompę wody do ciągników John Deere serii 6M?',
    category: 'Silnik i Osprzęt',
    readTime: '5 min',
    image: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?q=80&w=600&auto=format&fit=crop'
  }
];

export default function KnowledgeHubPage() {
  const [activeCategory, setActiveCategory] = useState('Wszystkie');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrowanie artykułów (W przyszłości obsłuży to API Strapi)
  const filteredArticles = ARTICLES.filter(article => {
    const matchesCategory = activeCategory === 'Wszystkie' || article.category === activeCategory;
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      
      {/* 1. SEKCJA HERO - Wyszukiwarka Problemów */}
      <section className="bg-slate-900 text-white pt-20 pb-28 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600 rounded-full blur-[120px] opacity-20 -mr-20 -mt-20"></div>
        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <span className="bg-slate-800 text-red-400 font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full mb-6 inline-block border border-slate-700">
            Centrum Wiedzy i Porad
          </span>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-tight mb-6">
            Rozwiąż problem ze <br className="hidden md:block"/> <span className="text-red-600">swoją maszyną</span>
          </h1>
          <p className="text-slate-400 font-medium text-lg mb-10 max-w-2xl mx-auto">
            Baza wiedzy tworzona przez mechaników. Wpisz objawy awarii, znajdź instrukcję naprawy i dobierz odpowiednie części.
          </p>
          
          <div className="max-w-2xl mx-auto relative group">
            <div className="absolute inset-0 bg-red-600 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <div className="relative flex items-center bg-white rounded-2xl p-2 shadow-2xl">
              <span className="pl-4 text-2xl grayscale opacity-50">🛠️</span>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Np. opadający podnośnik C-360..." 
                className="w-full bg-transparent border-none focus:ring-0 px-4 py-4 text-slate-900 font-bold placeholder:text-slate-400 placeholder:font-medium outline-none"
              />
              <button className="bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[11px] px-8 py-4 rounded-xl transition-colors shrink-0">
                Szukaj porady
              </button>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 -mt-10 relative z-20">
        
        {/* 2. GŁÓWNY ARTYKUŁ (Promowany) */}
        {!searchQuery && activeCategory === 'Wszystkie' && (
          <Link href={`/wiedza/${FEATURED_ARTICLE.slug}`} className="block group mb-16">
            <div className="bg-white rounded-[32px] p-4 lg:p-6 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col lg:flex-row gap-8 items-center transition-all hover:shadow-2xl hover:border-red-100">
              <div className="w-full lg:w-3/5 h-[300px] lg:h-[400px] relative rounded-[24px] overflow-hidden shrink-0">
                <Image src={FEATURED_ARTICLE.image} alt={FEATURED_ARTICLE.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                <div className="absolute bottom-6 left-6 flex gap-2">
                  <span className="bg-red-600 text-white font-black text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-md">
                    {FEATURED_ARTICLE.category}
                  </span>
                  <span className="bg-slate-900/80 backdrop-blur-sm text-white font-black text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg">
                    ⏱ {FEATURED_ARTICLE.readTime}
                  </span>
                </div>
              </div>
              
              <div className="w-full lg:w-2/5 p-4 lg:p-0 lg:pr-8">
                <span className="text-red-600 text-2xl mb-4 block">🔥</span>
                <h2 className="text-2xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-4 group-hover:text-red-600 transition-colors">
                  {FEATURED_ARTICLE.title}
                </h2>
                <p className="text-slate-500 font-medium leading-relaxed mb-8">
                  {FEATURED_ARTICLE.excerpt}
                </p>
                <div className="flex items-center justify-between border-t border-slate-100 pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-lg">👨‍🔧</div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">{FEATURED_ARTICLE.author}</p>
                      <p className="text-[10px] font-bold text-slate-400">{FEATURED_ARTICLE.date}</p>
                    </div>
                  </div>
                  <span className="text-red-600 font-black uppercase tracking-widest text-xs hidden sm:block">Czytaj ➔</span>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* 3. NAWIGACJA KATEGORII */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">Najnowsze porady</h3>
          
          <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-2 scrollbar-hide">
            {CATEGORIES.map(category => (
              <button 
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === category ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* 4. SIATKA ARTYKUŁÓW */}
        {filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map(article => (
              <Link href={`/wiedza/${article.slug}`} key={article.id} className="group bg-white border border-slate-100 rounded-[32px] p-2 hover:shadow-xl hover:border-red-100 transition-all flex flex-col h-full">
                <div className="relative w-full aspect-[4/3] rounded-[24px] overflow-hidden mb-4">
                  <Image src={article.image} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-slate-900 font-black text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-sm">
                    {article.category}
                  </div>
                </div>
                <div className="px-4 pb-6 flex flex-col flex-1">
                  <h4 className="text-lg font-black text-slate-900 leading-snug mb-3 group-hover:text-red-600 transition-colors line-clamp-3">
                    {article.title}
                  </h4>
                  <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-50">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <span>⏱</span> {article.readTime}
                    </span>
                    <span className="text-red-600 font-black text-lg">➔</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-[32px] border border-slate-100">
            <span className="text-4xl block mb-4 grayscale opacity-40">📝</span>
            <h3 className="text-xl font-black text-slate-900 mb-2">Brak artykułów</h3>
            <p className="text-slate-500 font-medium">Nie znaleźliśmy poradników pasujących do tych kryteriów.</p>
            <button onClick={() => { setSearchQuery(''); setActiveCategory('Wszystkie'); }} className="mt-6 bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800">
              Wyczyść filtry
            </button>
          </div>
        )}
        
      </main>
    </div>
  );
}