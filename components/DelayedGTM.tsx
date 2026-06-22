'use client';

import { useEffect } from 'react';

export default function DelayedGTM() {
  useEffect(() => {
    const loadGTM = () => {
      // Zabezpieczenie przed podwójnym załadowaniem
      if ((window as any).gtmLoaded) return;
      (window as any).gtmLoaded = true;

      // Oficjalny kod ładujący Google Tag Manager
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';(j as any).async=true;(j as any).src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window as any, document, 'script', 'dataLayer', 'GTM-NBWX4LWC');
    };

    // 1. Zabezpieczenie: jeśli użytkownik nic nie zrobi, ładujemy GTM po 5 sekundach
    const timer = setTimeout(loadGTM, 5000);

    // 2. Nasłuchiwanie na pierwszy ruch użytkownika (scroll, dotknięcie ekranu, ruch myszką)
    const events = ['scroll', 'mousemove', 'touchstart', 'keydown', 'click'];
    
    const triggerGTM = () => {
       loadGTM();
       events.forEach(e => window.removeEventListener(e, triggerGTM));
       clearTimeout(timer);
    };

    events.forEach(e => window.addEventListener(e, triggerGTM, { once: true }));

    return () => {
      clearTimeout(timer);
      events.forEach(e => window.removeEventListener(e, triggerGTM));
    };
  }, []);

  return null;
}