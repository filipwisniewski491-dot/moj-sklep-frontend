'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MOCK_USER } from './layout';

const LOYALTY_TIERS = [
  { name: 'Standard', minSpent: 0, discount: '0%' },
  { name: 'Brązowy Partner', minSpent: 2000, discount: '2%' },
  { name: 'Srebrny Partner', minSpent: 5000, discount: '3%' },
  { name: 'Złoty Partner', minSpent: 10000, discount: '5%' }
];

export default function AccountDashboardPage() {
  const [showRules, setShowRules] = useState(false);
  const tierProgress = Math.min((MOCK_USER.currentSpent / MOCK_USER.nextTierGoal) * 100, 100);

  return (
    <>
      <h1 className="text-3xl md:text-4xl font-black uppercase text-slate-900 tracking-tight mb-2">Panel Klienta</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SKARBONKA I ZYSKI */}
        <div className="bg-emerald-600 rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl border border-emerald-500">
           {/* ... Tutaj zostaje Twój kod widgetu Zaoszczędziłeś ... */}
        </div>
        <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl">
           {/* ... Tutaj zostaje Twój kod widgetu Skarbonka ... */}
        </div>
      </div>

      {/* STATUS KONTA I ZASADY */}
      <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm relative overflow-hidden">
        {/* ... Cała logika Statusu Twojego Konta pozostaje bez zmian ... */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* OSTATNIE ZAMÓWIENIA I MÓJ GARAŻ PANELE */}
      </div>
    </>
  );
}