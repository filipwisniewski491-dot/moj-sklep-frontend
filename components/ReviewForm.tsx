'use client';

import React, { useState } from "react";

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://panel.centrumrolnictwa.com";
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";

// Lekka wyspa kliencka — formularz wysyła opinię przez POST /store/reviews.
// Opinia trafia jako "pending" i nie pojawi się, dopóki nie zatwierdzisz jej w /admin/opinie.
export default function ReviewForm() {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const submit = async () => {
    if (content.trim().length < 3 || !name.trim()) {
      setErrorMsg("Podaj imię i treść opinii.");
      setStatus("error");
      return;
    }
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch(`${MEDUSA_URL}/store/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          rating,
          author_name: name.trim(),
          title: title.trim() || null,
          content: content.trim(),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Nie udało się wysłać opinii.");
      }
      setStatus("ok");
      setName(""); setTitle(""); setContent(""); setRating(5);
    } catch (e: any) {
      setErrorMsg(e?.message || "Błąd wysyłania.");
      setStatus("error");
    }
  };

  if (status === "ok") {
    return (
      <div id="dodaj" className="bg-emerald-50 border border-emerald-200 rounded-[24px] p-8 text-center">
        <span className="text-4xl block mb-3">✓</span>
        <h3 className="font-black text-emerald-800 uppercase tracking-widest text-sm mb-1">Dziękujemy za opinię!</h3>
        <p className="text-emerald-700 text-sm font-medium">Pojawi się po zatwierdzeniu przez nasz zespół.</p>
      </div>
    );
  }

  return (
    <div id="dodaj" className="bg-white border border-slate-100 rounded-[24px] p-6 md:p-8 shadow-sm">
      <h3 className="font-black text-slate-900 uppercase tracking-tight text-lg mb-6">Dodaj swoją opinię</h3>

      <div className="mb-5">
        <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">Twoja ocena</label>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              aria-label={`Oceń na ${n}`}
              className="text-3xl leading-none transition-colors"
            >
              <span className={n <= (hover || rating) ? "text-amber-400" : "text-slate-200"}>★</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <input
          type="text" value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Imię (np. Jan z Lubelskiego)" maxLength={80}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-slate-900 outline-none"
        />
        <input
          type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="Tytuł (opcjonalnie)" maxLength={120}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-slate-900 outline-none"
        />
      </div>

      <textarea
        value={content} onChange={(e) => setContent(e.target.value)}
        placeholder="Napisz, jak minęła współpraca — dostawa, dopasowanie części, obsługa..."
        rows={4} maxLength={2000}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-slate-900 outline-none resize-none mb-4"
      />

      {status === "error" && <p className="text-red-600 text-sm font-bold mb-4">{errorMsg}</p>}

      <button
        type="button" onClick={submit} disabled={status === "sending"}
        className="bg-slate-900 text-white px-8 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors disabled:opacity-50 w-full sm:w-auto"
      >
        {status === "sending" ? "Wysyłanie..." : "Wyślij opinię"}
      </button>
      <p className="text-[11px] text-slate-400 mt-3 font-medium">Opinia pojawi się po weryfikacji przez nasz zespół.</p>
    </div>
  );
}