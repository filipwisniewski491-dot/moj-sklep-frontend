import type { Metadata, Viewport } from "next";
import "./globals.css";
import CartDrawer from "@/components/CartDrawer";
import InstallPWA from "@/components/InstallPWA";

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
  manifest: '/manifest.json', 
  appleWebApp: { 
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
        {/* BANER PWA NA SAMEJ GÓRZE EKRANU */}
        <InstallPWA /> 
        
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        
        <CartDrawer />
      </body>
    </html>
  );
}