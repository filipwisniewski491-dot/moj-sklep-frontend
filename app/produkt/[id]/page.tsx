import ProductClient from './ProductClient';
import { getProductData } from '@/lib/api';
import { Metadata } from 'next';
import { preload } from 'react-dom';

// Wymuszamy, by Vercel odświeżał tę stronę raz na 24h
export const revalidate = 86400;

// SEO Metadata
export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params;
  const product = await getProductData(params.id);
  
  return {
    title: product?.name ? `${product.name} - CentrumRolnictwa.pl` : "Produkt - CentrumRolnictwa.pl",
    description: product?.description ? product.description.substring(0, 160) : "Największy internetowy katalog części zamiennych.",
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

  // 🚀 OPTYMALIZACJA LCP: Preload zdjęcia bezpośrednio w serwerze, zanim wyślemy HTML do klienta
  const imageUrl = product.images?.[0];
  if (imageUrl) {
    preload(imageUrl, { as: 'image', imageSizes: '(max-width: 768px) 100vw, 50vw' });
  }

  // Obliczamy URL na serwerze
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://centrumrolnictwa.pl";
  const fullUrl = `${baseUrl}/produkt/${params.id}`;

  // Przekazujemy produkt ORAZ fullUrl do komponentu
  return <ProductClient product={product} fullUrl={fullUrl} />;
}