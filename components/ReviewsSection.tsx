import Link from "next/link";

// Serwerowy komponent — pobiera zatwierdzone opinie z Medusy przez ISR (cache 1h),
// więc zero obciążenia przy każdym wejściu. Renderuje gwiazdki + AggregateRating schema
// (gwiazdki w Google, bo opinie są zbierane na własnej stronie — dozwolone).

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://panel.centrumrolnictwa.com";
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";

type Review = {
  id: string;
  rating: number;
  title?: string | null;
  content: string;
  author_name: string;
  created_at: string;
};

async function getReviews(): Promise<{ reviews: Review[]; count: number; average: number }> {
  try {
    const res = await fetch(`${MEDUSA_URL}/store/reviews`, {
      headers: { "x-publishable-api-key": PUBLISHABLE_KEY },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return { reviews: [], count: 0, average: 0 };
    return await res.json();
  } catch {
    return { reviews: [], count: 0, average: 0 };
  }
}

function Stars({ rating, size = "text-base" }: { rating: number; size?: string }) {
  return (
    <span className={`${size} tracking-tight`} aria-label={`Ocena ${rating} na 5`}>
      <span className="text-amber-400">{"★".repeat(Math.round(rating))}</span>
      <span className="text-slate-200">{"★".repeat(5 - Math.round(rating))}</span>
    </span>
  );
}

export default async function ReviewsSection({ limit = 6 }: { limit?: number }) {
  const { reviews, count, average } = await getReviews();

  if (!count) return null; // nic nie pokazujemy, dopóki nie ma zatwierdzonych opinii

  const shown = reviews.slice(0, limit);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "CentrumRolnictwa.pl",
    url: "https://centrumrolnictwa.pl",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: average.toFixed(1),
      reviewCount: count,
      bestRating: "5",
      worstRating: "1",
    },
  };

  return (
    <section className="mb-20" aria-label="Opinie klientów">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b-2 border-slate-100 pb-6">
        <div>
          <p className="text-red-600 font-black uppercase text-[10px] tracking-[0.3em] mb-2">Zaufali nam rolnicy</p>
          <h2 className="text-2xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">Opinie klientów</h2>
        </div>
        <div className="flex items-center gap-3">
          <Stars rating={average} size="text-2xl" />
          <div className="leading-tight">
            <span className="text-2xl font-black text-slate-900">{average.toFixed(1)}</span>
            <span className="text-slate-400 font-bold text-sm">/5</span>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">{count} opinii</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {shown.map((r) => (
          <article key={r.id} className="bg-white border border-slate-100 rounded-[24px] p-6 flex flex-col gap-3 hover:shadow-lg transition-shadow">
            <Stars rating={r.rating} />
            {r.title && <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight">{r.title}</h3>}
            <p className="text-slate-600 text-sm leading-relaxed flex-1">{r.content}</p>
            <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
              <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs uppercase">
                {r.author_name.charAt(0)}
              </span>
              <div className="leading-tight">
                <p className="text-xs font-black text-slate-900 uppercase tracking-wide">{r.author_name}</p>
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">✓ Zweryfikowana opinia</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/opinie" prefetch={false} className="inline-flex bg-slate-900 text-white px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors">
          Zobacz wszystkie opinie ➔
        </Link>
        <Link href="/opinie#dodaj" prefetch={false} className="inline-flex bg-white border border-slate-200 text-slate-800 px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest hover:border-slate-900 transition-colors">
          Dodaj swoją opinię
        </Link>
      </div>
    </section>
  );
}