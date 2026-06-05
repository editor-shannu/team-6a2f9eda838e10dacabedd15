'use client';
import { useEffect } from 'react';
import { registerServiceWorker } from './pwaRegister';

export default function PwaProvider({ children }) {
  useEffect(() => {
    // Register PWA service worker on mount
    registerServiceWorker();
  }, []);

  return (
    <>
      {children}
    </>
  );
}
