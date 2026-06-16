'use client';

import React, { useEffect, useState } from 'react';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true); // Upewniamy się, że komponent renderuje się dopiero w przeglądarce

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      alert("Twoja przeglądarka blokuje automatyczny instalator. Aby zainstalować aplikację (np. na iPhonie), kliknij ikonę 'Udostępnij' i wybierz 'Do ekranu początkowego'.");
      return;
    }
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsDismissed(true);
    }
  };

  // Nie pokazujemy paska, dopóki strona się w pełni nie załaduje, lub gdy rolnik go zamknął
  if (!isMounted || isDismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-slate-900 text-white px-4 py-4 flex items-center justify-between text-xs z-[999999] shadow-[0_-10px_40px_rgba(0,0,0,0.3)] border-t-2 border-red-600">
      <div className="flex items-center gap-4">
        <div className="bg-white/10 p-2.5 rounded-xl text-2xl leading-none">
          🚜
        </div>
        <div>
          <p className="font-black uppercase tracking-widest leading-tight text-[11px] sm:text-sm text-white mb-0.5">
            Zainstaluj Aplikację
          </p>
          <p className="font-bold text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-widest">
            Kupuj szybciej, nawet na polu
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-4 shrink-0 ml-2">
        <button 
          onClick={handleInstall}
          className="bg-red-600 hover:bg-red-700 text-white font-black text-[10px] sm:text-xs uppercase tracking-widest px-4 sm:px-6 py-3 rounded-xl shadow-lg transition-colors active:scale-95"
        >
          Pobierz
        </button>
        <button 
          onClick={() => setIsDismissed(true)}
          className="text-slate-400 hover:text-white font-black text-2xl leading-none p-2 transition-colors"
          aria-label="Zamknij"
        >
          ×
        </button>
      </div>
    </div>
  );
}