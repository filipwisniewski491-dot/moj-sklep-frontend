// src/lib/loyalty.ts
// -----------------------------------------------------------------------------
// Silnik programu lojalnościowego — JEDYNE źródło prawdy o progach rabatowych.
//
// Rabat jest "wieczny": liczony od CAŁKOWITEJ kwoty wydanej przez klienta
// (totalSpent) i obowiązuje na każdą kolejną fakturę.
// -----------------------------------------------------------------------------

export type LoyaltyTier = {
  id: string
  name: string
  minSpent: number // próg wejścia w zł (od sumy wszystkich zakupów)
  discountPercent: number
}

// UPROSZCZONA DRABINKA (ustalona: max 10%, progi startują wyżej — chroni marżę
// i jest prostsza w komunikacji dla rolnika).
//
// >>> Chcesz wrócić do 8 progów? Podmień TYLKO tę tablicę — reszta pliku
//     działa bez zmian. <<<
export const LOYALTY_TIERS: LoyaltyTier[] = [
  { id: "standard",  name: "Standard",             minSpent: 0,      discountPercent: 0 },
  { id: "silver",    name: "Srebrny Partner",      minSpent: 5000,   discountPercent: 2 },
  { id: "gold",      name: "Złoty Partner",        minSpent: 15000,  discountPercent: 4 },
  { id: "wholesale", name: "Konto Hurtowe",        minSpent: 50000,  discountPercent: 7 },
  { id: "vip",       name: "Partner Strategiczny", minSpent: 100000, discountPercent: 10 },
]

export type UserTierInfo = {
  currentTier: LoyaltyTier
  nextTier: LoyaltyTier | null
  amountToNext: number   // ile zł zostało do następnego progu (0 gdy najwyższy)
  progressToNext: number // 0..1 — postęp w obrębie bieżącego pasma (1 gdy najwyższy)
  isTopTier: boolean
}

/**
 * Zwraca poziom klienta na podstawie sumy wszystkich jego zakupów (w zł).
 * To jest ta sama logika, na której stoi dynamiczna sekcja na stronie głównej.
 */
export function getUserTier(totalSpent: number): UserTierInfo {
  const spent = Number.isFinite(totalSpent) && totalSpent > 0 ? totalSpent : 0

  // najwyższy próg, którego klient sięgnął
  let currentIndex = 0
  for (let i = 0; i < LOYALTY_TIERS.length; i++) {
    if (spent >= LOYALTY_TIERS[i].minSpent) currentIndex = i
  }

  const currentTier = LOYALTY_TIERS[currentIndex]
  const nextTier = LOYALTY_TIERS[currentIndex + 1] ?? null

  if (nextTier === null) {
    return { currentTier, nextTier: null, amountToNext: 0, progressToNext: 1, isTopTier: true }
  }

  const bandStart = currentTier.minSpent
  const bandEnd = nextTier.minSpent
  const amountToNext = Math.max(0, bandEnd - spent)
  const progressToNext = clamp((spent - bandStart) / (bandEnd - bandStart), 0, 1)

  return { currentTier, nextTier, amountToNext, progressToNext, isTopTier: false }
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

/** Formatowanie zł po polsku, np. "5 000 zł". */
export function formatPLN(amount: number): string {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: 0,
  }).format(amount)
}