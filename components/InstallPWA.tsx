'use client';

import React, { useEffect, useState } from 'react';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      alert("Twoja przeglądarka blokuje automatyczną instalację. Kliknij ikonę Udostępnij (lub menu z trzema kropkami) w swojej przeglądarce i wybierz 'Dodaj do ekranu głównego'.");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-[100] animate-in fade-in slide-in-from-bottom-5">
      <button 
        onClick={handleInstall}
        className="flex items-center gap-3 bg-red-600 text-white font-black text-[11px] uppercase tracking-widest px-5 py-4 md:p-4 rounded-full shadow-2xl shadow-red-900/40 hover:bg-red-700 transition-all active:scale-95 border-2 border-white/20 hover:border-white/50 group"
      >
        <span className="text-xl group-hover:animate-bounce">📲</span> 
        <span className="hidden sm:block">Zainstaluj aplikację</span>
        <span className="block sm:hidden">Zainstaluj</span>
      </button>
    </div>
  );
}