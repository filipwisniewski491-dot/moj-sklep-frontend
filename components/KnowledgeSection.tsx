'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function KnowledgeSection() {
  const [articles, setArticles] = useState([]);
  const [currentMarka, setCurrentMarka] = useState('Wszystkie');

  useEffect(() => {
    // Sprawdzamy co jest w garażu
    const checkGarage = () => {
      const saved = localStorage.getItem('farmer_garage');
      if (saved) {
        const { brand } = JSON.parse(saved);
        setCurrentMarka(brand);
      } else {
        setCurrentMarka('Wszystkie');
      }
    };

    checkGarage();
    // Nasłuchiwanie zmian w garażu (zdarzenie 'storage')
    window.addEventListener('storage', checkGarage);
    
    // Pobieranie artykułów
    fetch(`/api/articles?marka=${currentMarka}`)
      .then(res => res.json())
      .then(json => setArticles(json.data));

    return () => window.removeEventListener('storage', checkGarage);
  }, [currentMarka]);

  return (
    <section className="py-20">
      <div className="flex justify-between items-end mb-12">
        <div>
          <p className="text-red-600 font-black uppercase text-[10px] tracking-[0.3em] mb-2">Ekspercka wiedza</p>
          <h2 className="text-4xl font-black uppercase tracking-tighter italic">
            Porady dla <span className="text-red-600">{currentMarka === 'Wszystkie' ? 'Twojego gospodarstwa' : currentMarka}</span>
          </h2>
        </div>
        <Link href="/wiedza" className="text-slate-400 font-bold text-sm hover:text-red-600 transition-colors uppercase tracking-widest">
          Zobacz wszystkie artykuły ➔
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {articles.map((article: any) => (
          <Link href={`/wiedza/${article.slug}`} key={article.id} className="group flex flex-col">
            <div className="h-64 rounded-[40px] overflow-hidden mb-6 relative border border-slate-100">
              <img src={article.image} alt={article.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-1 rounded-full text-[10px] font-black uppercase text-red-600">
                {article.category}
              </div>
            </div>
            <h3 className="text-xl font-black text-slate-900 leading-tight mb-3 group-hover:text-red-600 transition-colors uppercase italic">
              {article.title}
            </h3>
            <p className="text-slate-500 text-sm font-medium line-clamp-2 mb-4">
              {article.excerpt}
            </p>
            <div className="mt-auto text-red-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 group-hover:gap-4 transition-all">
              Czytaj dalej <span>→</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}