// lib/bunnyLoader.ts

export default function bunnyLoader({ src, width, quality }: { src: string, width: number, quality?: number }) {
  // Jeśli to obrazek zewnętrzny (np. Unsplash), ładuj go normalnie
  if (!src.includes('b-cdn.net')) return src;
  
  // Czyścimy URL ze starych parametrów
  const cleanSrc = src.split('?')[0];
  
  // Wymuszamy najnowszy format i optymalną kompresję
  return `${cleanSrc}?width=${width}&format=webp&quality=${quality || 75}`;
}