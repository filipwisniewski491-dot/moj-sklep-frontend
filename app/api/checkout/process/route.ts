// app/api/checkout/process/route.ts
import { NextResponse } from 'next/server';
import { calculateCartMath } from '@/lib/cashbackEngine';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, cartTotal, useCashback } = body; 

    // Symulacja danych z bazy - klient wydał 105 tys (VIP 15%) i ma 250 zł w skarbonce
    const mockDbUser = {
      id: userId || '123',
      totalSpent: 105000,     
      cashbackBalance: 250.50 
    };

    const cartMath = calculateCartMath(
      cartTotal, 
      mockDbUser.totalSpent, 
      mockDbUser.cashbackBalance, 
      Boolean(useCashback)
    );

    const newTotalSpent = mockDbUser.totalSpent + cartMath.finalAmountToPay;
    const newCashbackBalance = (mockDbUser.cashbackBalance - cartMath.applicableCashback) + cartMath.cashbackEarned;

    return NextResponse.json({
      success: true,
      transaction: {
        ...cartMath,
        newBalance: newCashbackBalance
      }
    });

  } catch (error) {
    console.error("Błąd weryfikacji koszyka:", error);
    return NextResponse.json({ error: "Wystąpił błąd podczas procesowania zamówienia" }, { status: 500 });
  }
}