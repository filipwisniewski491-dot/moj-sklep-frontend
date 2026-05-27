import { NextResponse } from 'next/server';

export async function GET() {
  // Wyłączamy ciężką logikę. Filtry są teraz przekazywane bezpośrednio z endpointu search.
  return NextResponse.json({ filters: {} });
}