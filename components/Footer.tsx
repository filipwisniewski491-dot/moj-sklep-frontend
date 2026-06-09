import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const QUICK_SILOS = [
  { name: "Warsztat i uniwersalne", slug: "warsztat-i-uniwersalne" },
  { name: "Części uniwersalne", slug: "czesci-uniwersalne" },
  { name: "Chemia i smary", slug: "chemia-i-smary" },
  { name: "Części do ciągników", slug: "czesci-do-ciagnikow" },
  { name: "Hydraulika siłowa", slug: "hydraulika-silowa" },
  { name: "Hodowla i zootechnika", slug: "hodowla-i-zootechnika" },
  { name: "Części do maszyn", slug: "czesci-do-maszyn" },
  { name: "Materiały eksploatacyjne", slug: "materialy-eksploatacyjne" }
];

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white py-16 border-t-4 border-red-600 pb-32 md:pb-16 mt-12">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12">
        <div className="flex flex-col items-start">
          <div className="bg-white rounded-full p-2 mb-3 shadow-md">
             <Image 
               src="https://centrumrolnictwa-cdn.b-cdn.net/logo.png?width=64&format=webp&quality=60" 
               alt="Sygnet CentrumRolnictwa" 
               width={32}
               height={32}
               className="h-8 w-8 object-contain" 
               unoptimized
             />
          </div>
          <span className="font-black text-xl tracking-tighter text-white leading-none mb-4 uppercase">
            CentrumRolnictwa<span className="text-red-500">.pl</span>
          </span>
          <p className="text-[10px] font-bold text-slate-400 uppercase leading-loose tracking-widest mt-2">
            Niezawodny Sklep Rolniczy.<br/> Części, maszyny, doradztwo.
          </p>
        </div>

        <div>
           <h4 className="text-white font-black mb-6 uppercase text-[11px] tracking-widest">Sklep</h4>
           <ul className="space-y-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {QUICK_SILOS.slice(0, 4).map(cat => (
                <li key={cat.slug}><Link href={`/kategoria/${cat.slug}`} className="hover:text-red-500 transition-colors">{cat.name}</Link></li>
              ))}
           </ul>
        </div>
        <div className="md:col-span-2 bg-slate-800/50 p-8 rounded-[32px] border border-slate-700 flex flex-col justify-center">
           <h4 className="text-slate-300 font-black mb-4 uppercase text-[10px] tracking-[0.2em]">Infolinia i Doradztwo Techniczne</h4>
           <a href="tel:+48257888900" className="font-black text-3xl md:text-4xl text-white tracking-tighter tabular-nums mb-3 hover:text-red-500 transition-colors w-fit">25 788 89 00</a>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
             <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Czynne Pn-Pt: 8:00 - 16:00
           </p>
        </div>
      </div>
    </footer>
  );
}