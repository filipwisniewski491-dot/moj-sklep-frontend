import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL;
  const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

  const debugInfo: any = {
    etap: "Test połączenia Vercel -> Strapi",
    strapi_url_ustawiony: !!STRAPI_URL,
    strapi_url_wartosc: STRAPI_URL || 'BRAK',
    strapi_token_ustawiony: !!STRAPI_TOKEN,
    status_polaczenia: 'Oczekujące...',
  };

  try {
    const res = await fetch(`${STRAPI_URL}/api/categories?pagination[pageSize]=1`, {
      headers: { 'Authorization': `Bearer ${STRAPI_TOKEN}` },
      cache: 'no-store'
    });

    debugInfo.kod_bledu = res.status;

    if (res.ok) {
      const data = await res.json();
      debugInfo.status_polaczenia = 'SUKCES! Vercel widzi Strapi.';
      debugInfo.przykładowa_kategoria = data.data?.[0]?.name || data.data?.[0]?.attributes?.name || 'Brak danych';
    } else {
      debugInfo.status_polaczenia = 'BŁĄD: Strapi odrzuciło połączenie.';
      debugInfo.odpowiedz = await res.text();
    }
  } catch (err: any) {
    debugInfo.status_polaczenia = 'BŁĄD KRYTYCZNY: Brak dostępu (Firewall/Timeout na porcie 1337).';
    debugInfo.odpowiedz = err.message;
  }

  return NextResponse.json(debugInfo);
}