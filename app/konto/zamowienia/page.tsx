'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setOrders([]); 
      } catch (error) {
        console.error("Błąd pobierania zamówień", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  return (
    <>
      <h1 className="text-3xl md:text-4xl font-black uppercase text-slate-900 tracking-tight mb-8">
        Moje Zamówienia
      </h1>

      <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm min-h-[400px]">
         {isLoading ? (
           <div className="w-full h-full flex flex-col items-center justify-center py-20 text-slate-400">
             <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
             <p className="font-bold text-xs uppercase tracking-widest">Wczytywanie historii...</p>
           </div>
         ) : orders.length === 0 ? (
           <div className="w-full h-full flex flex-col items-center justify-center py-20 text-center">
             <div className="text-6xl mb-4 grayscale opacity-50">📦</div>
             <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Brak zamówień</h2>
             <p className="text-slate-500 font-medium text-sm mb-6 max-w-md">
               Wygląda na to, że nie złożyłeś jeszcze żadnego zamówienia w naszym sklepie.
             </p>
             <Link href="/kategorie" className="bg-slate-900 hover:bg-red-600 text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md">
               Przejdź do katalogu ➔
             </Link>
           </div>
         ) : (
           <div className="space-y-6">
             {orders.map((order: any) => (
                <div key={order.id} className="border border-slate-200 rounded-2xl p-6 hover:border-red-200 transition-colors"></div>
             ))}
           </div>
         )}
      </div>
    </>
  );
}