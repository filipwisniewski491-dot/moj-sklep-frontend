'use client';

import React, { useEffect, useState } from 'react';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Przechwytujemy zdarzenie z przeglądarki, gdy jest gotowa na instalację
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Jeśli przeglądarka (np. Safari na iPhonie) blokuje automatyczny prompt:
      alert("Aby zainstalować aplikację na tym urządzeniu (np. iPhone), kliknij ikonę 'Udostępnij' (kwadrat ze strzałką na dole ekranu), a następnie wybierz 'Do ekranu początkowego'.");
      return;
    }
    
    // Automatycznie wywołuje systemowe okno instalacji
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsDismissed(true);
    }
  };

  // Jeśli rolnik kliknął "X", ukrywamy baner
  if (isDismissed) return null;

  return (
    <div className="bg-slate-900 text-white w-full px-4 py-3 flex items-center justify-between text-xs relative z-[100] border-b border-slate-800">
      <div className="flex items-center gap-3">
        <div className="bg-slate-800 p-2 rounded-lg text-lg leading-none shadow-inner">
          📱
        </div>
        <div>
          <p className="font-black uppercase tracking-widest leading-tight text-[10px] sm:text-xs text-white">
            Aplikacja CentrumRolnictwa
          </p>
          <p className="font-bold text-[9px] text-slate-400 uppercase tracking-widest hidden sm:block mt-0.5">
            Szybsze zakupy i dostęp offline
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-4 shrink-0">
        <button 
          onClick={handleInstall}
          className="bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase tracking-widest px-5 py-2.5 rounded-lg shadow-md transition-colors active:scale-95"
        >
          Pobierz
        </button>
        <button 
          onClick={() => setIsDismissed(true)}
          className="text-slate-500 hover:text-white font-black text-xl leading-none px-2 transition-colors"
          aria-label="Zamknij"
        >
          ×
        </button>
      </div>
    </div>
  );
}