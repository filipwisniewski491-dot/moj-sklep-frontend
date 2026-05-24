import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CartDrawer from "@/components/CartDrawer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  weight: ['400', '500', '600', '700'],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  weight: ['400', '500', '700'],
});

export const metadata: Metadata = {
  title: "CentrumRolnictwa.pl - Części i akcesoria do maszyn rolniczych",
  description: "Największy internetowy katalog części zamiennych. Szybka wysyłka, gwarancja dopasowania i wsparcie ekspertów.",
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: "CentrumRolnictwa.pl - Części i akcesoria do maszyn rolniczych",
    description: "Największy internetowy katalog części zamiennych. Szybka wysyłka, gwarancja dopasowania i wsparcie ekspertów.",
    images: [
      {
        url: 'https://centrumrolnictwa-cdn.b-cdn.net/logo-og.jpg', // jeśli masz
        width: 1200,
        height: 630,
      },
    ],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Kluczowe preconnect dla LCP */}
        <link rel="preconnect" href="https://centrumrolnictwa-cdn.b-cdn.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://centrumrolnictwa-cdn.b-cdn.net" />
        
        {/* Preconnect do czcionek */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
        <CartDrawer />
      </body>
    </html>
  );
}