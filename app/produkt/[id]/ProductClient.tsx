'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import SearchBar from '@/components/SearchBar';
import { useCart } from '@/store/useCart';
import MegaMenu from '@/components/MegaMenu';
import MobileBottomNav from '@/components/MobileBottomNav';
import { getUserTier, CONSTANT_CASHBACK_PERCENT } from '@/lib/cashbackEngine';

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

const MiniProductCard = ({ product }: { product: any }) => {
  const { addItem, setIsOpen } = useCart();
  const imageUrl = product.image || product.external_images?.[0] || product.images?.[0]?.url_standard || product.images?.[0]?.url || product.images?.[0]?.src || null;
  const price = typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0;
  const sku = product.sku || "BRAK SKU";

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    addItem({ id: product.documentId || product.id || sku, name: product.name, price: price, image: imageUrl || '', quantity: 1, crossSell: [], category: '' });
    if (setIsOpen) setIsOpen(true);
  };

  return (
    <div className="group bg-white border border-slate-100 rounded-[32px] hover:shadow-xl transition-all duration-300 flex flex-col h-full overflow-hidden relative">
      <Link href={`/produkt/${product.slug || sku}`} className="flex flex-col flex-1 p-2 relative z-0">
        <div className="bg-slate-50 rounded-[24px] overflow-hidden relative flex items-center justify-center aspect-square mb-3 p-4">
          {imageUrl ? (
            <Image loader={imageUrl.includes('b-cdn.net') ? bunnyLoader : undefined} src={imageUrl} alt={product.name} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Brak zdjęcia</span>
          )}
        </div>
        <div className="px-3 flex-1 flex flex-col">
          <h3 className="font-bold text-slate-800 leading-snug mb-2 group-hover:text-red-600 transition-colors line-clamp-2 text-xs tracking-tight">{product.name}</h3>
        </div>
      </Link>
      <div className="px-5 pb-5 pt-3 border-t border-slate-50 flex items-end justify-between bg-white mt-auto relative z-20 pointer-events-auto">
        <div className="flex flex-col">
          <span className="text-xl font-black text-slate-900 tracking-tighter leading-none">{new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2 }).format(price)} <span className="text-[9px] font-bold text-slate-500">zł</span></span>
        </div>
        <button onClick={handleAddToCart} className="bg-slate-900 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-red-600 active:scale-95 transition-all shadow-md shrink-0 cursor-pointer relative z-50">
          <span className="text-sm">🛒</span>
        </button>
      </div>
    </div>
  );
};

