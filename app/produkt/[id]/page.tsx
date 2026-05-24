import ProductClient from './ProductClient';
import { getProductData } from '@/lib/api';
import { Metadata } from 'next';
import { preload } from 'react-dom';

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
    description: product?.seo_description || product?.description?.substring(0, 160) || "",
    openGraph: {
      images: mainImageUrl ? [{ url: mainImageUrl }] : [],
    },
  };
}

export default async function ProductPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const product = await getProductData(params.id);

  if (!product) {
    return <div>Produkt nie istnieje</div>;
  }

  // === PRECYZYJNY PRELOAD ===
  let cdnImages: string[] = [];
  if (product.external_images) {
    if (Array.isArray(product.external_images)) cdnImages = product.external_images;
    else if (typeof product.external_images === 'string') {
      try { cdnImages = JSON.parse(product.external_images); } catch (e) {}
    }
  }
  const fallbackImages = (product.images || []).map((img: any) => img?.url_standard || img?.url || img?.src).filter(Boolean);
  const mainImageUrl = (cdnImages.length > 0 ? cdnImages : fallbackImages)[0] || null;

  if (mainImageUrl?.includes('b-cdn.net')) {
    const cleanSrc = mainImageUrl.split('?')[0];
    preload(`${cleanSrc}?width=750&format=webp&quality=65`, { 
      as: 'image',
      fetchPriority: 'high'
    });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://centrumrolnictwa.pl";
  const fullUrl = `${baseUrl}/produkt/${params.id}`;

  return <ProductClient product={product} fullUrl={fullUrl} />;
}