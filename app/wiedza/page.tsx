'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function KnowledgeBase() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArticles() {
      const res = await fetch('/api/articles');
      const json = await res.json();
      setArticles(json.data);
      setLoading(false);
    }
    fetchArticles();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* NAGŁÓWEK SEKCI */}
      <header className="bg-slate-900 text-white pt-24 pb-32 px-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600 rounded-full blur-[150px] opacity-20 -mr-32 -mt-32"></div>
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <Link href="/" className="text-red-500 font-black uppercase text-[10px] tracking-[0.3em] mb-8 block hover:text-white transition-colors">← Powrót do sklepu</Link>
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter italic leading-[0.8] mb-6">
            Strefa <br/> <span className="text-red-600">Wiedzy</span>
          </h1>
          <p className="text-slate-400 text-xl font-medium max-w-2xl mx-auto">
            Praktyczne poradniki, schematy i wskazówki od ekspertów Centrum Rolnictwa. 
            Z nami naprawisz każdą maszynę.
          </p>
        </div>
      </header>

      {/* ARTYKUŁY */}
      <main className="max-w-7xl mx-auto px-6 -mt-20 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {articles.map((article: any) => (
            <Link 
              href={`/wiedza/${article.slug}`} 
              key={article.id}
              className="group bg-white rounded-[40px] overflow-hidden border border-slate-100 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 flex flex-col"
            >
              <div className="h-64 overflow-hidden relative">
                <img 
                  src={article.image} 
                  alt={article.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                />
                <div className="absolute top-6 left-6 bg-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-red-600 shadow-sm">
                  {article.category}
                </div>
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                  Opublikowano: {article.date}
                </div>
                <h2 className="text-2xl font-black text-slate-800 leading-tight mb-4 group-hover:text-red-600 transition-colors">
                  {article.title}
                </h2>
                <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8 line-clamp-3">
                  {article.excerpt}
                </p>
                <div className="mt-auto flex items-center gap-2 text-red-600 font-black uppercase text-xs tracking-widest group-hover:gap-4 transition-all">
                  Czytaj poradnik <span>→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* NEWSLETTER DLA ROLNIKÓW */}
        <section className="mt-32 bg-red-600 rounded-[60px] p-12 lg:p-20 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-[120px] opacity-10 -mr-32 -mt-32"></div>
           <div className="max-w-4xl mx-auto text-center relative z-10">
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic mb-6 leading-tight">
                Nie przegap sezonowych <br/> wskazówek i rabatów
              </h2>
              <p className="text-red-100 text-lg mb-10 font-medium">Dołącz do 5000+ rolników, którzy otrzymują nasze techniczne poradniki co tydzień.</p>
              <form className="flex flex-col md:flex-row gap-4">
                 <input 
                  type="email" 
                  placeholder="Twój adres e-mail" 
                  className="flex-1 bg-white/20 border-2 border-white/20 p-5 rounded-3xl outline-none focus:bg-white focus:text-slate-900 transition-all font-bold placeholder:text-red-100" 
                 />
                 <button className="bg-white text-red-600 px-10 py-5 rounded-3xl font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-xl">
                   Zapisz się
                 </button>
              </form>
           </div>
        </section>
      </main>
    </div>
  );
}