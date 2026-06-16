'use client';

import React, { useEffect, useState } from 'react';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsReady(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      alert("Twoja przeglądarka nie wspiera automatycznej instalacji. Dodaj stronę do ekranu głównego ręcznie w ustawieniach przeglądarki (ikona Udostępnij/Trzy kropki).");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsReady(false);
    }
  };

  // Jeśli przeglądarka nie pozwala na instalację (np. iOS), 
  // pokażemy instrukcję zamiast błędu.
  return (
    <button 
      onClick={handleInstall}
      className="flex items-center gap-3 bg-red-600 text-white font-black text-[11px] uppercase tracking-widest p-4 rounded-xl shadow-lg hover:bg-red-700 transition-all active:scale-95"
    >
      <span className="text-lg">📲</span> Zainstaluj aplikację
    </button>
  );
}