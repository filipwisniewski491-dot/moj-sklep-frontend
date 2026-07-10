'use client';

import Link from 'next/link';
import { LOYALTY_TIERS, getUserTier, formatPLN } from '@/lib/loyalty';
import { useCustomerSpend } from '@/hooks/useCustomerSpend';

const MAX_DISCOUNT = Math.max(...LOYALTY_TIERS.map((t) => t.discountPercent));

export default function DiscountProgramSection() {
  const { isLoading, isLoggedIn, totalSpent } = useCustomerSpend();
  const currentTierId = isLoggedIn ? getUserTier(totalSpent).currentTier.id : undefined;

  return (
    <section aria-labelledby="loyalty-heading" className="mb-20">
      <div className="mb-8 border-b-2 border-slate-100 pb-6">
        <p className="text-red-600 font-black uppercase text-[10px] tracking-[0.3em] mb-2">
          Program dla stałych klientów
        </p>
        <h2
          id="loyalty-heading"
          className="text-2xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none"
        >
          Im więcej kupujesz, tym niższe ceny
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-slate-500 font-medium leading-relaxed">
          Rabat liczymy od sumy wszystkich Twoich zakupów i stosujemy na każdej kolejnej fakturze.
          Bez punktów, bez kombinowania — po prostu niższa cena, na stałe.
        </p>
      </div>

      {isLoading ? (
        <MemberSkeleton />
      ) : isLoggedIn ? (
        <MemberCard totalSpent={totalSpent} />
      ) : (
        <GuestCard />
      )}

      <div className="mt-6">
        <TierLadder currentTierId={currentTierId} />
      </div>

      <p className="mt-5 text-[11px] text-slate-400 font-medium">
        Rabaty naliczane zgodnie z regulaminem programu.{' '}
        <Link
          href="/regulamin-programu"
          className="font-black uppercase tracking-widest text-slate-600 underline underline-offset-2 hover:text-red-600 transition-colors"
        >
          Zobacz regulamin
        </Link>
      </p>
    </section>
  );
}

function MemberCard({ totalSpent }: { totalSpent: number }) {
  const { currentTier, nextTier, amountToNext, progressToNext, isTopTier } = getUserTier(totalSpent);

  return (
    <div className="relative overflow-hidden bg-slate-900 rounded-[32px] md:rounded-[40px] p-8 md:p-10 text-white border border-slate-800">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-red-600 rounded-full blur-[140px] opacity-15 -mr-16 -mt-16 pointer-events-none" />

      <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-black mb-2">Twój poziom</p>
          <p className="text-2xl md:text-3xl font-black uppercase tracking-tight">{currentTier.name}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-black mb-1">Twój stały rabat</p>
          <p className="text-4xl md:text-5xl font-black text-red-500 tracking-tighter leading-none">
            {currentTier.discountPercent}%
          </p>
        </div>
      </div>

      <p className="relative z-10 mt-5 text-sm text-slate-400 font-medium">
        Wydano łącznie: <span className="font-black text-white">{formatPLN(totalSpent)}</span>
      </p>

      {isTopTier ? (
        <div className="relative z-10 mt-5 rounded-2xl bg-white/5 border border-white/10 p-5">
          <p className="text-sm font-bold text-emerald-400">
            Masz najwyższy poziom — {currentTier.discountPercent}% rabatu na każde zamówienie. Dziękujemy.
          </p>
        </div>
      ) : (
        <div className="relative z-10 mt-6">
          <div className="mb-2 flex justify-between text-xs font-bold">
            <span className="text-slate-400">
              Do poziomu{' '}
              <span className="text-white uppercase tracking-tight">{nextTier!.name}</span> (
              {nextTier!.discountPercent}%)
            </span>
            <span className="text-white">{formatPLN(amountToNext)}</span>
          </div>
          <div
            className="h-3 w-full overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-valuenow={Math.round(progressToNext * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-emerald-500 transition-[width] duration-700 motion-reduce:transition-none"
              style={{ width: `${Math.max(4, progressToNext * 100)}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-slate-300 font-medium">
            Wydaj jeszcze <span className="font-black text-white">{formatPLN(amountToNext)}</span>, a Twój
            rabat wzrośnie do <span className="text-emerald-400 font-black">{nextTier!.discountPercent}%</span> — na stałe.
          </p>
        </div>
      )}
    </div>
  );
}

function GuestCard() {
  // UWAGA: popraw ścieżki na swoje trasy konta (u Ciebie może być np. /konto, /logowanie).
  return (
    <div className="relative overflow-hidden bg-slate-900 rounded-[32px] md:rounded-[40px] p-8 md:p-10 text-white border border-slate-800">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-red-600 rounded-full blur-[140px] opacity-15 -mr-16 -mt-16 pointer-events-none" />
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
        <div className="max-w-xl">
          <p className="text-[10px] uppercase tracking-[0.3em] text-red-500 font-black mb-3">Załóż konto</p>
          <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight leading-tight">
            Zbieraj rabat do <span className="text-red-500">{MAX_DISCOUNT}%</span>
          </h3>
          <p className="mt-3 text-sm text-slate-400 font-medium leading-relaxed">
            Rabat rośnie z każdą kolejną fakturą i zostaje z Tobą na stałe. Zaloguj się, żeby zobaczyć swój
            poziom i ile brakuje do następnego.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <Link
            href="/account/register"
            className="bg-red-600 text-white px-6 py-4 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-red-500 transition-colors text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
          >
            Załóż konto
          </Link>
          <Link
            href="/account/login"
            className="border border-slate-700 text-white px-6 py-4 rounded-xl font-black text-[11px] uppercase tracking-widest hover:border-white transition-colors text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
          >
            Zaloguj się
          </Link>
        </div>
      </div>
    </div>
  );
}

function TierLadder({ currentTierId }: { currentTierId?: string }) {
  return (
    <div className="overflow-hidden rounded-[24px] md:rounded-[32px] border border-slate-100 bg-white">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Poziom</th>
            <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Po wydaniu</th>
            <th className="px-5 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Stały rabat</th>
          </tr>
        </thead>
        <tbody>
          {LOYALTY_TIERS.map((tier) => {
            const active = tier.id === currentTierId;
            return (
              <tr key={tier.id} className={`border-b border-slate-50 last:border-0 ${active ? 'bg-red-50' : ''}`}>
                <td className="px-5 py-4">
                  <span className="text-xs md:text-sm font-black uppercase tracking-tight text-slate-900">{tier.name}</span>
                  {active && (
                    <span className="ml-2 inline-block bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                      Twój poziom
                    </span>
                  )}
                </td>
                <td className="px-5 py-4 text-xs md:text-sm font-medium text-slate-500">
                  {tier.minSpent === 0 ? '—' : formatPLN(tier.minSpent)}
                </td>
                <td className="px-5 py-4 text-right text-sm md:text-base font-black text-slate-900 tracking-tighter">
                  {tier.discountPercent}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MemberSkeleton() {
  return (
    <div className="bg-slate-900 rounded-[32px] md:rounded-[40px] p-8 md:p-10 border border-slate-800">
      <div className="h-8 w-48 rounded bg-white/10 animate-pulse" />
      <div className="mt-6 h-3 w-full rounded-full bg-white/10 animate-pulse" />
      <div className="mt-4 h-4 w-64 rounded bg-white/10 animate-pulse" />
    </div>
  );
}