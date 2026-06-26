'use client';

import React, { useState } from 'react';

export default function FaqSection({ faqs }: { faqs: any[] }) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  if (!faqs || faqs.length === 0) return null;

  // Schema.org FAQPage - rich snippet (rozwijane pytania w Google)
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq: any) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <div className="max-w-7xl mx-auto px-6 mt-12 mb-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <h3 className="text-2xl font-black text-slate-900 mb-6">Najczęściej zadawane pytania (FAQ)</h3>
      <div className="space-y-4">
        {faqs.map((faq: any, idx: number) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all shadow-sm hover:shadow-md">
            <button
              aria-label={activeFaq === idx ? "Zwiń odpowiedź" : "Rozwiń odpowiedź"}
              aria-expanded={activeFaq === idx}
              onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
              className="w-full px-6 py-5 flex justify-between items-center text-left focus:outline-none min-h-[48px]"
            >
              <span className="font-bold text-slate-900 pr-4">{faq.question}</span>
              <span className={`text-red-600 font-black text-2xl transition-transform ${activeFaq === idx ? 'rotate-45' : ''}`}>+</span>
            </button>
            {activeFaq === idx && (
              <div className="px-6 pb-5 text-slate-700 text-sm leading-relaxed border-t border-slate-50 pt-4">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}