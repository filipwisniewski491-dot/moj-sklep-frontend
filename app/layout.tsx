import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// 🔥 IMPORT MODUŁU KOSZYKA
import CartDrawer from "@/components/CartDrawer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CentrumRolnictwa.pl - Części i akcesoria do maszyn rolniczych",
  description: "Największy internetowy katalog części zamiennych. Szybka wysyłka, gwarancja dopasowania i wsparcie ekspertów.",
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
        {/* 🚀 OPTYMALIZACJA: Preconnect do serwerów z obrazkami. 
            Przeglądarka nawiąże połączenie, zanim jeszcze użytkownik zacznie przewijać stronę. */}
        <link rel="preconnect" href="https://centrumrolnictwa-cdn.b-cdn.net" />
        <link rel="preconnect" href="https://images.unsplash.com" />
      </head>
      <body className="min-h-full flex flex-col">
        {/* Główna zawartość strony */}
        <main className="flex-grow">
          {children}
        </main>
        
        {/* 🔥 GLOBALNY KOSZYK (SLIDE-OUT DRAWER) */}
        <CartDrawer />
      </body>
    </html>
  );
}