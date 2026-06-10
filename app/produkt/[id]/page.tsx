import React from 'react'; // 🚀 DODANY IMPORT REACTA
import { Metadata } from 'next';
import Link from 'next/link';
import { preload } from 'react-dom';
import { getProductData } from '@/lib/api';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileBottomNav from '@/components/MobileBottomNav';

// --- NASZE WYSPY JS ---
import ProductGallery from './ProductGallery';
import ProductBuyPanel from './ProductBuyPanel';
import ProductRecommendations from './ProductRecommendations';
import StickyBottomBuy from './StickyBottomBuy';

export const revalidate = 86400;

const generateSlug = (text: string) => {
  if (!text) return '';
  return text.toLowerCase()
    .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e')
    .replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o')
    .replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-').replace(/-+/g, '-');
};

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params;
  const product = await getProductData(params.id);
  
  return {
    title: product?.name ? `${product.name} - CentrumRolnictwa.pl` : "Produkt",
    description: product?.description ? product.description.substring(0, 160) : "Wysokiej jakości części rolnicze."
  };
}

export default async function ProductPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const product = await getProductData(params.id);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
        <h1 className="font-black text-3xl">PRODUKT NIE ISTNIEJE</h1>
      </div>
    );
  }

  // LCP PRELOAD
  let cdnImages: string[] = [];
  if (product.external_images) {
    if (Array.isArray(product.external_images)) cdnImages = product.external_images;
    else if (typeof product.external_images === 'string') {
      try { cdnImages = JSON.parse(product.external_images); } catch (e) {}
    }
  }
  const fallbackImages = (product.images || []).map((img: any) => img?.url_standard || img?.url || img?.src).filter(Boolean);
  const displayImages = cdnImages.length > 0 ? cdnImages : fallbackImages;
  const mainImageUrl = displayImages[0] || null;

  if (mainImageUrl?.includes('b-cdn.net')) {
    const cleanSrc = mainImageUrl.split('?')[0];
    preload(`${cleanSrc}?width=500&format=webp&quality=65`, { as: 'image', fetchPriority: 'high' });
  }

  // --- STATYCZNA LOGIKA (Zero JS) ---
  const attributes = typeof product.attributes === 'string' ? JSON.parse(product.attributes || '{}') : product.attributes || {};
  const faq = typeof product.faq === 'string' ? JSON.parse(product.faq || '[]') : product.faq || [];
  
  let breadcrumbPath = ["Kategoria"];
  if (product.category_path) {
    breadcrumbPath = product.category_path.split('/').map((s: string) => s.replace(/-/g, ' '));
  } else if (product.category_text) {
    breadcrumbPath = product.category_text.split('>').map((s: string) => s.trim()).filter(Boolean);
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-44 md:pb-0 relative">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8 lg:py-12 min-h-screen">
        <nav className="flex flex-wrap items-center text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 gap-2">
          <Link href="/" className="hover:text-red-700 transition-colors">Start</Link>
          {breadcrumbPath.map((cat: string, idx: number) => {
            const pathSlugs = breadcrumbPath.slice(0, idx + 1).map((c:string) => generateSlug(c));
            return (
              <React.Fragment key={idx}>
                <span className="text-slate-500">/</span>
                <Link href={`/kategoria/${pathSlugs.join('/')}`} className="hover:text-red-700">{cat}</Link>
              </React.Fragment>
            );
          })}
        </nav>

        <div className="bg-white rounded-[32px] p-6 lg:p-12 shadow-sm border border-slate-100 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          
          <ProductGallery images={displayImages} productName={product.name} />

          <div className="flex flex-col h-full justify-start">
            <h1 className="text-4xl md:text-4xl lg:text-5xl font-black text-slate-900 leading-loose mb-6 tracking-tight py-4 md:py-0 border-y border-transparent">
              {product.name}
            </h1>
            <ProductBuyPanel product={product} mainImageUrl={mainImageUrl} attributes={attributes} />
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-8">
            {product.description && (
              <div className="bg-white rounded-[32px] p-8 lg:p-12 shadow-sm border border-slate-100">
                <h2 className="text-lg font-black mb-8 uppercase tracking-widest border-l-4 border-red-600 pl-4">Opis i specyfikacja</h2>
                <div className="prose prose-slate prose-base max-w-none text-slate-700 font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: product.description }} />
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
            {product.symptoms && (
              <div className="bg-[#FFF4ED] rounded-[32px] p-8 border border-orange-100">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-orange-700 mb-4 flex items-center gap-2"><span>🔎</span> Diagnostyka / Porady</h3>
                <p className="text-orange-900 font-medium leading-relaxed text-sm">{product.symptoms}</p>
              </div>
            )}
            {product.expert_advice && (
              <div className="bg-slate-900 rounded-[32px] p-8 shadow-xl">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-4 flex items-center gap-2"><span>💡</span> Okiem Eksperta</h3>
                <p className="text-slate-300 font-medium leading-relaxed text-sm">{product.expert_advice}</p>
              </div>
            )}
            {faq.length > 0 && (
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

        {/* WYSPA 3: Polecane produkty */}
        <ProductRecommendations product={product} mainImageUrl={mainImageUrl} />
        
      </main>

      {/* WYSPA 4: Dolny Sticky Nav */}
      <StickyBottomBuy product={product} mainImageUrl={mainImageUrl} />

      <MobileBottomNav />
      <Footer />
    </div>
  );
}