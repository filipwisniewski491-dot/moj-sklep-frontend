'use client';

import React, { useEffect, useState } from 'react';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    if (localStorage.getItem('pwa_banner_dismissed')) {
      setIsDismissed(true);
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Skoro nie wrzuciłeś obrazków, Chrome zablokuje natywne okienko. 
      // Zamiast tego rolnik zobaczy tę instrukcję zastępczą:
      alert("Aby zainstalować aplikację na tym urządzeniu, kliknij w przeglądarce ikonę 'Udostępnij' (lub menu z trzema kropkami) i wybierz 'Dodaj do ekranu głównego / ekranu początkowego'.");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa_banner_dismissed', 'true');
  };

  // ZMIANA: Usunięto !deferredPrompt. Teraz baner pokaże się zawsze po załadowaniu strony.
  if (!isMounted || isDismissed) return null;

  return (
    <div className="bg-slate-100 border-b border-slate-200 w-full px-4 py-2.5 flex items-center justify-between z-50">
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
        <button 
          onClick={handleInstall}
          className="text-[10px] font-black uppercase tracking-widest text-white bg-slate-900 px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
        >
          Pobierz
        </button>
        <button 
          onClick={handleDismiss}
          className="text-slate-400 hover:text-slate-900 font-bold px-1 text-lg leading-none transition-colors"
          aria-label="Zamknij"
        >
          ×
        </button>
      </div>
    </div>
  );
}