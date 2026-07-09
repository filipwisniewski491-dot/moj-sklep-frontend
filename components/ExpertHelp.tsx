import Link from "next/link";

// Blok doradztwa — rolnik często nie zna numeru części. Daje mu 3 drogi kontaktu
// (telefon, formularz, e-mail) + jasny komunikat „dobierzemy za Ciebie". Buduje zaufanie
// i ratuje sprzedaż tam, gdzie klient inaczej by się zniechęcił.
export default function ExpertHelp() {
  return (
    <section aria-label="Doradztwo techniczne" className="mb-20">
      <div className="bg-slate-900 rounded-[32px] md:rounded-[48px] p-8 md:p-14 relative overflow-hidden border border-slate-800">
        <div className="absolute bottom-0 right-0 w-[420px] h-[420px] bg-emerald-500 rounded-full blur-[150px] opacity-15 -mr-20 -mb-20 pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-emerald-400 font-black uppercase text-[10px] tracking-[0.3em] mb-3">Ludzie z branży, nie infolinia</p>
            <h2 className="text-white text-2xl md:text-4xl font-black uppercase tracking-tight leading-tight mb-4">
              Nie wiesz, która część pasuje?<br />
              <span className="text-slate-400">Dobierzemy ją za Ciebie.</span>
            </h2>
            <p className="text-slate-400 text-sm md:text-base font-medium leading-relaxed mb-6 max-w-lg">
              Podaj numer VIN, kod katalogowy albo po prostu markę i model maszyny — nasi doradcy sprawdzą pasujący element i podeślą Ci gotowe zamówienie. Bez pomyłek i zbędnych zwrotów.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="tel:+48257888900"
                className="bg-red-600 text-white px-7 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-red-700 transition-colors flex items-center gap-2 shadow-lg shadow-red-600/30"
              >
                <span className="text-base">📞</span> 25 788 89 00
              </a>
              <Link
                href="/kontakt"
                prefetch={false}
                className="bg-white/10 border border-white/20 text-white px-7 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-white/20 transition-colors flex items-center gap-2 backdrop-blur-sm"
              >
                <span className="text-base">✉️</span> Napisz do nas
              </Link>
            </div>
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mt-4">
              Czynne pn–pt 8:00–16:00 · Odpowiadamy tego samego dnia
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: "🔍", title: "Dobór po VIN", desc: "Sprawdzimy część po numerze nadwozia." },
              { icon: "📚", title: "Numer OEM", desc: "Masz kod katalogowy? Znajdziemy zamiennik." },
              { icon: "🚜", title: "Po modelu", desc: "Znasz tylko maszynę? To wystarczy." },
            ].map((c) => (
              <div key={c.title} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-2 backdrop-blur-sm">
                <span className="text-2xl">{c.icon}</span>
                <span className="text-white text-[12px] font-black uppercase tracking-tight leading-tight">{c.title}</span>
                <span className="text-slate-400 text-[11px] font-medium leading-snug">{c.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}