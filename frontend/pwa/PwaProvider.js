'use client';
import { useEffect } from 'react';
import { registerServiceWorker } from './pwaRegister';
import usePWA from './usePWA';
import PwaInstallBanner from './PwaInstallBanner';
import OfflineIndicator from './OfflineIndicator';

export default function PwaProvider({ children }) {
  const { isInstallable, installApp, isOnline } = usePWA();

  useEffect(() => {
    // Register PWA service worker on mount
    registerServiceWorker();
  }, []);

  return (
    <>
      {children}
      <PwaInstallBanner isInstallable={isInstallable} installApp={installApp} />
      <OfflineIndicator isOnline={isOnline} />
    </>
  );
}
