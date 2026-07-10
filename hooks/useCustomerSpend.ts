// src/hooks/useCustomerSpend.ts
"use client"

import { useEffect, useState } from "react"

export type CustomerSpend = {
  isLoading: boolean
  isLoggedIn: boolean
  totalSpent: number // suma wszystkich zakupów klienta w zł
}

/**
 * JEDYNY punkt integracji z Twoimi danymi.
 * Cała dynamika sekcji rabatowej stoi na jednej liczbie: totalSpent.
 *
 * Dopóki nie podłączysz realnego źródła, hook zwraca "gość" (isLoggedIn:false)
 * i sekcja pokaże wersję zachęcającą do rejestracji — NIC się nie wysypie.
 *
 * >>> Podłącz swoje dane w funkcji fetchCustomerSpend() poniżej. <<<
 */
export function useCustomerSpend(): CustomerSpend {
  const [state, setState] = useState<CustomerSpend>({
    isLoading: true,
    isLoggedIn: false,
    totalSpent: 0,
  })

  useEffect(() => {
    let active = true
    fetchCustomerSpend()
      .then((data) => {
        if (active) setState({ isLoading: false, ...data })
      })
      .catch(() => {
        if (active) setState({ isLoading: false, isLoggedIn: false, totalSpent: 0 })
      })
    return () => {
      active = false
    }
  }, [])

  return state
}

async function fetchCustomerSpend(): Promise<Omit<CustomerSpend, "isLoading">> {
  // ===========================================================================
  // TODO: podłącz realne źródło. Wybierz JEDNĄ z opcji i usuń resztę.
  //
  // Żeby to dokończyć, muszę wiedzieć SKĄD front wie ile klient wydał.
  // Odpal w projekcie i wklej mi wynik:
  //   grep -rl "totalSpent\|total_spent\|loyalty\|customer" app src components store hooks lib
  //
  // --- OPCJA A — Medusa: pole w metadanych klienta (najczęstsze) --------------
  //   const res = await fetch("/api/customer", { credentials: "include" })
  //   if (res.status === 401) return { isLoggedIn: false, totalSpent: 0 }
  //   const c = await res.json()
  //   return { isLoggedIn: true, totalSpent: Number(c?.metadata?.total_spent ?? 0) }
  //
  // --- OPCJA B — liczone z historii zamówień (suma opłaconych) -----------------
  //   const res = await fetch("/api/customer/orders", { credentials: "include" })
  //   if (res.status === 401) return { isLoggedIn: false, totalSpent: 0 }
  //   const orders = await res.json()
  //   // UWAGA: Medusa trzyma kwoty w groszach — jeśli tak, podziel przez 100.
  //   const total = orders.reduce((s: number, o: any) => s + (o.total ?? 0), 0) / 100
  //   return { isLoggedIn: true, totalSpent: total }
  //
  // --- OPCJA C — Twój własny store/hook (np. useCustomer z kontekstu Medusy) ---
  //   Przenieś logikę do samego hooka i czytaj totalSpent bezpośrednio ze stanu,
  //   zamiast robić fetch tutaj.
  // ===========================================================================

  // Domyślnie: gość — bezpieczny fallback do czasu podłączenia danych.
  return { isLoggedIn: false, totalSpent: 0 }
}