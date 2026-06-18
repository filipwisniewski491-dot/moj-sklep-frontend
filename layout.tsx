import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script"; // <-- IMPORT OPTYMALIZATORA SKRYPTÓW
import "./globals.css";
import CartDrawer from "@/components/CartDrawer";
import ConsentBanner from "@/components/ConsentBanner"; 
import InstallPWA from "@/components/InstallPWA";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, 
  userScalable: false, 
  themeColor: '#0f172a',
};

export const metadata: Metadata = {
  title: "CentrumRolnictwa.pl - Części i akcesoria do maszyn rolniczych",
  description: "Największy internetowy katalog części zamiennych. Szybka wysyłka, gwarancja dopasowania i wsparcie ekspertów.",
  metadataBase: new URL('https://centrumrolnictwa.pl'),
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CentrumRolnictwa',
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="pl" 
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scroll-smooth`} 
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://centrumrolnictwa-cdn.b-cdn.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://centrumrolnictwa-cdn.b-cdn.net" />
      </head>
      
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-red-100 selection:text-red-900 relative">
        
        {/* --- BLOK ANALITYKI NEXT.JS (ZOPTYMALIZOWANY) --- */}
        
        {/* 1. Consent Mode: Musi załadować się natychmiast, żeby blokować ciastka przed wyborem użytkownika */}
        <Script
          id="google-consent"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              
              gtag('consent', 'default', {
                'ad_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied',
                'analytics_storage': 'denied',
                'wait_for_update': 500
              });
            `,
          }}
        />

        {/* 2. Skrypt Google: Ładuje się dopiero po wyświetleniu strony (afterInteractive) */}
        <Script 
          src="https://www.googletagmanager.com/gtag/js?id=G-TWÓJ_KOD_TUTAJ" 
          strategy="afterInteractive" 
        />
        
        {/* 3. Inicjalizacja Analytics: Działa asynchronicznie */}
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              
              gtag('config', 'G-TWÓJ_KOD_TUTAJ');
            `,
          }}
        />
        {/* --- KONIEC BLOKU ANALITYKI --- */}

        {/* BANER PWA */}
        <InstallPWA />
        
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        
        <CartDrawer />
        <ConsentBanner />
      </body>
    </html>
  );
}