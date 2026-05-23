'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image'; 
import { useCart } from '@/store/useCart';
import { useParams, useRouter } from 'next/navigation';

const bunnyLoader = ({ src, width }: { src: string; width: number }) => {
  if (!src.includes('b-cdn.net')) return src;
  const cleanSrc = src.split('?')[0]; 
  return `${cleanSrc}?width=${width}&format=webp`;
};

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

export default function ProductPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImgIdx, setSelectedImgIdx] = useState(0); 
  const [showSticky, setShowSticky] = useState(false);
  const [countdownText, setCountdownText] = useState('');
  const [cartCount, setCartCount] = useState(0);

  const mainBuyButtonRef = useRef<HTMLButtonElement>(null);
  const { addItem, setIsOpen, items } = useCart() as any;

  useEffect(() => {
    if (items) {
      const total = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
      setCartCount(total);
    }
  }, [items]);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const target = new Date();
      target.setHours(14, 0, 0, 0);
      if (now.getHours() >= 14) target.setDate(target.getDate() + 1);

      const diff = target.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (now.getHours() < 14) {
        setCountdownText(`Zamów w ciągu ${hours} godz. ${minutes} min, a wyślemy JESZCZE DZISIAJ!`);
      } else {
        setCountdownText(`Wysyłka JUTRO RANO. Do kolejnego odlotu kuriera: ${hours} godz. ${minutes} min`);
      }
    };
    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/search?id=${id}`); 
        const json = await res.json();
        setProduct(json.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchProduct();
  }, [id]);

  useEffect(() => {
    const handleScroll = () => {
      if (mainBuyButtonRef.current) {
        const rect = mainBuyButtonRef.current.getBoundingClientRect();
        setShowSticky(rect.bottom < 0);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [product]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
      <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Ładowanie...</p>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center py-20 font-black text-2xl uppercase text-slate-800">PRODUKT NIE ISTNIEJE</div>
    </div>
  );

  let cdnImages: string[] = [];
  if (product.external_images) {
    if (Array.isArray(product.external_images)) cdnImages = product.external_images;
    else if (typeof product.external_images === 'string') {
      try { cdnImages = JSON.parse(product.external_images); } catch (e) {}
    }
  }

  const fallbackImages = (product.images || []).map((img: any) => img?.url_standard || img?.url || img?.src).filter(Boolean);
  const displayImages = cdnImages.length > 0 ? cdnImages : fallbackImages;
  const mainImageUrl = displayImages[selectedImgIdx] || null;

  const seoDescription = product.seo_description || product.description || '';
  const symptoms = product.symptoms;
  const expertAdvice = product.expert_advice;
  let faq = typeof product.faq === 'string' ? JSON.parse(product.faq || '[]') : product.faq || [];
  let attributes = typeof product.attributes === 'string' ? JSON.parse(product.attributes || '{}') : product.attributes || {};

  let breadcrumbPath: string[] = [];
  if (product.category_text) {
    breadcrumbPath = product.category_text.split('>').map((s: string) => s.trim()).filter(Boolean);
  } else {
    breadcrumbPath = ["Kategoria"];
  }

  const handleAddToCartMain = () => {
    addItem({ 
      id: product.id, 
      name: product.name, 
      price: product.price, 
      image: mainImageUrl || '', 
      quantity: 1,
      crossSell: product.crossSell || [], 
      category: product.category || '' 
    });
    setIsOpen(true); 
  };

  const numPrice = typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0;
  const [mainPrice, centsPrice] = numPrice.toFixed(2).split('.');
  const hasCents = centsPrice !== '00';

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": displayImages,
    "description": seoDescription.replace(/<[^>]*>?/gm, '') || product.name,
    "sku": product.sku,
    "offers": {
      "@type": "Offer",
      "url": typeof window !== 'undefined' ? window.location.href : '',
      "priceCurrency": "PLN",
      "price": numPrice.toFixed(2),
      "availability": "https://schema.org/InStock",
      "itemCondition": "https://schema.org/NewCondition"
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 relative">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      
      <header className="border-b py-4 px-6 bg-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center w-full">
          <Link href="/" className="text-red-600 font-black flex items-center gap-2 hover:translate-x-[-4px] transition-transform uppercase text-[10px] tracking-widest">
            ← WRÓĆ DO SKLEPU
          </Link>
          <div className="font-black text-xl tracking-tighter">CentrumRolnictwa<span className="text-slate-400">.pl</span></div>
          
          <button onClick={() => setIsOpen(true)} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors relative">
             <span className="text-xl">🛒</span>
             {cartCount > 0 && (
               <span className="absolute -top-1 -right-1 bg-red-600 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse shadow-md shadow-red-600/30">
                 {cartCount}
               </span>
             )}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        
        <nav className="flex flex-wrap items-center text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 gap-2" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-red-600 transition-colors">Start</Link>
          {breadcrumbPath.map((cat, idx) => {
            const pathSlugs = breadcrumbPath.slice(0, idx + 1).map(c => generateSlug(c));
            const href = `/kategoria/${pathSlugs.join('/')}`;
            
            return (
              <React.Fragment key={idx}>
                <span className="text-slate-300">/</span>
                <Link href={href} className="hover:text-red-600 transition-colors">{cat}</Link>
              </React.Fragment>
            );
          })}
          <span className="hidden md:inline text-slate-300">/</span>
          <span className="hidden md:inline text-slate-900 truncate max-w-xs">{product.name}</span>
        </nav>

        <div className="bg-white rounded-[32px] p-6 lg:p-12 shadow-sm border border-slate-100 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          
          <div className="flex flex-col gap-4">
            <div className="bg-slate-50 rounded-2xl p-8 flex items-center justify-center border border-slate-100 shadow-inner aspect-square relative overflow-hidden group">
               {mainImageUrl ? (
                 <div className="relative w-full h-full min-h-[300px]">
                   <Image loader={bunnyLoader} src={mainImageUrl} alt={product.name} fill priority={true} sizes="(max-width: 768px) 100vw, 50vw" className="object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" />
                 </div>
               ) : ( <div className="font-black text-slate-200 text-xl uppercase tracking-widest text-center">BRAK ZDJĘCIA</div> )}
            </div>
            {displayImages.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {displayImages.map((imgUrl: string, idx: number) => (
                  <button key={idx} onClick={() => setSelectedImgIdx(idx)} className={`relative flex-shrink-0 w-24 h-24 rounded-xl p-2 border-2 transition-all overflow-hidden ${selectedImgIdx === idx ? 'border-red-600 bg-white shadow-md' : 'border-transparent bg-slate-50 hover:bg-slate-100'}`}>
                    <Image loader={bunnyLoader} src={imgUrl} alt="detal" fill sizes="96px" className="object-contain mix-blend-multiply p-2" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col h-full justify-center">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4 border-b border-slate-100 pb-4">
              <div className="flex gap-2">
                <span className="bg-green-100 text-green-700 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">W Magazynie (24h)</span>
                <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">SKU: {product.sku}</span>
              </div>
              <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-100">
                <div className="flex text-yellow-500 text-xs">★★★★★</div>
                <span className="text-[10px] font-bold text-yellow-700 uppercase tracking-widest">4.8/5.0</span>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 leading-tight mb-6 tracking-tight">{product.name}</h1>

            <div className="bg-red-50 text-red-900 p-5 rounded-2xl mb-8 border-2 border-red-200 flex items-start gap-4 shadow-sm relative overflow-hidden">
               <div className="text-3xl mt-1">⏱️</div>
               <div>
                  <p className="text-xs font-black uppercase tracking-widest mb-1 text-red-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                    Ekspresowa Realizacja
                  </p>
                  <p className="text-sm font-black leading-tight text-slate-800">{countdownText}</p>
               </div>
            </div>

            <div className="mb-8">
               <div className="flex items-baseline gap-1 mb-1">
                 <span className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter">{mainPrice}</span>
                 {hasCents && <span className="text-3xl font-bold text-slate-400">.{centsPrice}</span>}
                 <span className="text-2xl font-bold text-slate-400 ml-1">zł</span>
               </div>
               <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Cena brutto (VAT 23%)</p>
            </div>

            <button ref={mainBuyButtonRef} onClick={handleAddToCartMain} className="w-full bg-red-600 text-white py-6 rounded-2xl font-black text-lg uppercase tracking-widest hover:bg-red-700 transition-all hover:scale-[1.01] active:scale-95 shadow-xl shadow-red-600/20 flex items-center justify-center gap-3">
               <span>DODAJ DO KOSZYKA ➔</span>
            </button>

            <div className="mt-6 bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-5 shadow-sm relative overflow-hidden group">
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-slate-100 shadow-sm shrink-0">
                <Image src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=150&auto=format&fit=crop" alt="Doradca Maciek" fill className="object-cover" unoptimized />
              </div>
              <div className="flex-1">
                <p className="font-black uppercase text-[10px] text-red-600 tracking-widest mb-0.5">Twój opiekun techniczny</p>
                <p className="font-bold text-slate-800 text-sm leading-tight mb-1">Chcesz upewnić się, czy część pasuje?</p>
                <a href="tel:+48500600700" className="inline-flex items-center gap-2 font-black text-white bg-green-500 hover:bg-green-600 shadow-md shadow-green-500/20 px-4 py-2 rounded-xl mt-1 text-xs uppercase tracking-widest transition-colors">
                  📞 +48 500 600 700
                </a>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <span>🔒 Bezpieczne płatności</span>
              <span className="text-slate-300">•</span>
              <span>💳 BLIK / PayU</span>
              <span className="text-slate-300">•</span>
              <span>🔄 14 dni na zwrot</span>
            </div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-8">
            {seoDescription && (
              <div className="bg-white rounded-[32px] p-8 lg:p-12 shadow-sm border border-slate-100">
                <h2 className="text-lg font-black mb-8 uppercase tracking-widest border-l-4 border-red-600 pl-4">Opis i specyfikacja</h2>
                <div className="prose prose-slate prose-base max-w-none text-slate-600 font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: seoDescription }} />
              </div>
            )}

            {Object.keys(attributes).length > 0 && (
              <div className="bg-white rounded-[32px] p-8 lg:p-12 shadow-sm border border-slate-100">
                <h2 className="text-lg font-black mb-6 uppercase tracking-widest border-l-4 border-slate-900 pl-4">Parametry Techniczne</h2>
                <div className="border border-slate-100 rounded-xl overflow-hidden shadow-inner">
                  <table className="w-full text-left text-sm border-collapse">
                    <tbody>
                      {Object.entries(attributes).map(([key, value], idx) => (
                        <tr key={key} className={`border-b border-slate-100 last:border-none transition-colors ${idx % 2 === 0 ? 'bg-slate-50/40' : 'bg-white'}`}>
                          <td className="p-4 text-slate-400 text-[10px] font-black uppercase tracking-widest w-1/3 border-r border-slate-100/60">{key}</td>
                          <td className="p-4 font-bold text-slate-900 text-sm">{String(value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-8">
            {symptoms && (
              <div className="bg-[#FFF4ED] rounded-[32px] p-8 border border-orange-100">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-orange-600 mb-4 flex items-center gap-2"><span>🔎</span> Diagnostyka / Porady</h3>
                <p className="text-orange-900 font-medium leading-relaxed text-sm">{symptoms}</p>
              </div>
            )}
            {expertAdvice && (
              <div className="bg-slate-900 rounded-[32px] p-8 shadow-xl">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-4 flex items-center gap-2"><span>💡</span> Okiem Eksperta</h3>
                <p className="text-slate-300 font-medium leading-relaxed text-sm">{expertAdvice}</p>
              </div>
            )}
            {faq && faq.length > 0 && (
              <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900 mb-6 border-l-4 border-red-600 pl-4">Pytania i odpowiedzi</h3>
                <div className="space-y-4">
                  {faq.map((item: any, index: number) => (
                    <div key={index} className="bg-slate-50 p-5 rounded-xl">
                      <h4 className="font-bold text-slate-900 mb-2 text-xs uppercase tracking-tight">{item.question || item.q}</h4>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.answer || item.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <div className={`fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.06)] z-40 transform transition-transform duration-300 px-4 py-3.5 ${showSticky ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="hidden md:flex items-center gap-4">
            {mainImageUrl && (
              <div className="relative w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
                <Image loader={bunnyLoader} src={mainImageUrl} alt={product.name} fill sizes="44px" className="object-contain p-1 mix-blend-multiply" />
              </div>
            )}
            <div>
              <p className="text-xs font-black text-slate-900 line-clamp-1 max-w-xs tracking-tight">{product.name}</p>
              <p className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">SKU: {product.sku}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto justify-between md:justify-end">
            <div className="hidden lg:flex items-center gap-2 border-r pr-6 border-slate-100 text-[11px] text-slate-500 font-bold">
               📞 Wsparcie: <span className="font-black text-slate-900">+48 500 600 700</span>
            </div>
            
            <div className="text-left md:text-right shrink-0">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Suma:</p>
              <div className="flex items-baseline gap-0.5">
                <span className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter leading-none">{mainPrice}</span>
                {hasCents && <span className="text-xs font-bold text-slate-400 leading-none">.{centsPrice}</span>}
                <span className="text-xs font-bold text-slate-400 ml-0.5 leading-none">zł</span>
              </div>
            </div>
            
            <button onClick={handleAddToCartMain} className="bg-red-600 hover:bg-red-700 text-white font-black text-[11px] uppercase tracking-widest px-6 md:px-8 py-3.5 rounded-xl transition-all shadow-md shrink-0">
              DODAJ DO KOSZYKA ➔
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}