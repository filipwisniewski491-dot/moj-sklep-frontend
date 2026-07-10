// src/components/loyalty/DiscountProgramSection.tsx
"use client"

import Link from "next/link"
import { LOYALTY_TIERS, getUserTier, formatPLN } from "@/lib/loyalty"
import { useCustomerSpend } from "@/hooks/useCustomerSpend"

const MAX_DISCOUNT = Math.max(...LOYALTY_TIERS.map((t) => t.discountPercent))

export default function DiscountProgramSection() {
  const { isLoading, isLoggedIn, totalSpent } = useCustomerSpend()
  const currentTierId = isLoggedIn ? getUserTier(totalSpent).currentTier.id : undefined

  return (
    <section aria-labelledby="loyalty-heading" className="w-full bg-stone-50 py-14">
      <div className="mx-auto max-w-5xl px-4">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
            Program rabatowy dla stałych klientów
          </p>
          <h2
            id="loyalty-heading"
            className="mt-1 text-2xl font-bold text-stone-900 sm:text-3xl"
          >
            Im więcej kupujesz, tym niższe ceny — na stałe
          </h2>
          <p className="mt-2 max-w-2xl text-stone-600">
            Rabat naliczamy od sumy wszystkich Twoich zakupów i stosujemy na każdej
            kolejnej fakturze. Bez punktów, bez kombinowania — po prostu niższa cena.
          </p>
        </header>

        {isLoading ? (
          <LadderSkeleton />
        ) : isLoggedIn ? (
          <MemberView totalSpent={totalSpent} />
        ) : (
          <GuestView />
        )}

        <div className="mt-8">
          <TierLadder currentTierId={currentTierId} />
        </div>

        <p className="mt-6 text-sm text-stone-500">
          Rabaty naliczane zgodnie z regulaminem programu.{" "}
          <Link
            href="/regulamin-programu"
            className="font-medium text-green-700 underline underline-offset-2 hover:text-green-800"
          >
            Zobacz regulamin programu
          </Link>
        </p>
      </div>
    </section>
  )
}

function MemberView({ totalSpent }: { totalSpent: number }) {
  const { currentTier, nextTier, amountToNext, progressToNext, isTopTier } =
    getUserTier(totalSpent)

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-stone-500">Twój poziom</p>
          <p className="text-xl font-bold text-stone-900">{currentTier.name}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-stone-500">Twój stały rabat</p>
          <p className="text-3xl font-bold text-green-700">
            {currentTier.discountPercent}%
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm text-stone-600">
        Wydano łącznie:{" "}
        <span className="font-semibold text-stone-900">{formatPLN(totalSpent)}</span>
      </p>

      {isTopTier ? (
        <div className="mt-4 rounded-lg bg-green-50 p-4 text-green-800">
          Masz najwyższy poziom — {currentTier.discountPercent}% rabatu na każde
          zamówienie. Dziękujemy.
        </div>
      ) : (
        <div className="mt-4">
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-stone-600">
              Do poziomu{" "}
              <span className="font-semibold text-stone-900">{nextTier!.name}</span> (
              {nextTier!.discountPercent}%)
            </span>
            <span className="font-semibold text-stone-900">
              {formatPLN(amountToNext)}
            </span>
          </div>
          <div
            className="h-3 w-full overflow-hidden rounded-full bg-stone-100"
            role="progressbar"
            aria-valuenow={Math.round(progressToNext * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-green-600 transition-[width] duration-500 motion-reduce:transition-none"
              style={{ width: `${Math.max(4, progressToNext * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-stone-600">
            Wydaj jeszcze{" "}
            <span className="font-semibold">{formatPLN(amountToNext)}</span>, a Twój
            rabat wzrośnie do {nextTier!.discountPercent}% — na stałe.
          </p>
        </div>
      )}
    </div>
  )
}

function GuestView() {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-xl">
          <p className="text-xl font-bold text-stone-900">
            Załóż konto i zbieraj rabat do {MAX_DISCOUNT}%
          </p>
          <p className="mt-2 text-stone-600">
            Rabat rośnie z każdą kolejną fakturą i zostaje z Tobą na stałe. Zaloguj
            się, żeby zobaczyć swój poziom.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/account/register"
            className="rounded-lg bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
          >
            Załóż konto
          </Link>
          <Link
            href="/account/login"
            className="rounded-lg border border-stone-300 px-5 py-3 font-semibold text-stone-700 hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-400"
          >
            Zaloguj się
          </Link>
        </div>
      </div>
    </div>
  )
}

function TierLadder({ currentTierId }: { currentTierId?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-stone-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-stone-100 text-stone-600">
          <tr>
            <th className="px-4 py-3 font-semibold">Poziom</th>
            <th className="px-4 py-3 font-semibold">Po wydaniu</th>
            <th className="px-4 py-3 text-right font-semibold">Stały rabat</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {LOYALTY_TIERS.map((tier) => {
            const active = tier.id === currentTierId
            return (
              <tr key={tier.id} className={active ? "bg-green-50" : "bg-white"}>
                <td className="px-4 py-3 font-medium text-stone-900">
                  {tier.name}
                  {active && (
                    <span className="ml-2 rounded-full bg-green-700 px-2 py-0.5 text-xs font-semibold text-white">
                      Twój poziom
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-stone-600">
                  {tier.minSpent === 0 ? "—" : formatPLN(tier.minSpent)}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-stone-900">
                  {tier.discountPercent}%
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function LadderSkeleton() {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="h-6 w-40 animate-pulse rounded bg-stone-100" />
      <div className="mt-4 h-3 w-full animate-pulse rounded-full bg-stone-100" />
      <div className="mt-3 h-4 w-64 animate-pulse rounded bg-stone-100" />
    </div>
  )
}