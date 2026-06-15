import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Webhook z ERP (lub systemu płatności) przesyła ID anulowanej transakcji i wartość
    const { transactionId, refundValue, items } = body;

    // Przesłanie twardego sygnału zwrotu do Google Analytics 4 (Measurement Protocol)
    const ga4Payload = {
      client_id: 'backend-system', // Zastępuje ciasteczko przeglądarki
      events: [{
        name: 'refund',
        params: {
          currency: 'PLN',
          transaction_id: transactionId,
          value: refundValue,
          items: items // Zwracane części
        }
      }]
    };

    /* Odkomentuj po wygenerowaniu kluczy API z panelu GA4:

      await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${process.env.GA4_MEASUREMENT_ID}&api_secret=${process.env.GA4_API_SECRET}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ga4Payload)
      });
    */

    return NextResponse.json({ success: true, message: 'Algorytmy poinformowane o zwrocie.' });

  } catch (error) {
    console.error('Refund Tracking Error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}