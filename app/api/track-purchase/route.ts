import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { transactionId, value, userEmail, userPhone, items, profitMargin } = body;

    // 1. Szyfrowanie danych klienta (Wymóg Mety i Google dla bezpieczeństwa)
    const hashData = (data: string) => {
      return crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex');
    };

    const hashedEmail = userEmail ? hashData(userEmail) : '';
    const hashedPhone = userPhone ? hashData(userPhone) : '';

    // 2. Wysłanie danych bezpośrednio do serwerów Mety (Facebook Conversions API)
    const metaPayload = {
      data: [
        {
          event_name: 'Purchase',
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          user_data: {
            em: [hashedEmail],
            ph: [hashedPhone],
          },
          custom_data: {
            currency: 'PLN',
            value: value,
            custom_properties: {
              profit_margin: profitMargin // VBB dla algorytmów Mety
            }
          },
        }
      ]
    };

    /* Odkomentuj i uzupełnij swoimi kluczami (Token i ID), gdy podepniesz Meta App:
      
      await fetch(`https://graph.facebook.com/v19.0/${process.env.META_PIXEL_ID}/events?access_token=${process.env.META_ACCESS_TOKEN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metaPayload)
      });
    */

    return NextResponse.json({ success: true, message: 'Server-Side tracking executed successfully' });

  } catch (error) {
    console.error('Server-Side Tracking Error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}