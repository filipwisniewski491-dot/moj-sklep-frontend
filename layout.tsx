import type { Metadata, Viewport } from "next";
import "./globals.css";
import CartDrawer from "@/components/CartDrawer";
import InstallPWA from "@/components/InstallPWA";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, // Ustawione na 1 dla poprawnego działania PWA i uniknięcia zoomowania klawiatury
  userScalable: false, // Dodane dla pełnego doświadczenia aplikacji
  themeColor: '#0f172a',
};

export const metadata: Metadata = {
  title: "CentrumRolnictwa.pl - Części i akcesoria do maszyn rolniczych",
  description: "Największy internetowy katalog części zamiennych. Szybka wysyłka, gwarancja dopasowania i wsparcie ekspertów.",
  metadataBase: new URL('https://centrumrolnictwa.pl'),
  manifest: '/manifest.json', // Dodane dla PWA
  appleWebApp: { // Dodane dla wsparcia iOS
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CentrumRolnictwa',
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
      className="h-full antialiased scroll-smooth" 
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://centrumrolnictwa-cdn.b-cdn.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://centrumrolnictwa-cdn.b-cdn.net" />
      </head>
      
      <body 
        className="min-h-full flex flex-col bg-slate-50 text-slate-900 selection:bg-red-100 selection:text-red-900"
        style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
      >
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <CartDrawer />
        <InstallPWA /> {/* Dodany komponent instalacji aplikacji */}
      </body>
    </html>
  );
}