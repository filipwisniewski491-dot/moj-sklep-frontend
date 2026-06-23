'use client';

import dynamic from 'next/dynamic';

const DynamicConsentBanner = dynamic(() => import("@/components/ConsentBanner"), { ssr: false });
const DynamicCartDrawer = dynamic(() => import("@/components/CartDrawer"), { ssr: false });
const DynamicInstallPWA = dynamic(() => import("@/components/InstallPWA"), { ssr: false });

export default function GlobalClientComponents() {
  return (
    <>
      <DynamicInstallPWA />
      <DynamicCartDrawer />
      <DynamicConsentBanner />
    </>
  );
}