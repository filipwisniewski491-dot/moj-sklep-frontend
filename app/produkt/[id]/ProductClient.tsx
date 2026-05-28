'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import SearchBar from '@/components/SearchBar';
import { useCart } from '@/store/useCart';
import MegaMenu from '@/components/MegaMenu';
import MobileBottomNav from '@/components/MobileBottomNav';
import { getUserTier } from '@/lib/cashbackEngine';

const bunnyLoader = ({ src, width }: { src: string; width: number }) => {
  if (!src.includes('b-cdn.net')) return src;
  const cleanSrc = src.split('?')[0]; 
  const optimizedWidth = Math.min(width, 750);
  return `${cleanSrc}?width=${optimizedWidth}&format=webp&quality=65&sharpen=false`;
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

export default function ProductClient({ product, fullUrl }: { product: any, fullUrl: string }) {
  const [selectedImgIdx, setSelectedImgIdx] = useState(0); 
  const [showSticky, setShowSticky] = useState(false);
  const [countdownText, setCountdownText] = useState('');
  const [skuCopied, setSkuCopied] = useState(false);

  const mainBuyButtonRef = useRef<HTMLButtonElement>(null);
  
  const { addItem, setIsOpen, items } = useCart();
  const cartValue = items?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || 0;
  const freeShippingThreshold = 500;
  const progressPercent = Math.min((cartValue / freeShippingThreshold) * 100, 100);
  const [isMounted, setIsMounted] = useState(false);

  // SYMULACJA ZALOGOWANEGO KLIENTA DO POKAZANIA RABATÓW
  const userTotalSpent = 105000; 
  const { currentTier } = getUserTier(userTotalSpent);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowSticky(!entry.isIntersecting);
      },
      { root: null, rootMargin: '0px', threshold: 0 }
    );

    if (mainBuyButtonRef.current) observer.observe(mainBuyButtonRef.current);
    return () => observer.disconnect();
  }, []);

  const displayImages = useMemo(() => {
    let cdnImages: string[] = [];
    if (product.external_images) {
      if (Array.isArray(product.external_images)) cdnImages = product.external_images;
      else if (typeof product.external_images === 'string') {
        try { cdnImages = JSON.parse(product.external_images); } catch (e) {}
      }
    }
    const fallbackImages = (product.images || []).map((img: any) => img?.url_standard || img?.url || img?.src).filter(Boolean);
    return cdnImages.length > 0 ? cdnImages : fallbackImages;
  }, [product.external_images, product.images]);

  const mainImageUrl = displayImages[selectedImgIdx] || null;
  const seoDescription = product.seo_description || product.description || '';
  const symptoms = product.symptoms;
  const expertAdvice = product.expert_advice;

  const faq = useMemo(() => typeof product.faq === 'string' ? JSON.parse(product.faq || '[]') : product.faq || [], [product.faq]);
  const attributes = useMemo(() => typeof product.attributes === 'string' ? JSON.parse(product.attributes || '{}') : product.attributes || {}, [product.attributes]);

  const breadcrumbPath = useMemo((): string[] => {
    if (product.category_text) {
      return product.category_text.split('>').map((s: string) => s.trim()).filter(Boolean);
    }
    return ["Kategoria"];
  }, [product.category_text]);

  const numPrice = typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0;
  
  // OBLICZAMY CENĘ PO RABACIE VIP DLA TEGO PRODUKTU
  const priceAfterDiscount = numPrice * (1 - currentTier.discountPercent);
  const cashbackEarned = priceAfterDiscount * 0.02;

  const [mainPrice, centsPrice] = priceAfterDiscount.toFixed(2).split('.');
  const hasCents = centsPrice !== '00';

  const handleAddToCartMain = () => {
    if (addItem) {
      addItem({ id: product.documentId || product.id || product.sku || 'main', name: product.name, price: numPrice, image: mainImageUrl || '', quantity: 1, crossSell: product.crossSell || [], category: product.category || '' });
      if (setIsOpen) setIsOpen(true);
    }
  };

  const handleCopySku = () => {
    if(product.sku) {
      navigator.clipboard.writeText(product.sku);
      setSkuCopied(true);
      setTimeout(() => setSkuCopied(false), 2000);
    }
  };

  const cleanCompatibility = attributes['Pasuje do marki'] ? `${attributes['Pasuje do marki']} ${attributes['Pasuje do modelu'] || ''}`.trim() : null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 md:pb-0 relative">
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
              ⏳ {isMounted ? countdownText.split(': ')[1] || countdownText : '00:00:00'}
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
            <Link href="/konto" aria-label="Twoje Konto" className="flex flex-col items-center cursor-pointer hover:text-red-600 transition-all group relative">
              {currentTier.level > 1 && (
                <div className="absolute -top-3 whitespace-nowrap bg-amber-100 text-amber-800 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-sm border border-amber-200">
                  👑 {currentTier.name}
                </div>
              )}
              <div className="p-3 bg-slate-50 rounded-full group-hover:bg-red-50 transition-colors border border-slate-200 mt-1">
                 <svg className="w-5 h-5 transition-transform text-slate-600 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              </div>
              <span className="text-[9px] font-black mt-1.5 uppercase tracking-widest text-slate-500">Konto</span>
            </Link>
            <button onClick={() => setIsOpen?.(true)} aria-label="Twój Koszyk" className="flex flex-col items-center cursor-pointer hover:text-red-600 transition-all relative group mt-1">
              <div className="p-3 bg-slate-50 rounded-full group-hover:bg-red-50 transition-colors relative border border-slate-200">
                 <svg className="w-5 h-5 transition-transform text-slate-600 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              </div>
              <span className="text-[10px] font-black mt-1.5 uppercase tracking-widest text-slate-800">
                Koszyk
              </span>
            </button>
          </nav>
        </div>
      </header>

      <MegaMenu />

      <main className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        <nav className="flex flex-wrap items-center text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 gap-2" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-red-700 transition-colors">Start</Link>
          {breadcrumbPath.map((cat: string, idx: number) => {
            const pathSlugs = breadcrumbPath.slice(0, idx + 1).map(c => generateSlug(c));
            const href = `/kategoria/${pathSlugs.join('/')}`;
            return (
              <React.Fragment key={idx}>
                <span className="text-slate-400">/</span>
                <Link href={href} className="hover:text-red-700 transition-colors">{cat}</Link>
              </React.Fragment>
            );
          })}
          <span className="hidden md:inline text-slate-400">/</span>
          <span className="hidden md:inline text-slate-900 truncate max-w-xs">{product.name}</span>
        </nav>

        <div className="bg-white rounded-[32px] p-6 lg:p-12 shadow-sm border border-slate-100 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <div className="flex flex-col gap-4">
            <div className="bg-slate-50 rounded-2xl p-8 flex items-center justify-center border border-slate-100 shadow-inner relative overflow-hidden group">
               {mainImageUrl ? (
                <div className="relative w-full aspect-square max-h-[500px]">
                  <Image
                    src={mainImageUrl}
                    alt={product.name}
                    fill
                    priority
                    quality={65}
                    loader={bunnyLoader}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                    fetchPriority="high"
                  />
                </div>
               ) : ( 
                <div className="font-black text-slate-300 text-xl uppercase tracking-widest text-center aspect-square flex items-center justify-center">BRAK ZDJĘCIA</div> 
               )}
            </div>
            
            {displayImages.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {displayImages.map((imgUrl: string, idx: number) => (
                  <button 
                    key={idx} 
                    onClick={() => setSelectedImgIdx(idx)} 
                    aria-label={`Zobacz zdjęcie ${idx + 1}`}
                    className={`relative flex-shrink-0 w-24 h-24 rounded-xl p-2 border-2 transition-all overflow-hidden ${selectedImgIdx === idx ? 'border-red-600 bg-white shadow-md' : 'border-transparent bg-slate-50 hover:bg-slate-100'}`}
                  >
                    <Image loader={bunnyLoader} src={imgUrl} alt={`Miniatura produktu ${idx + 1}`} fill sizes="96px" className="object-contain mix-blend-multiply p-2" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col h-full justify-start">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4 border-b border-slate-100 pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span> W Magazynie</span>
                
                <button 
                  onClick={handleCopySku}
                  className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border transition-all flex items-center gap-1 cursor-pointer ${skuCopied ? 'bg-green-600 text-white border-green-600' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                >
                  SKU: {product.sku} {skuCopied ? '✓ Skopiowano' : '📋'}
                </button>
              </div>
              <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
                <div className="flex text-amber-400 text-xs">★★★★★</div>
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">4.8/5.0</span>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 leading-tight mb-6 tracking-tight">{product.name}</h1>

            <div className="mb-6 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
               <div>
                 {currentTier.level > 1 && (
                   <div className="flex items-center gap-2 mb-1">
                     <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">{currentTier.name} -{currentTier.discountPercent * 100}%</span>
                     <span className="text-xs text-slate-400 line-through font-bold">{numPrice.toFixed(2)} zł</span>
                   </div>
                 )}
                 <div className="flex items-baseline gap-1 mb-1">
                   <span className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter">{mainPrice}</span>
                   {hasCents && <span className="text-3xl font-bold text-slate-500">.{centsPrice}</span>}
                   <span className="text-2xl font-bold text-slate-500 ml-1">zł</span>
                 </div>
                 <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Cena brutto (VAT 23%)</p>
               </div>
               
               <div className="flex-1 md:max-w-[280px] flex flex-col gap-2">
                 <button ref={mainBuyButtonRef} onClick={handleAddToCartMain} className="relative z-50 w-full bg-red-600 text-white py-5 rounded-2xl font-black text-base lg:text-lg uppercase tracking-widest hover:bg-red-700 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-red-600/30 flex items-center justify-center gap-3 cursor-pointer">
                   <span>DODAJ DO KOSZYKA ➔</span>
                 </button>
                 
                 <div className="text-center bg-emerald-50 border border-emerald-100 rounded-xl py-2 px-3">
                    <p className="text-[10px] font-black uppercase text-emerald-800 tracking-widest">
                       💰 Zyskujesz <span className="text-emerald-600 text-xs">+{cashbackEarned.toFixed(2)} zł</span> do Skarbonki
                    </p>
                 </div>
               </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-8 border-b border-slate-100 pb-8">
              <span className="flex items-center gap-1.5">🔒 Bezpieczne płatności</span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1.5">💳 BLIK / PayU</span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1.5">🔄 14 dni na zwrot</span>
            </div>

            {cleanCompatibility && (
              <div className="mb-6 bg-emerald-50 border border-emerald-100 p-5 rounded-2xl flex items-start gap-4">
                 <div className="text-2xl">✅</div>
                 <div>
                    <p className="text-[10px] font-black uppercase text-emerald-800 tracking-widest mb-1">Gwarancja dopasowania</p>
                    <p className="text-sm font-bold text-emerald-950 leading-snug">
                      Element sprawdzony. Pasuje do: <span className="font-black">{cleanCompatibility}</span>
                    </p>
                 </div>
              </div>
            )}
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
        </div>
      </footer>
    </div>
  );
}