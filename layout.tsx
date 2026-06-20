import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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
        
        {/* Ramka zapasowa dla GTM */}
        <noscript>
          <iframe 
            src="https://www.googletagmanager.com/ns.html?id=GTM-NKJ6VB9"
            height="0" 
            width="0" 
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        
        {/* 1. Consent Mode: Musi załadować się natychmiast */}
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

        {/* 2. Google Tag Manager */}
        <Script
          id="gtm-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-NKJ6VB9');
            `,
          }}
        />

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