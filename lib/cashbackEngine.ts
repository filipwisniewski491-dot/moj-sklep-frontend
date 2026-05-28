// lib/cashbackEngine.ts

export const LOYALTY_TIERS = [
  { level: 1, name: 'Standard', minSpent: 0, discountPercent: 0.00 },
  { level: 2, name: 'Brązowy Partner', minSpent: 2000, discountPercent: 0.02 },
  { level: 3, name: 'Srebrny Partner', minSpent: 5000, discountPercent: 0.03 },
  { level: 4, name: 'Złoty Partner', minSpent: 10000, discountPercent: 0.05 },
  { level: 5, name: 'Platynowy Partner', minSpent: 15000, discountPercent: 0.07 },
  { level: 6, name: 'Diamentowy Partner', minSpent: 25000, discountPercent: 0.09 },
  { level: 7, name: 'Konto Hurtowe', minSpent: 50000, discountPercent: 0.10 },
  { level: 8, name: 'Partner Strategiczny (VIP)', minSpent: 100000, discountPercent: 0.15 } 
];

export const CONSTANT_CASHBACK_PERCENT = 0.02; // ZAWSZE 2% wraca do skarbonki
export const MAX_CASHBACK_USAGE_PERCENT = 0.50; // Skarbonką można opłacić max 50% koszyka

export function getUserTier(totalSpent: number) {
  const sortedTiers = [...LOYALTY_TIERS].sort((a, b) => b.minSpent - a.minSpent);
  const currentTier = sortedTiers.find(tier => totalSpent >= tier.minSpent) || LOYALTY_TIERS[0];
  const nextTier = [...LOYALTY_TIERS].sort((a, b) => a.minSpent - b.minSpent).find(tier => tier.minSpent > totalSpent);
  
  return {
    currentTier,
    nextTier,
    progressToNext: nextTier ? (totalSpent / nextTier.minSpent) * 100 : 100,
    amountToNext: nextTier ? nextTier.minSpent - totalSpent : 0
  };
}

export function calculateCartMath(
  cartBrutto: number, 
  totalSpentBeforeOrder: number, 
  availableCashback: number, 
  useCashback: boolean
) {
  const { currentTier } = getUserTier(totalSpentBeforeOrder);

  // A) Wieczny rabat
  const lifetimeDiscountAmount = cartBrutto * currentTier.discountPercent;
  const priceAfterLifetimeDiscount = cartBrutto - lifetimeDiscountAmount;

  // B) Skarbonka (zabezpieczenie 50%)
  const maxAllowedCashback = priceAfterLifetimeDiscount * MAX_CASHBACK_USAGE_PERCENT;
  const applicableCashback = useCashback ? Math.min(availableCashback, maxAllowedCashback) : 0;

  // C) Do zapłaty
  const finalAmountToPay = priceAfterLifetimeDiscount - applicableCashback;

  // D) Zysk do Skarbonki (2% od tego, co klient FAKTYCZNIE płaci po rabatach)
  const cashbackEarned = finalAmountToPay * CONSTANT_CASHBACK_PERCENT;

  return {
    originalTotal: Number(cartBrutto.toFixed(2)),
    tierName: currentTier.name,
    discountPercent: currentTier.discountPercent * 100,
    lifetimeDiscountAmount: Number(lifetimeDiscountAmount.toFixed(2)),
    applicableCashback: Number(applicableCashback.toFixed(2)),
    finalAmountToPay: Number(finalAmountToPay.toFixed(2)),
    cashbackEarned: Number(cashbackEarned.toFixed(2))
  };
}