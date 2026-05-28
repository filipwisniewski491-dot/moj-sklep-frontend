// lib/cashbackEngine.ts

export const CASHBACK_TIERS = [
  { level: 1, name: 'Standard', minSpent: 0, percent: 0.02 },
  { level: 2, name: 'Srebrny Partner', minSpent: 2000, percent: 0.03 },
  { level: 3, name: 'Złoty Partner', minSpent: 5000, percent: 0.05 }
];

export const MAX_CASHBACK_USAGE_PERCENT = 0.5; // Klient może opłacić max 50% koszyka skarbonką (chroni Twoją płynność finansową)

/**
 * Zwraca aktualny poziom klienta na podstawie wydanej kwoty
 */
export function getUserTier(totalSpent: number) {
  // Odwracamy tablicę, żeby szukać od najwyższego progu
  const sortedTiers = [...CASHBACK_TIERS].sort((a, b) => b.minSpent - a.minSpent);
  const currentTier = sortedTiers.find(tier => totalSpent >= tier.minSpent) || CASHBACK_TIERS[0];
  
  const nextTier = [...CASHBACK_TIERS].sort((a, b) => a.minSpent - b.minSpent).find(tier => tier.minSpent > totalSpent);
  
  return {
    currentTier,
    nextTier,
    progressToNext: nextTier ? (totalSpent / nextTier.minSpent) * 100 : 100,
    amountToNext: nextTier ? nextTier.minSpent - totalSpent : 0
  };
}

/**
 * Oblicza, ile KASY wróci do klienta z bieżącego zamówienia
 */
export function calculateEarnedCashback(orderValueBrutto: number, totalSpentBeforeOrder: number) {
  const { currentTier } = getUserTier(totalSpentBeforeOrder);
  return Number((orderValueBrutto * currentTier.percent).toFixed(2));
}

/**
 * Oblicza, ile MAKSYMALNIE klient może zdjąć ze Skarbonki w aktualnym koszyku
 */
export function calculateMaxUsableCashback(orderValueBrutto: number, availableCashback: number) {
  const maxAllowedByCart = orderValueBrutto * MAX_CASHBACK_USAGE_PERCENT;
  return Number(Math.min(availableCashback, maxAllowedByCart).toFixed(2));
}