'use client';

import React, { useState, useCallback } from "react";

// Panel moderacji. Woła /api/admin/reviews (nasz bezpieczny proxy), który trzyma
// token mod_... server-side. Hasło idzie w nagłówku do proxy — nie do Medusy wprost.
export default function AdminOpiniePage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async (pass: string) => {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/reviews?status=pending", {
        headers: { "x-panel-password": pass },
        cache: "no-store",
      });
      if (res.status === 401) {
        setMsg("Nieprawidłowe hasło.");
        setAuthed(false);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setReviews(data.reviews || []);
      setAuthed(true);
    } catch {
      setMsg("Błąd połączenia.");
    }
    setLoading(false);
  }, []);

  const moderate = async (id: string, action: "approve" | "reject") => {
    setMsg("");
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-panel-password": password },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Błąd.");
      setReviews((prev) => prev.filter((r) => r.id !== id));
      setMsg(data.message);
    } catch (e: any) {
      setMsg(e?.message || "Błąd moderacji.");
    }
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-100 rounded-[24px] p-8 w-full max-w-sm shadow-sm">
          <h1 className="font-black text-slate-900 uppercase tracking-tight text-lg mb-6">Panel opinii</h1>
          <input
            type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load(password)}
            placeholder="Hasło panelu"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-slate-900 outline-none mb-4"
          />
          {msg && <p className="text-red-600 text-sm font-bold mb-4">{msg}</p>}
          <button
            type="button" onClick={() => load(password)} disabled={loading}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors w-full disabled:opacity-50"
          >
            {loading ? "..." : "Zaloguj"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-black text-slate-900 uppercase tracking-tight text-xl">Opinie do moderacji</h1>
          <button type="button" onClick={() => load(password)} className="text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-lg border border-slate-200 hover:border-slate-900 transition-colors">
            Odśwież
          </button>
        </div>

        {msg && <p className="text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm font-bold mb-4">{msg}</p>}

        {reviews.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-[24px] p-12 text-center text-slate-500 font-bold uppercase tracking-widest text-sm">
            Brak opinii oczekujących ✓
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {reviews.map((r) => (
              <div key={r.id} className="bg-white border border-slate-100 rounded-[20px] p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-amber-400 text-lg">{"★".repeat(r.rating)}<span className="text-slate-200">{"★".repeat(5 - r.rating)}</span></span>
                  <span className="font-black text-slate-900 text-sm uppercase tracking-wide">{r.author_name}</span>
                  {r.product_id && <span className="text-[10px] text-slate-400 font-bold">produkt: {r.product_id}</span>}
                </div>
                {r.title && <p className="font-bold text-slate-800 text-sm mb-1">{r.title}</p>}
                <p className="text-slate-600 text-sm leading-relaxed mb-4">{r.content}</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => moderate(r.id, "approve")} className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-colors">
                    ✓ Zatwierdź
                  </button>
                  <button type="button" onClick={() => moderate(r.id, "reject")} className="bg-white border border-red-200 text-red-600 px-5 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-red-50 transition-colors">
                    ✕ Odrzuć
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}