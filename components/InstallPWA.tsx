'use client';

import React, { useEffect, useState } from 'react';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl z-[100] border border-slate-700 animate-in slide-in-from-bottom-10">
      <div className="flex items-center gap-4">
        <div className="bg-red-600 p-2 rounded-lg text-xl">🚜</div>
        <div className="flex-1">
          <p className="font-black text-xs uppercase tracking-widest leading-none mb-1">Zainstaluj aplikację</p>
          <p className="text-[10px] text-slate-400">Płynniejsze zakupy i dostęp offline.</p>
        </div>
        <button onClick={handleInstall} className="bg-white text-slate-900 font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-lg">
          Instaluj
        </button>
      </div>
    </div>
  );
}