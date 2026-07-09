import Link from "next/link";

// Marki maszyn, do których sklep ma części. Rolnik od razu widzi, że obsłużycie
// jego ciągnik. Każda prowadzi do przefiltrowanej kategorii (marka jako landing SEO).
// Slug marki dopasuj do swojego wzorca URL (u nas: /kategoria/czesci-do-ciagnikow/<marka>).
const BRANDS = [
  { name: "Ursus", slug: "ursus" },
  { name: "Zetor", slug: "zetor" },
  { name: "MTZ / Belarus", slug: "mtz-belarus" },
  { name: "John Deere", slug: "john-deere" },
  { name: "Claas", slug: "claas" },
  { name: "New Holland", slug: "new-holland" },
  { name: "Massey Ferguson", slug: "massey-ferguson" },
  { name: "Deutz-Fahr", slug: "deutz-fahr" },
  { name: "Fendt", slug: "fendt" },
  { name: "Case IH", slug: "case-ih" },
  { name: "Pronar", slug: "pronar" },
  { name: "Bizon", slug: "bizon" },
];

export default function BrandStrip() {
  return (
    <section aria-label="Obsługiwane marki maszyn" className="mb-20">
      <div className="mb-8 text-center">
        <p className="text-red-600 font-black uppercase text-[10px] tracking-[0.3em] mb-2">Pasujemy do Twojej maszyny</p>
        <h2 className="text-2xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">
          Części do wszystkich marek
        </h2>
        <p className="text-slate-500 text-sm font-medium mt-3 max-w-xl mx-auto">
          Oryginały i sprawdzone zamienniki OEM do ciągników i maszyn — polskich i zachodnich.
        </p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
        {BRANDS.map((b) => (
          <Link
            key={b.slug}
            href={`/kategoria/czesci-do-ciagnikow/${b.slug}`}
            prefetch={false}
            className="group bg-white border border-slate-100 rounded-2xl px-4 py-6 flex items-center justify-center text-center hover:border-slate-900 hover:shadow-lg transition-all min-h-[80px]"
          >
            <span className="text-[13px] md:text-base font-black uppercase tracking-tight text-slate-700 group-hover:text-red-600 transition-colors leading-tight">
              {b.name}
            </span>
          </Link>
        ))}
      </div>

      <p className="text-center text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-6">
        Nie widzisz swojej marki? Zadzwoń — dobierzemy część: <span className="text-slate-700">25 788 89 00</span>
      </p>
    </section>
  );
}