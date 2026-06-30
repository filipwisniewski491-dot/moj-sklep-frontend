'use client';

import dynamic from 'next/dynamic';

const DynamicConsentBanner = dynamic(() => import("@/components/ConsentBanner"), { ssr: false });
const DynamicCartDrawer = dynamic(() => import("@/components/CartDrawer"), { ssr: false });
// InstallPWA przeniesiony na GÓRĘ strony (renderowany w layout przed <main>).

export default function GlobalClientComponents() {
  return (
    <>
      <DynamicCartDrawer />
      <DynamicConsentBanner />
    </>
  );
}