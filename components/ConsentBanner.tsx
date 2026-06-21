'use client';

import { useState, useEffect } from 'react';

export default function ConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Sprawdzenie, czy użytkownik podjął już decyzję.
    const consent = localStorage.getItem('cr_consent_status');
    
    if (!consent) {
      // OPÓŹNIENIE ZWIĘKSZONE NA 3.5s - ratuje wynik LCP!
      const timer = setTimeout(() => setIsVisible(true), 3500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleConsent = (granted: boolean) => {
    const status = granted ? 'granted' : 'denied';
    
    // 1. Zapisanie statusu
    localStorage.setItem('cr_consent_status', status);

    // 2. Twardy update dla Google Consent Mode v2
    if (typeof window !== 'undefined') {
      const w = window as any;
      w.dataLayer = w.dataLayer || [];
      
      function gtag(...args: any[]) {
        w.dataLayer.push(args);
      }

      gtag('consent', 'update', {
        'ad_storage': status,
        'ad_user_data': status,
        'ad_personalization': status,
        'analytics_storage': status,
      });

      // 3. Natychmiastowy sygnał do GTM/sGTM, aby uruchomić śledzenie bez odświeżania strony!
      w.dataLayer.push({ event: 'consent_updated' });
    }

    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full z-[999999] p-4 md:p-6 pointer-events-none font-sans">
      <div className="max-w-5xl mx-auto bg-slate-900 text-slate-300 border border-slate-700 p-6 md:p-8 rounded-[32px] shadow-2xl pointer-events-auto relative overflow-hidden flex flex-col md:flex-row items-center gap-6 lg:gap-10">
        
        {/* Dekoracyjne tło */}
        <div className="absolute -left-20 -top-20 w-64 h-64 bg-red-600 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>

        <div className="flex-1 relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🍪</span>
            <h3 className="text-white font-black uppercase tracking-widest text-lg">Twoja prywatność</h3>
          </div>
          <p className="text-sm font-medium leading-relaxed mb-3">
            Używamy ciasteczek i podobnych technologii, aby sklep działał błyskawicznie, a nasze rekomendacje maszyn były idealnie dopasowane do Twojego gospodarstwa. Zgadzasz się na ich użycie?
          </p>
          
          {showDetails && (
            <div className="mt-4 p-4 bg-slate-800 rounded-2xl text-xs space-y-2 border border-slate-700">
              <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                <span className="font-bold text-white">Niezbędne (Techniczne)</span>
                <span className="text-emerald-400 font-black uppercase tracking-widest text-[10px]">Zawsze aktywne</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                <span className="font-bold text-white">Analityczne (Google Analytics)</span>
                <span className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Opcjonalne</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-white">Marketingowe (Google/Meta Ads)</span>
                <span className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Opcjonalne</span>
              </div>
            </div>
          )}
          
          <button 
            onClick={() => setShowDetails(!showDetails)} 
            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors underline underline-offset-4 mt-2"
          >
            {showDetails ? 'Ukryj szczegóły' : 'Pokaż szczegóły techniczne'}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto relative z-10 shrink-0">
          <button 
            onClick={() => handleConsent(false)}
            className="px-6 py-4 rounded-xl bg-slate-800 text-slate-300 font-black text-[11px] uppercase tracking-widest hover:bg-slate-700 hover:text-white transition-all shadow-md active:scale-95"
          >
            Odrzuć opcjonalne
          </button>
          <button 
            onClick={() => handleConsent(true)}
            className="px-8 py-4 rounded-xl bg-red-600 text-white font-black text-[12px] uppercase tracking-widest hover:bg-red-500 transition-all shadow-lg shadow-red-600/30 active:scale-95"
          >
            Akceptuję wszystko
          </button>
        </div>

      </div>
    </div>
  );
}