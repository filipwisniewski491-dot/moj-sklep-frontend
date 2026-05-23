// app/produkt/[id]/page.tsx
import ProductClient from './ProductClient';
import { getProductData } from '@/lib/api';

// Wymuszamy, by Vercel odświeżał tę stronę raz na 24h
export const revalidate = 86400;

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

  // Obliczamy URL na serwerze – to jest klucz do sukcesu!
  // Jeśli nie masz zmiennej środowiskowej, ustawiamy domenę na sztywno.
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://centrumrolnictwa.pl";
  const fullUrl = `${baseUrl}/produkt/${params.id}`;

  // Przekazujemy produkt ORAZ fullUrl do komponentu
  return <ProductClient product={product} fullUrl={fullUrl} />;
}