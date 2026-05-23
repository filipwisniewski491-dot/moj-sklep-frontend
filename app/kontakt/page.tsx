'use client';
import React from 'react';
import Link from 'next/link';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* HEADER - CZYSTY I PROFESJONALNY */}
      <header className="border-b py-6 px-6 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="group flex items-center gap-2 text-red-600 font-black uppercase text-[10px] tracking-[0.2em] transition-all">
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Wróć do zakupów
          </Link>
          <div className="font-black text-2xl tracking-tighter uppercase italic">
            CentrumRolnictwa<span className="text-slate-400">.pl</span>
          </div>
          <div className="hidden md:block text-[10px] font-black uppercase tracking-widest text-slate-400">
            Wsparcie techniczne 24/7
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">
          
          {/* LEWA KOLUMNA - KONTAKT BEZPOŚREDNI */}
          <div>
            <div className="inline-block bg-red-100 text-red-600 text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-[0.2em] mb-6">
              Centrum Pomocy
            </div>
            <h1 className="text-6xl lg:text-7xl font-black uppercase tracking-tighter mb-8 italic leading-[0.9]">
              Masz <span className="text-red-600">awarię?</span> <br/> My mamy części.
            </h1>
            <p className="text-slate-500 text-xl mb-12 leading-relaxed font-medium max-w-md">
              Nasi eksperci to mechanicy z wieloletnim stażem. Dobierzemy części do Twojej maszyny w mniej niż 15 minut.
            </p>

            <div className="space-y-4">
              {/* TELEFON - NAJWAŻNIEJSZY DLA ROLNIKA */}
              <a href="tel:+48257888900" className="flex items-center gap-8 p-10 bg-slate-900 text-white rounded-[40px] hover:scale-[1.02] transition-all shadow-2xl shadow-slate-900/40 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-600 rounded-full blur-[60px] opacity-20 -mr-16 -mt-16"></div>
                <div className="text-5xl group-hover:rotate-12 transition-transform relative z-10">📞</div>
                <div className="relative z-10">
                  <p className="text-red-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Infolinia techniczna</p>
                  <p className="text-3xl font-black tabular-nums tracking-tighter">25 788 89 00</p>
                </div>
              </a>

              {/* EMAIL I ADRES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a href="mailto:sklep@centrumrolnictwa.pl" className="flex flex-col p-8 bg-slate-50 rounded-[40px] border border-transparent hover:border-red-200 transition-all group">
                  <span className="text-4xl mb-4 group-hover:-translate-y-1 transition-transform">✉️</span>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Email</p>
                  <p className="text-sm font-black text-slate-800">sklep@centrumrolnictwa.pl</p>
                </a>
                <div className="flex flex-col p-8 bg-slate-50 rounded-[40px] border border-transparent">
                  <span className="text-4xl mb-4">📍</span>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Siedziba</p>
                  <p className="text-sm font-black text-slate-800 italic">Węgrów, Polska</p>
                </div>
              </div>

              {/* GODZINY */}
              <div className="flex items-center gap-6 p-8 border-2 border-dashed border-slate-100 rounded-[40px]">
                <div className="text-3xl text-red-600">🕒</div>
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Pn - Pt</p>
                    <p className="text-sm font-bold text-slate-800">8:00 - 16:00</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Sobota</p>
                    <p className="text-sm font-bold text-slate-800 text-red-600">Serwis Dyżurny</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PRAWA KOLUMNA - INTELIGENTNY FORMULARZ */}
          <div className="bg-slate-900 rounded-[60px] p-10 lg:p-16 text-white shadow-3xl shadow-red-900/10 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-600 rounded-full blur-[120px] opacity-10 -ml-32 -mb-32"></div>
            
            <h2 className="text-3xl font-black mb-4 uppercase tracking-tighter italic">Wyślij szybkie <span className="text-red-500">zapytanie</span></h2>
            <p className="text-slate-400 text-sm mb-10 font-medium">Nie trać czasu na szukanie. Napisz co potrzebujesz, a my sprawdzimy to w katalogach za Ciebie.</p>
            
            <form className="space-y-5 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest ml-2 text-slate-500">Twoje imię</label>
                  <input type="text" placeholder="Jan Kowalski" className="w-full bg-slate-800 border-none p-5 rounded-3xl text-sm font-bold focus:ring-2 focus:ring-red-600 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest ml-2 text-slate-500">Adres e-mail</label>
                  <input type="email" placeholder="jan@rolnik.pl" className="w-full bg-slate-800 border-none p-5 rounded-3xl text-sm font-bold focus:ring-2 focus:ring-red-600 outline-none transition-all" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest ml-2 text-slate-500">Numer telefonu (do szybkiego kontaktu)</label>
                <input type="text" placeholder="+48 000 000 000" className="w-full bg-slate-800 border-none p-5 rounded-3xl text-sm font-bold focus:ring-2 focus:ring-red-600 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest ml-2 text-slate-500">Opisz problem lub podaj model maszyny</label>
                <textarea placeholder="Szukam pompy do Zetora 7211..." rows={4} className="w-full bg-slate-800 border-none p-5 rounded-3xl text-sm font-bold focus:ring-2 focus:ring-red-600 outline-none resize-none transition-all"></textarea>
              </div>
              
              <button className="w-full bg-red-600 text-white py-6 rounded-3xl font-black text-xl hover:bg-red-700 transition-all shadow-xl shadow-red-600/30 active:scale-95 flex items-center justify-center gap-3">
                WYŚLIJ WIADOMOŚĆ <span>🚀</span>
              </button>
              
              <p className="text-[9px] text-center text-slate-500 uppercase tracking-[0.2em] font-bold">
                Twoje dane są bezpieczne i zostaną użyte tylko do kontaktu.
              </p>
            </form>
          </div>
        </div>
      </main>

      {/* SEKCJA FAQ - ABY WYKOSIĆ KONKURENCJĘ Wygodą */}
      <section className="bg-slate-50 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black uppercase tracking-tighter italic mb-12 text-center">Najczęściej zadawane <span className="text-red-600">pytania</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { q: "Jak sprawdzić czy część pasuje?", a: "Podaj nam numer VIN maszyny lub numer katalogowy starej części." },
              { q: "Jak szybko wysyłacie towar?", a: "Zamówienia złożone do 14:00 wysyłamy tego samego dnia." },
              { q: "Czy mogę zwrócić towar?", a: "Tak, masz na to 30 dni bez podawania przyczyny." },
              { q: "Czy wystawiacie fakturę VAT?", a: "Tak, do każdego zamówienia wystawiamy pełną fakturę VAT 23%." }
            ].map((faq, i) => (
              <div key={i} className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
                <h4 className="font-black text-slate-800 mb-2 uppercase text-xs tracking-wider tracking-tighter italic">{faq.q}</h4>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MAPA Z LEPSZYM DESIGNEM */}
      <section className="h-[500px] w-full bg-slate-200 relative overflow-hidden group">
        <div className="absolute inset-0 bg-slate-900/5 group-hover:bg-transparent transition-all z-10"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
           <div className="bg-white p-6 rounded-[32px] shadow-2xl text-center border-b-4 border-red-600">
              <p className="text-xs font-black uppercase tracking-widest text-red-600 mb-1">Odwiedź nas</p>
              <p className="text-xl font-black italic">Centrum Rolnictwa Węgrów</p>
           </div>
        </div>
        {/* Tu wstawisz Iframe z Google Maps */}
        <div className="w-full h-full bg-[url('https://www.google.com/maps/vt/pb=!1m4!1m3!1i12!2i2315!3i1299!2m3!1e0!2sm!3i633119183!3m8!2spl!3sUS!5e1105!12m4!1e68!2m2!1sset!2sRoadmap!4e0!5m1!5f2')] bg-cover opacity-50 grayscale transition-all group-hover:grayscale-0"></div>
      </section>
    </div>
  );
}