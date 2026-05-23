// app/api/filters/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const backendGenerateSlug = (text: string) => {
  return text?.toLowerCase()
    .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e')
    .replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o')
    .replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-') || '';
};

const parseAttributeValues = (rawValue: any): string[] => {
    if (!rawValue) return [];
    let strVal = String(rawValue).trim();
    if (strVal === '-' || strVal.toLowerCase().includes('brak')) return [];
    if (strVal.startsWith('[') && strVal.endsWith(']')) {
        strVal = strVal.slice(1, -1);
        return strVal.split(',').map(s => s.replace(/['"]/g, '').trim()).filter(Boolean);
    }
    return strVal.split(/[,/|]/).map(v => v.trim()).filter(Boolean);
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fullPath = searchParams.get('fullPath');
  
  if (!fullPath) return NextResponse.json({ filters: {} });

  const activeFilters = Object.fromEntries(searchParams.entries());
  delete activeFilters.fullPath;
  delete activeFilters.limit;
  delete activeFilters.q;
  delete activeFilters.sort;
  delete activeFilters.minPrice;
  delete activeFilters.maxPrice;

  // FIX: Używamy adresu IP, aby Vercel zawsze trafił do Twojego VPS-a
  const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://178.105.201.145:1337";
  const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

  try {
      const segments = fullPath.split('/').filter(Boolean);
      const currentSlug = segments[segments.length - 1]; 
      const exactName = currentSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

      const baseUrl = `${STRAPI_URL}/api/products?publicationState=preview&pagination[pageSize]=100&fields[0]=technical_specs&fields[1]=attributes&fields[2]=category_text&filters[category_text][$containsi]=${encodeURIComponent(exactName)}`;
      
      let allSpecs: any[] = [];
      const firstPageRes = await fetch(`${baseUrl}&pagination[page]=1`, { headers: { 'Authorization': `Bearer ${STRAPI_TOKEN}` }, next: { revalidate: 3600 } });
      const firstPageJson = await firstPageRes.json();
      
      if (firstPageJson.data) allSpecs.push(...firstPageJson.data);

      if (firstPageJson.meta?.pagination?.total > 100) {
        const totalPages = Math.ceil(firstPageJson.meta.pagination.total / 100);
        const maxPages = Math.min(totalPages, 100); 
        const fetchPromises = [];
        for (let page = 2; page <= maxPages; page++) {
          fetchPromises.push(
            fetch(`${baseUrl}&pagination[page]=${page}`, { headers: { 'Authorization': `Bearer ${STRAPI_TOKEN}` }, next: { revalidate: 3600 } })
            .then(r => r.ok ? r.json() : null).catch(() => null)
          );
        }
        const results = await Promise.all(fetchPromises);
        results.forEach(res => { if (res && res.data) allSpecs.push(...res.data); });
      }

      const FORBIDDEN_KEYS = ['grupa produktowa', 'typ produktu', 'numer katalogowy', 'oem', 'numer oem', 'nr oem', 'opis', 'informacje dodatkowe', 'waga', 'wymiar', 'długość', 'szerokość', 'wysokość', 'ean', 'ilość', 'kolor'];
      const isForbidden = (key: string) => FORBIDDEN_KEYS.some(fk => key.toLowerCase().includes(fk));

      const productMatchesFilters = (p: any, filtersToMatch: Record<string, string>) => {
        const specs = p.technical_specs || p.attributes || {};
        for (const [fKey, fVal] of Object.entries(filtersToMatch)) {
            const specKey = Object.keys(specs).find(k => k.toLowerCase() === fKey.toLowerCase());
            if (fKey.toLowerCase() === 'pasuje do marki' && fVal === 'Części uniwersalne i pozostałe') {
                if (!specKey || !specs[specKey]) return true;
                if (parseAttributeValues(specs[specKey]).length === 0) return true;
                return false;
            }
            if (!specKey) return false;
            const parsedValues = parseAttributeValues(specs[specKey]).map(v => v.toLowerCase());
            if (!parsedValues.includes(fVal.toLowerCase())) return false;
        }
        return true;
      };

      const allFilterKeys = new Set<string>(['Pasuje do marki', 'Pasuje do modelu']);
      allSpecs.forEach(p => {
          const specs = p.technical_specs || p.attributes || {};
          Object.keys(specs).forEach(k => { if (!isForbidden(k)) allFilterKeys.add(k); });
      });

      const optimizedFilters: Record<string, Record<string, number>> = {};
      
      allFilterKeys.forEach(filterKey => {
          const otherActiveFilters = { ...activeFilters };
          delete otherActiveFilters[filterKey]; 
          
          const matchingProducts = allSpecs.filter(p => productMatchesFilters(p, otherActiveFilters));

          matchingProducts.forEach(p => {
              const specs = p.technical_specs || p.attributes || {};
              const specKey = Object.keys(specs).find(k => k.toLowerCase() === filterKey.toLowerCase());
              
              let valuesToProcess: string[] = [];
              const rawParsed = parseAttributeValues(specKey ? specs[specKey] : null);

              if (filterKey.toLowerCase() === 'pasuje do marki') {
                  valuesToProcess = rawParsed.length === 0 ? ['Części uniwersalne i pozostałe'] : rawParsed;
              } else {
                  if (rawParsed.length === 0) return;
                  valuesToProcess = rawParsed;
              }

              valuesToProcess.forEach(value => {
                  if (value.length < 2) return;
                  const standardValue = value.charAt(0).toUpperCase() + value.slice(1);
                  if (!optimizedFilters[filterKey]) optimizedFilters[filterKey] = {};
                  optimizedFilters[filterKey][standardValue] = (optimizedFilters[filterKey][standardValue] || 0) + 1;
              });
          });
      });

      return NextResponse.json({ filters: optimizedFilters });

  } catch (e) {
      return NextResponse.json({ filters: {} }, { status: 500 });
  }
}