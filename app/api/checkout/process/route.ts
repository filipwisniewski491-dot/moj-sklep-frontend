// app/api/checkout/process/route.ts
import { NextResponse } from 'next/server';
// 👇 Importujemy tylko nową, potężną hybrydową funkcję
import { calculateCartMath } from '@/lib/cashbackEngine';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, cartTotal, useCashback } = body; 

    // 1. POBRANIE PRAWDZIWYCH DANYCH Z BAZY (np. Strapi lub BigCommerce)
    // UWAGA: Nigdy nie ufaj temu, co wysyła przeglądarka klienta (frontend). Zawsze weryfikuj stan w bazie!
    const mockDbUser = {
      id: userId,
      totalSpent: 105000,      // Wydano do tej pory w sklepie
      cashbackBalance: 250.50  // Dostępne środki w Skarbonce
    };

    // 2. PRZELICZENIE KOSZYKA PRZEZ BEZPIECZNY SILNIK (Backend)
    const cartMath = calculateCartMath(
      cartTotal, 
      mockDbUser.totalSpent, 
      mockDbUser.cashbackBalance, 
      Boolean(useCashback)
    );

    // 3. AKTUALIZACJA BAZY DANYCH (Wykonanie po zatwierdzeniu wpłaty przez bramkę)
    const newTotalSpent = mockDbUser.totalSpent + cartMath.finalAmountToPay;
    const newCashbackBalance = (mockDbUser.cashbackBalance - cartMath.applicableCashback) + cartMath.cashbackEarned;

    /*
      TUTAJ LOGIKA ZAPISU DO BAZY (Przykładowo):
      await db.users.update(userId, {
        totalSpent: newTotalSpent,
        cashbackBalance: newCashbackBalance
      });
    */

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