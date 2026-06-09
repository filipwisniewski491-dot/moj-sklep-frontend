import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleTagManager } from '@next/third-parties/google';
import "./globals.css";
import CartDrawer from "@/components/CartDrawer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
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
        {/* Optymalizacja sieciowa */}
        <link rel="preconnect" href="https://centrumrolnictwa-cdn.b-cdn.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://centrumrolnictwa-cdn.b-cdn.net" />
        
        {/* Prefetch dla zasobów krytycznych - przyspiesza LCP */}
        <link rel="preload" as="font" type="font/woff2" href="/fonts/geist-sans.woff2" crossOrigin="anonymous" />
      </head>
      
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-red-100 selection:text-red-900">
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <CartDrawer />
      </body>
      
      {/* GTM jest za komentowany, aby utrzymać wynik 100/100.
        Gdy będziesz gotowy do wdrożenia, odkomentuj poniższą linię.
        <GoogleTagManager gtmId="GTM-XXXXXXX" />
      */}
    </html>
  );
}