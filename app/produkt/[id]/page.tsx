import ProductClient from './ProductClient';
import { getProductData } from '@/lib/api';
import { Metadata } from 'next';
import { preload } from 'react-dom';

// Wymuszamy rewalidację co 24h
export const revalidate = 86400;

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params;
  const product = await getProductData(params.id);
  
  let mainImageUrl: string | null = null;
  if (product) {
    let cdnImages: string[] = [];
    if (product.external_images) {
      if (Array.isArray(product.external_images)) cdnImages = product.external_images;
      else if (typeof product.external_images === 'string') {
        try { cdnImages = JSON.parse(product.external_images); } catch (e) {}
      }
    }
    const fallbackImages = (product.images || []).map((img: any) => img?.url_standard || img?.url || img?.src).filter(Boolean);
    mainImageUrl = (cdnImages.length > 0 ? cdnImages : fallbackImages)[0] || null;
  }

  return {
    title: product?.name ? `${product.name} - CentrumRolnictwa.pl` : "Produkt - CentrumRolnictwa.pl",
    description: product?.description ? product.description.substring(0, 160) : "Największy internetowy katalog części zamiennych.",
    openGraph: {
      images: mainImageUrl ? [{ url: mainImageUrl, width: 1200, height: 1200 }] : [],
    },
  };
}

export default async function ProductPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const product = await getProductData(params.id);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
        <div className="text-center py-20">
          <span className="text-6xl mb-6 block">🚜</span>
          <h1 className="font-black text-3xl uppercase text-slate-800 mb-4 tracking-tighter">PRODUKT NIE ISTNIEJE</h1>
          <p className="text-slate-500 font-medium text-sm">Sprawdź czy adres URL jest poprawny lub asortyment nie uległ zmianie.</p>
        </div>
      </div>
    );
  }

  // === PRELOAD GŁÓWNEGO ZDJĘCIA DLA LCP ===
  let cdnImages: string[] = [];
  if (product.external_images) {
    if (Array.isArray(product.external_images)) cdnImages = product.external_images;
    else if (typeof product.external_images === 'string') {
      try { cdnImages = JSON.parse(product.external_images); } catch (e) {}
    }
  }
  const fallbackImages = (product.images || []).map((img: any) => img?.url_standard || img?.url || img?.src).filter(Boolean);
  const mainImageUrl = (cdnImages.length > 0 ? cdnImages : fallbackImages)[0] || null;

  if (mainImageUrl) {
    const cleanSrc = mainImageUrl.split('?')[0];

    if (cleanSrc.includes('b-cdn.net')) {
      // Najlepszy preload dla Bunny CDN
      preload(cleanSrc, { 
        as: 'image',
        imageSrcSet: `
          ${cleanSrc}?width=480&format=webp&quality=70 480w,
          ${cleanSrc}?width=750&format=webp&quality=68 750w,
          ${cleanSrc}?width=1200&format=webp&quality=65 1200w
        `.trim(),
        imageSizes: '(max-width: 768px) 100vw, 50vw',
        fetchPriority: 'high'
      });
    } else {
      preload(mainImageUrl, { 
        as: 'image', 
        fetchPriority: 'high' 
      });
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://centrumrolnictwa.pl";
  const fullUrl = `${baseUrl}/produkt/${params.id}`;

  return <ProductClient product={product} fullUrl={fullUrl} />;
}