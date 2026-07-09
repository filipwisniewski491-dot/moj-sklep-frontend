'use client';

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

// Ostatnio oglądane — dla powracających klientów (gospodarstwa kupują cyklicznie).
// Czyta localStorage (klucz 'recently_viewed'), więc jest KLIENCKI i renderuje się
// dopiero po hydratacji. Jeśli nic nie ma — nie pokazuje niczego (return null).
//
// 🔧 ŻEBY DZIAŁAŁO: na stronie PRODUKTU zapisuj oglądany produkt do localStorage, np.:
//   const item = { id, slug, name, price, image };
//   const prev = JSON.parse(localStorage.getItem('recently_viewed') || '[]')
//     .filter((p:any) => p.id !== item.id);
//   localStorage.setItem('recently_viewed', JSON.stringify([item, ...prev].slice(0, 8)));

type Item = { id: string; slug?: string; name: string; price?: number; image?: string | null };

export default function RecentlyViewed() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("recently_viewed");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed.slice(0, 6));
      }
    } catch {
      // brak / uszkodzone dane — ignorujemy
    }
  }, []);

  if (items.length === 0) return null;

  return (
    <section aria-label="Ostatnio oglądane" className="mb-20">
      <div className="flex items-end justify-between mb-8 border-b-2 border-slate-100 pb-6">
        <div>
          <p className="text-red-600 font-black uppercase text-[10px] tracking-[0.3em] mb-2">Wróć do zakupów</p>
          <h2 className="text-2xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">Ostatnio oglądane</h2>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {items.map((p) => (
          <Link
            key={p.id}
            href={`/produkt/${p.slug || p.id}`}
            prefetch={false}
            className="group bg-white border border-slate-100 rounded-[20px] p-3 flex flex-col hover:shadow-lg hover:border-red-200 transition-all"
          >
            <div className="aspect-square bg-slate-50 rounded-xl mb-2 flex items-center justify-center overflow-hidden relative border border-slate-100">
              {p.image ? (
                <Image src={p.image} alt={p.name} fill sizes="150px" className="object-contain p-2 mix-blend-multiply group-hover:scale-110 transition-transform duration-300" unoptimized />
              ) : (
                <span className="text-slate-300 text-[9px] font-black uppercase">Brak zdjęcia</span>
              )}
            </div>
            <h3 className="text-[11px] font-bold text-slate-800 leading-tight line-clamp-2 group-hover:text-red-600 transition-colors">{p.name}</h3>
            {typeof p.price === "number" && p.price > 0 && (
              <span className="text-sm font-black text-slate-900 mt-1">{p.price.toFixed(2)} <span className="text-[9px] text-slate-400">zł</span></span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}