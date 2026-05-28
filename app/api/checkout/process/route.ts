// app/api/checkout/process/route.ts
import { NextResponse } from 'next/server';
import { calculateEarnedCashback, calculateMaxUsableCashback } from '@/lib/cashbackEngine';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, cartTotal, requestedCashbackUsage } = body;

    // 1. POBRANIE PRAWDZIWYCH DANYCH Z BAZY (np. Strapi lub BigCommerce)
    // UWAGA: Nigdy nie ufaj temu, co wysyła przeglądarka klienta (frontend). Zawsze weryfikuj stan w bazie!
    const mockDbUser = {
      id: userId,
      totalSpent: 1200,      // Wydano do tej pory w sklepie
      cashbackBalance: 45.50 // Dostępne środki w Skarbonce
    };

    // 2. WERYFIKACJA BEZPIECZEŃSTWA
    const maxUsable = calculateMaxUsableCashback(cartTotal, mockDbUser.cashbackBalance);
    let finalCashbackUsed = 0;

    if (requestedCashbackUsage > 0) {
      if (requestedCashbackUsage > maxUsable) {
        return NextResponse.json({ error: "Przekroczono limit środków skarbonki lub próbujesz użyć więcej niż posiadasz." }, { status: 400 });
      }
      finalCashbackUsed = requestedCashbackUsage;
    }

    const finalAmountToPay = cartTotal - finalCashbackUsed;

    // 3. OBLICZENIE ZYSKU DLA KLIENTA Z TEGO ZAMÓWIENIA
    const earnedCashback = calculateEarnedCashback(cartTotal, mockDbUser.totalSpent);

    // 4. AKTUALIZACJA BAZY DANYCH (Wykonanie po zatwierdzeniu wpłaty)
    const newTotalSpent = mockDbUser.totalSpent + cartTotal;
    const newCashbackBalance = (mockDbUser.cashbackBalance - finalCashbackUsed) + earnedCashback;

    /*
      TUTAJ LOGIKA ZAPISU DO BAZY:
      await db.users.update(userId, {
        totalSpent: newTotalSpent,
        cashbackBalance: newCashbackBalance
      });
    */

    return NextResponse.json({
      success: true,
      transaction: {
        cartTotal,
        cashbackUsed: finalCashbackUsed,
        amountToPay: finalAmountToPay,
        cashbackEarned: earnedCashback,
        newBalance: newCashbackBalance
      }
    });

  } catch (error) {
    console.error("Błąd weryfikacji koszyka:", error);
    return NextResponse.json({ error: "Wystąpił błąd podczas procesowania zamówienia" }, { status: 500 });
  }
}