export default function ProductClient({ product, fullUrl }: { product: any, fullUrl: string }) {
  const [selectedImgIdx, setSelectedImgIdx] = useState(0); 
  const [showSticky, setShowSticky] = useState(false);
  const [timeLeftStr, setTimeLeftStr] = useState('');
  const [isShippingToday, setIsShippingToday] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [skuCopied, setSkuCopied] = useState(false);

  const mainBuyButtonRef = useRef<HTMLButtonElement>(null);
  
  const { addItem, setIsOpen, items } = useCart();
  const cartValue = items?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || 0;
  const freeShippingThreshold = 500;
  const progressPercent = Math.min((cartValue / freeShippingThreshold) * 100, 100);
  const [isMounted, setIsMounted] = useState(false);

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

      setTimeLeftStr(`${hours}g ${minutes}m`);
      setIsShippingToday(now.getHours() < 14);
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

    if (mainBuyButtonRef.current) {
      observer.observe(mainBuyButtonRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchRelated = async () => {
      try {
        let validProducts: any[] = [];

        if (product?.crossSell && Array.isArray(product.crossSell) && product.crossSell.length > 0) {
          const res = await fetch(`/api/cross-sell?skus=${product.crossSell.join(',')}`);
          if (res.ok) {
            const data = await res.json();
            validProducts = data.products || [];
          }
        }

        if (validProducts.length < 5) {
          let searchValid: any[] = [];
          
          if (product?.name) {
            const firstWord = product.name.split(' ')[0];
            const res = await fetch(`/api/search?fullPath=kategoria&q=${encodeURIComponent(firstWord)}&limit=10`);
            if (res.ok) {
              const data = await res.json();
              searchValid = (data?.products || []).filter((p: any) => p.sku !== product?.sku);
            }
          }

          if (searchValid.length < 2 && product?.category_text) {
            const parts = product.category_text.split('>');
            const lastCat = parts[parts.length - 1].trim();
            const res = await fetch(`/api/search?fullPath=kategoria&q=${encodeURIComponent(lastCat)}&limit=10`);
            if (res.ok) {
              const data = await res.json();
              searchValid = (data?.products || []).filter((p: any) => p.sku !== product?.sku);
            }
          }

          if (searchValid.length < 2) {
            const res = await fetch(`/api/search?fullPath=kategoria&limit=15`);
            if (res.ok) {
              const data = await res.json();
              searchValid = (data?.products || []).filter((p: any) => p.sku !== product?.sku);
            }
          }

          const existingSkus = validProducts.map((p: any) => p.sku);
          const filteredSearch = searchValid.filter((p: any) => !existingSkus.includes(p.sku));

          validProducts = [...validProducts, ...filteredSearch];
        }

        if (isMounted && validProducts.length > 0) {
          setRelatedProducts(validProducts.slice(0, 5));
        }
      } catch (err) {
        console.error("Błąd pobierania cross-selli:", err);
      }
    };

    if (product) fetchRelated();

    return () => { isMounted = false; };
  }, [product]);

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
  const priceAfterDiscount = numPrice * (1 - currentTier.discountPercent);
  const cashbackEarned = priceAfterDiscount * CONSTANT_CASHBACK_PERCENT;

  const [mainPrice, centsPrice] = priceAfterDiscount.toFixed(2).split('.');
  const hasCents = centsPrice !== '00';

  const handleAddToCartMain = () => {
    if (addItem) {
      addItem({ id: product.documentId || product.id || product.sku || 'main', name: product.name, price: priceAfterDiscount, image: mainImageUrl || '', quantity: 1, crossSell: product.crossSell || [], category: product.category || '' });
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

  const getCleanCompatibility = () => {
    const rawMatch = attributes['Pasuje do marki'] || attributes['Marka maszyny'] || attributes['Pasuje do'];
    const rawModel = attributes['Pasuje do modelu'] || attributes['Model maszyny'] || attributes['Model'];
    const ignoredBrands = ['GRANIT', 'KRAMP', 'GRENE', 'BAP', 'BEPCO', 'WARYŃSKI', 'ROLMUS', 'KERBL', 'SAPHIR Oryginał', 'Saphir'];
    
    let isMatchValid = rawMatch && !ignoredBrands.some(b => rawMatch.toUpperCase().includes(b.toUpperCase()));
    let isModelValid = rawModel && !ignoredBrands.some(b => rawModel.toUpperCase().includes(b.toUpperCase()));

    if (!isMatchValid && !isModelValid) return null;
    return `${isMatchValid ? rawMatch : ''} ${isModelValid ? rawModel : ''}`.trim();
  };

  const cleanCompatibility = getCleanCompatibility();

  const bundleProduct = relatedProducts.length > 0 ? relatedProducts[0] : null;
  const bundleProductPrice = bundleProduct ? (typeof bundleProduct.price === 'number' ? bundleProduct.price : parseFloat(bundleProduct.price) || 0) : 0;
  const bundleProductPriceAfterDiscount = bundleProductPrice * (1 - currentTier.discountPercent);
  const bundleTotalPrice = bundleProduct ? (priceAfterDiscount + bundleProductPriceAfterDiscount) : 0;
  const bundleDiscountPrice = bundleProduct ? (bundleTotalPrice * 0.95) : 0;

  const othersViewedProducts = relatedProducts.slice(1, 5);

  const handleAddBundle = () => {
    if (addItem && bundleProduct) {
      addItem({ id: product.documentId || product.id || product.sku || 'main', name: product.name, price: priceAfterDiscount, image: mainImageUrl || '', quantity: 1, crossSell: [], category: '' });
      const bundleImg = bundleProduct.image || bundleProduct.external_images?.[0] || bundleProduct.images?.[0]?.url_standard || bundleProduct.images?.[0]?.url || bundleProduct.images?.[0]?.src || null;
      addItem({ id: bundleProduct.documentId || bundleProduct.id || bundleProduct.sku || 'bundle', name: bundleProduct.name, price: bundleProductPriceAfterDiscount * 0.95, image: bundleImg || '', quantity: 1, crossSell: [], category: '' });
      if (setIsOpen) setIsOpen(true);
    }
  };

  return (
    {/* POPRAWKA: Zwiększyłem pb do 36, by główna treść nie chowała się pod nawigacją i lepką belką */}
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-36 md:pb-0 relative">
      
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
            <span className="text-[10px] uppercase tracking-widest hidden md:inline">
              {isShippingToday ? 'Wysyłamy dzisiaj. Zamów w:' : 'Wysyłka jutro. Zamów w:'}
            </span>
            <span suppressHydrationWarning className="text-red-600 font-black tabular-nums text-sm tracking-widest">
              ⏳ {isMounted ? timeLeftStr : '00g 00m'}
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
            
            <Link href="/konto" aria-label="Twoje Konto" className="flex flex-col items-center cursor-pointer hover:text-red-600 transition-all group relative">
              {currentTier.level > 1 && (
                <div className="absolute -top-3 whitespace-nowrap bg-gradient-to-r from-slate-900 to-slate-800 text-amber-400 text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md shadow-md border border-amber-500/30 opacity-0 group-hover:opacity-100 lg:opacity-100 transition-opacity z-10 flex items-center gap-1">
                  <span>👑</span> VIP -{currentTier.discountPercent * 100}%
                </div>
              )}
              <div className="p-3 bg-slate-50 rounded-full group-hover:bg-red-50 transition-colors border border-slate-200 mt-1">
                 <svg className="w-5 h-5 transition-transform text-slate-600 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              </div>
              <span className="text-[9px] font-black mt-1.5 uppercase tracking-widest text-slate-500">Konto</span>
            </Link>

            <button onClick={() => setIsOpen?.(true)} aria-label="Twój Koszyk" className="flex flex-col items-center cursor-pointer hover:text-red-600 transition-all relative group">
              <div className="p-3 bg-slate-50 rounded-full group-hover:bg-red-50 transition-colors relative border border-slate-200 mt-1">
                 {cartTotalItems > 0 && <div className="absolute -top-1.5 -right-2 bg-red-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md border-2 border-white animate-bounce">{cartTotalItems}</div>}
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

            <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
               
               <div className="flex flex-col">
                 {currentTier.level > 1 && (
                   <div className="flex items-center gap-2 mb-1">
                     <span className="bg-slate-900 text-amber-400 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest shadow-sm">
                       VIP -{currentTier.discountPercent * 100}%
                     </span>
                     <span className="text-xs text-slate-400 line-through font-bold">{numPrice.toFixed(2)} zł</span>
                   </div>
                 )}
                 
                 <div className="flex items-baseline gap-1">
                   <span className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter">{mainPrice}</span>
                   {hasCents && <span className="text-3xl font-bold text-slate-500">.{centsPrice}</span>}
                   <span className="text-2xl font-bold text-slate-500 ml-1">zł</span>
                 </div>
                 
                 <div className="flex items-center gap-3 mt-2">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Brutto (VAT 23%)</p>
                    {cashbackEarned >= 0 && (
                      <>
                        <div className="w-px h-3 bg-slate-200"></div>
                        <p className="text-emerald-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                          <span>💰</span> +{cashbackEarned.toFixed(2)} zł
                        </p>
                      </>
                    )}
                 </div>
               </div>
               
               <div className="flex-1 md:max-w-[280px] flex flex-col gap-2">
                 <button ref={mainBuyButtonRef} onClick={handleAddToCartMain} className="relative z-50 w-full bg-red-600 text-white py-5 rounded-2xl font-black text-base lg:text-lg uppercase tracking-widest hover:bg-red-700 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-red-600/30 flex items-center justify-center gap-3 cursor-pointer">
                   <span>DODAJ DO KOSZYKA ➔</span>
                 </button>
                 
                 <button onClick={() => console.log('Przejdź do szybkiego BLIKa')} className="relative z-50 w-full bg-slate-900 text-white py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer">
                   Kup błyskawicznie z <span className="bg-white text-black px-1.5 py-0.5 rounded text-[10px] italic">BLIK</span>
                 </button>
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

            <div className="bg-slate-50 text-slate-800 p-5 rounded-2xl mb-4 border border-slate-200 flex items-start gap-4">
               <div className="text-2xl mt-0.5">📦</div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-slate-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                    Ekspresowa Wysyłka
                  </p>
                  <p className="text-sm font-bold leading-tight">
                    {isShippingToday 
                      ? `Zamów w ciągu ${timeLeftStr}, a wyślemy paczkę JESZCZE DZISIAJ!` 
                      : `Wysyłka JUTRO RANO. Czas na zamówienie: ${timeLeftStr}`}
                  </p>
               </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-5 relative overflow-hidden group">
              <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-slate-100 shadow-sm shrink-0">
                <Image src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&auto=format&fit=crop" alt="Doradca Maciek" fill sizes="56px" className="object-cover object-top" />
              </div>
              <div className="flex-1">
                <p className="font-black uppercase text-[9px] text-red-700 tracking-widest mb-0.5">Twój opiekun techniczny</p>
                <p className="font-bold text-slate-800 text-xs leading-tight mb-2">Chcesz upewnić się, czy część na pewno pasuje?</p>
                <a href="tel:+48500600700" className="inline-flex items-center gap-1.5 font-black text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest transition-colors">
                  📞 +48 500 600 700
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-8">
            {seoDescription && (
              <div className="bg-white rounded-[32px] p-8 lg:p-12 shadow-sm border border-slate-100">
                <h2 className="text-lg font-black mb-8 uppercase tracking-widest border-l-4 border-red-600 pl-4">Opis i specyfikacja</h2>
                <div className="prose prose-slate prose-base max-w-none text-slate-700 font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: seoDescription }} />
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
                          <td className="p-4 text-slate-600 text-[10px] font-black uppercase tracking-widest w-1/3 border-r border-slate-100/60">{key}</td>
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
                <h3 className="text-[10px] font-black uppercase tracking-widest text-orange-700 mb-4 flex items-center gap-2"><span>🔎</span> Diagnostyka / Porady</h3>
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
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">{item.answer || item.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {bundleProduct && (
          <section className="mt-16 bg-white rounded-[32px] p-6 lg:p-10 border-2 border-red-600 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 bg-red-600 text-white px-6 py-2 rounded-bl-3xl font-black text-[10px] uppercase tracking-widest shadow-md">
               Kup w zestawie i oszczędź 5%
             </div>
             
             <h3 className="text-xl lg:text-2xl font-black text-slate-900 uppercase tracking-tight mb-8">Często kupowane razem</h3>
             
             <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
                <div className="flex items-center gap-4 flex-1 w-full lg:w-auto">
                  <div className="w-24 h-24 bg-slate-50 rounded-2xl relative border border-slate-100 p-2 shrink-0">
                    {mainImageUrl ? <Image loader={bunnyLoader} src={mainImageUrl} alt="Main" fill className="object-contain mix-blend-multiply" /> : <div className="w-full h-full bg-slate-100 rounded-xl"></div>}
                  </div>
                  <div>
                    <span className="bg-red-100 text-red-800 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest mb-1 block w-fit">Ten produkt</span>
                    <p className="text-xs font-bold text-slate-800 line-clamp-2">{product.name}</p>
                    <p className="text-sm font-black text-slate-900 mt-1">{priceAfterDiscount.toFixed(2)} zł</p>
                  </div>
                </div>

                <div className="text-3xl font-black text-slate-300">＋</div>

                <div className="flex items-center gap-4 flex-1 w-full lg:w-auto">
                  <div className="w-24 h-24 bg-slate-50 rounded-2xl relative border border-slate-100 p-2 shrink-0">
                     {(() => {
                        const bImg = bundleProduct.image || bundleProduct.external_images?.[0] || bundleProduct.images?.[0]?.url_standard || bundleProduct.images?.[0]?.url || bundleProduct.images?.[0]?.src;
                        return bImg ? <Image loader={bunnyLoader} src={bImg} alt="Bundle" fill className="object-contain mix-blend-multiply" /> : <div className="w-full h-full bg-slate-100 rounded-xl"></div>;
                     })()}
                  </div>
                  <div>
                    <span className="bg-slate-100 text-slate-600 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest mb-1 block w-fit">Rekomendowane</span>
                    <p className="text-xs font-bold text-slate-800 line-clamp-2">{bundleProduct.name}</p>
                    <p className="text-sm font-black text-slate-900 mt-1">{bundleProductPriceAfterDiscount.toFixed(2)} zł</p>
                  </div>
                </div>
                
                <div className="text-3xl font-black text-slate-300 hidden lg:block">＝</div>
                <div className="w-full h-px bg-slate-100 lg:hidden"></div>
                
                <div className="flex flex-col items-center lg:items-end w-full lg:w-auto shrink-0 bg-red-50 p-6 rounded-2xl border border-red-100">
                   <p className="line-through text-slate-400 font-bold text-sm mb-1">{bundleTotalPrice.toFixed(2)} zł</p>
                   <p className="text-3xl lg:text-4xl font-black text-red-600 tracking-tighter leading-none mb-4">{bundleDiscountPrice.toFixed(2)} <span className="text-lg">zł</span></p>
                   <button onClick={handleAddBundle} className="relative z-50 w-full lg:w-auto bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] uppercase tracking-widest px-8 py-4 rounded-xl transition-all shadow-md hover:scale-[1.02] active:scale-95 cursor-pointer">
                     DODAJ ZESTAW ➔
                   </button>
                </div>
             </div>
          </section>
        )}

        {othersViewedProducts.length > 0 && (
          <section className="mt-12 bg-white rounded-[40px] p-8 md:p-12 border border-slate-100 shadow-sm relative overflow-hidden">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 relative z-10 gap-4">
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-red-600 mb-2 flex items-center gap-2">
                    Klienci wybierali również
                  </h3>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">Inni oglądali też</h2>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6 relative z-10">
                 {othersViewedProducts.map(p => (
                   <MiniProductCard key={p.id || p.sku} product={p} />
                 ))}
              </div>
          </section>
        )}
      </main>

      {/* POPRAWKA: Zwiększony odstęp bottom z 68px na 76px, aby "Add to Cart" swobodnie unosiło się nad menu dolnym */}
      <div className={`fixed bottom-[calc(env(safe-area-inset-bottom,0px)+76px)] md:bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-20px_40px_rgba(0,0,0,0.08)] z-40 transform transition-transform duration-300 px-4 py-3.5 ${showSticky ? 'translate-y-0' : 'translate-y-[150%] md:translate-y-[120%]'}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="hidden md:flex items-center gap-4">
            {mainImageUrl && (
              <div className="relative w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
                <Image loader={bunnyLoader} src={mainImageUrl} alt={product.name} fill sizes="48px" className="object-contain p-1 mix-blend-multiply" />
              </div>
            )}
            <div>
              <p className="text-sm font-black text-slate-900 line-clamp-1 max-w-sm tracking-tight">{product.name}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">SKU: {product.sku}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto justify-between md:justify-end">
            <div className="hidden lg:flex items-center gap-2 border-r pr-6 border-slate-100 text-[11px] text-slate-600 font-bold">
               📞 Zadzwoń: <span className="font-black text-slate-900">+48 500 600 700</span>
            </div>
            
            <div className="text-left md:text-right shrink-0">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Cena z VAT:</p>
              <div className="flex items-baseline gap-0.5">
                <span className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{mainPrice}</span>
                {hasCents && <span className="text-sm font-bold text-slate-500 leading-none">.{centsPrice}</span>}
                <span className="text-xs font-bold text-slate-500 ml-0.5 leading-none">zł</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => console.log('Szybki BLIK')} className="hidden md:flex relative z-50 bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] uppercase tracking-widest px-4 py-4 rounded-xl transition-all shadow-md items-center justify-center gap-1.5 cursor-pointer">
                 <span className="bg-white text-black px-1.5 py-0.5 rounded text-[9px] italic leading-none">BLIK</span>
              </button>
              
              <button onClick={handleAddToCartMain} className="relative z-50 bg-red-600 hover:bg-red-700 text-white font-black text-[11px] md:text-xs uppercase tracking-widest px-6 md:px-8 py-3.5 md:py-4 rounded-xl transition-all shadow-lg shadow-red-600/30 shrink-0 hover:scale-[1.02] active:scale-95 cursor-pointer">
                DODAJ <span className="hidden sm:inline">DO KOSZYKA</span> ➔
              </button>
            </div>
          </div>
        </div>
      </div>

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