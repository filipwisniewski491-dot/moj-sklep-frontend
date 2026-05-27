import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const MEILI_URL = process.env.MEILI_URL;
  const MEILI_KEY = process.env.MEILI_MASTER_KEY;

  const debugInfo: any = {
    etap: "Test połączenia Vercel -> Meilisearch",
    meili_url_ustawiony: !!MEILI_URL,
    meili_url_wartosc: MEILI_URL || 'BRAK ZMIENNEJ W VERCEL',
    meili_key_ustawiony: !!MEILI_KEY,
    meili_key_dlugosc: MEILI_KEY ? MEILI_KEY.length : 0,
    status_polaczenia: 'Oczekujące...',
    kod_bledu: null,
    odpowiedz: null
  };

  try {
    const res = await fetch(`${MEILI_URL}/indexes/products/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MEILI_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ q: "", limit: 1 }), // Pobieramy tylko 1 produkt na próbę
      cache: 'no-store'
    });

    debugInfo.kod_bledu = res.status;

    if (res.ok) {
      const data = await res.json();
      debugInfo.status_polaczenia = 'SUKCES! Vercel widzi bazę.';
      debugInfo.lacznie_produktow_w_bazie = data.estimatedTotalHits || data.totalHits || data.hits?.length || 0;
    } else {
      debugInfo.status_polaczenia = 'BŁĄD: Meilisearch odrzucił połączenie.';
      debugInfo.odpowiedz = await res.text();
    }

  } catch (err: any) {
    debugInfo.status_polaczenia = 'BŁĄD KRYTYCZNY: Brak dostępu do serwera (Firewall/Timeout).';
    debugInfo.odpowiedz = err.message;
  }

  return NextResponse.json(debugInfo);
}