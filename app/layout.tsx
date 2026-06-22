import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleTagManager } from '@next/third-parties/google';
import Script from 'next/script';
import dynamic from 'next/dynamic';
import "./globals.css";

// USUNIĘTO { ssr: false } - Next.js i tak załaduje ich JS asynchronicznie
const DynamicConsentBanner = dynamic(() => import("@/components/ConsentBanner"));
const DynamicCartDrawer = dynamic(() => import("@/components/CartDrawer"));
const DynamicInstallPWA = dynamic(() => import("@/components/InstallPWA"));

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: 'swap' });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: 'swap' });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, 
  userScalable: true, 
  themeColor: '#0f172a',
};

export const metadata: Metadata = {
  title: "CentrumRolnictwa.pl - Części i akcesoria do maszyn rolniczych",
  description: "Największy internetowy katalog części zamiennych. Szybka wysyłka, gwarancja dopasowania i wsparcie ekspertów.",
  metadataBase: new URL('https://centrumrolnictwa.pl'),
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'CentrumRolnictwa' },
  formatDetection: { telephone: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pl" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scroll-smooth`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://centrumrolnictwa-cdn.b-cdn.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://centrumrolnictwa-cdn.b-cdn.net" />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-red-100 selection:text-red-900 relative">
        <Script id="google-consent-mode" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('consent', 'default', { 'ad_storage': 'denied', 'ad_user_data': 'denied', 'ad_personalization': 'denied', 'analytics_storage': 'denied', 'wait_for_update': 500 });` }} />
        <GoogleTagManager gtmId="GTM-NBWX4LWC" />
        <DynamicInstallPWA />
        <main className="flex-1 flex flex-col">{children}</main>
        <DynamicCartDrawer />
        <DynamicConsentBanner />
      </body>
    </html>
  );
}