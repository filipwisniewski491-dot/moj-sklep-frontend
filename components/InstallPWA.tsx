'use client';

import React, { useEffect, useState } from 'react';

// Renderowany na samej GÓRZE strony (w layout, przed <main>), w zwykłym przepływie
// (bez position:fixed). Na mobile: baner instalacji aplikacji. Na desktopie: pasek
// zaufania (darmowa dostawa, wysyłka, telefon, gwarancja) - buduje wiarygodność.
export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (localStorage.getItem('pwa_banner_dismissed')) setIsDismissed(true);

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      alert("Aby zainstalować aplikację na tym urządzeniu, kliknij w przeglądarce ikonę 'Udostępnij' (lub menu z trzema kropkami) i wybierz 'Dodaj do ekranu głównego'.");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa_banner_dismissed', 'true');
  };

  // SSR zwraca null (brak window/localStorage) - hydratacja dorenderuje na kliencie.
  if (!isMounted) return null;

  return (
    <>
      {/* DESKTOP: pasek zaufania - zawsze widoczny na górze (BEZ telefonu - jest w pasku Header niżej) */}
      <div className="hidden md:flex bg-slate-900 text-white text-[11px] font-bold tracking-wide justify-center items-center gap-5 lg:gap-8 px-4 py-2">
        <span className="flex items-center gap-1.5"><span className="text-emerald-400">🚚</span> Darmowa dostawa od 500 zł</span>
        <span className="text-slate-600">•</span>
        <span className="flex items-center gap-1.5"><span className="text-amber-400">⏱</span> Wysyłka w 24h</span>
        <span className="text-slate-600">•</span>
        <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> Gwarancja dopasowania</span>
      </div>

      {/* MOBILE: baner instalacji aplikacji - góra strony, bez przyklejenia */}
      {!isDismissed && (
        <div className="md:hidden bg-slate-100 border-b border-slate-200 w-full px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg shadow-sm border border-slate-200 flex items-center justify-center text-lg leading-none shrink-0">
              🚜
            </div>
            <div className="flex flex-col">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 leading-none mb-0.5">
                Aplikacja CentrumRolnictwa
              </p>
              <p className="text-[9px] font-bold text-slate-600 leading-none">
                Zamawiaj części bezpośrednio z pola
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-2">
            <button onClick={handleInstall} className="text-[10px] font-black uppercase tracking-widest text-white bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
              Pobierz
            </button>
            <button onClick={handleDismiss} className="text-slate-400 hover:text-slate-900 font-bold px-1 text-lg leading-none transition-colors" aria-label="Zamknij">
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
}