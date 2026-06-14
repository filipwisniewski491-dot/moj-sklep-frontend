import type { Metadata, Viewport } from "next";
import "./globals.css";
import CartDrawer from "@/components/CartDrawer";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0f172a',
};

export const metadata: Metadata = {
  title: "CentrumRolnictwa.pl - Części i akcesoria do maszyn rolniczych",
  description: "Największy internetowy katalog części zamiennych. Szybka wysyłka, gwarancja dopasowania i wsparcie ekspertów.",
  metadataBase: new URL('https://centrumrolnictwa.pl'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="pl" 
      // Usunięto zmienne czcionek Geist
      className="h-full antialiased scroll-smooth" 
      suppressHydrationWarning
    >
      <head>
        {/* Optymalizacja połączenia z CDN - to przyspieszy ładowanie obrazów */}
        <link rel="preconnect" href="https://centrumrolnictwa-cdn.b-cdn.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://centrumrolnictwa-cdn.b-cdn.net" />
      </head>
      
      {/* HACK 100/100: Wymuszenie czcionki systemowej. 
        Zero opóźnienia (FCP), brak plików fontów do pobrania. 
      */}
      <body 
        className="min-h-full flex flex-col bg-slate-50 text-slate-900 selection:bg-red-100 selection:text-red-900"
        style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
      >
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <CartDrawer />
      </body>
    </html>
  );
}