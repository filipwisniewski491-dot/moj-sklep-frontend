import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CartDrawer from "@/components/CartDrawer";

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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scroll-smooth`} 
      suppressHydrationWarning
    >
      <head>
        {/* Optymalizacja połączenia z CDN - to przyspieszy ładowanie obrazów */}
        <link rel="preconnect" href="https://centrumrolnictwa-cdn.b-cdn.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://centrumrolnictwa-cdn.b-cdn.net" />
        
        {/* UWAGA: Usunąłem tutaj ręczny link "preload" dla fontów. 
          Next.js automatycznie zarządza tym procesem i ma własny system cache.
          Ręczne wymuszanie ścieżki /fonts/... generowało błąd 404, który
          opóźniał renderowanie strony.
        */}
      </head>
      
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-red-100 selection:text-red-900">
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <CartDrawer />
      </body>
      
      {/* GTM jest wyłączony dla zachowania 100/100 punktów. 
        Jeśli potrzebujesz go włączyć, użyj komponentu:
        <GoogleTagManager gtmId="GTM-XXXXXXX" />
      */}
    </html>
  );
}