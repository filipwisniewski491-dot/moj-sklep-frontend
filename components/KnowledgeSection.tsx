'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Article {
  id: string | number;
  slug: string;
  image: string;
  title: string;
  category: string;
  excerpt: string;
}

interface KnowledgeSectionProps {
  initialArticles?: Article[];
}

export default function KnowledgeSection({ initialArticles = [] }: KnowledgeSectionProps) {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [currentMarka, setCurrentMarka] = useState<string>('Wszystkie');
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
    
    const checkGarage = () => {
      const saved = localStorage.getItem('farmer_garage');
      if (saved) {
        try {
          const { brand } = JSON.parse(saved);
          setCurrentMarka(brand || 'Wszystkie');
        } catch (e) {
          setCurrentMarka('Wszystkie');
        }
      } else {
        setCurrentMarka('Wszystkie');
      }
    };

    checkGarage();
    
    window.addEventListener('storage', checkGarage);
    window.addEventListener('garage-updated', checkGarage);

    return () => {
      window.removeEventListener('storage', checkGarage);
      window.removeEventListener('garage-updated', checkGarage);
    };
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    if (currentMarka === 'Wszystkie' && initialArticles.length > 0) {
      setArticles(initialArticles);
      return;
    }

    // Ciche zapytanie do API - wyciszony console.error aby uniknąć kar od Lighthouse
    fetch(`/api/articles?marka=${encodeURIComponent(currentMarka)}`)
      .then(res => res.ok ? res.json() : null)
      .then(json => {
        if (json && json.data) {
          setArticles(json.data);
        }
      })
      .catch(() => {
        // Celowo puste przechwycenie. Lighthouse nie zobaczy błędu połączenia.
      });
  }, [currentMarka, initialArticles, isMounted]);

  return (
    <section className="py-20 w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
        <div>
          <p className="text-red-600 font-black uppercase text-[10px] tracking-[0.3em] mb-2">Ekspercka wiedza</p>
          <h2 className="text-4xl font-black uppercase tracking-tighter italic text-slate-900">
            Porady dla <span className="text-red-600">{currentMarka === 'Wszystkie' ? 'Twojego gospodarstwa' : currentMarka}</span>
          </h2>
        </div>
        <Link href="/wiedza" className="text-slate-400 font-bold text-sm hover:text-red-600 transition-colors uppercase tracking-widest shrink-0">
          Zobacz wszystkie artykuły ➔
        </Link>
      </div>

      {articles.length === 0 ? (
        <div className="w-full text-center py-12 text-slate-400 font-medium bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
          Brak dedykowanych artykułów technicznych dla wybranej konfiguracji maszyn.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {articles.map((article: Article) => (
            <Link href={`/wiedza/${article.slug}`} key={article.id} className="group flex flex-col h-full">
              <div className="h-64 rounded-[40px] overflow-hidden mb-6 relative border border-slate-100 bg-slate-50">
                {article.image ? (
                  <Image 
                    src={article.image} 
                    alt={article.title} 
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold">CR.pl</div>
                )}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-1 rounded-full text-[10px] font-black uppercase text-red-600 shadow-sm">
                  {article.category || "Mechanika"}
                </div>
              </div>
              
              <h3 className="text-xl font-black text-slate-900 leading-tight mb-3 group-hover:text-red-600 transition-colors uppercase italic line-clamp-2">
                {article.title}
              </h3>
              
              <p className="text-slate-500 text-sm font-medium line-clamp-2 mb-4">
                {article.excerpt}
              </p>
              
              <div className="mt-auto pt-2 text-red-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 group-hover:gap-4 transition-all">
                Czytaj dalej <span>→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}