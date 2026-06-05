'use client';
import { useState, useEffect } from 'react';

export default function PwaInstallBanner({ isInstallable, installApp }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only display if installable and user hasn't dismissed it in this session
    const isDismissed = sessionStorage.getItem('pwa-prompt-dismissed');
    if (isInstallable && !isDismissed) {
      // Small timeout to not annoy the user immediately upon landing
      const timer = setTimeout(() => setVisible(true), 2500);
      return () => clearTimeout(timer);
    }
  }, [isInstallable]);

  const handleInstallClick = async () => {
    const success = await installApp();
    if (success) {
      setVisible(false);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[9999] animate-slide-up">
      <div className="relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/90 backdrop-blur-lg p-5 shadow-2xl transition-all">
        {/* Decorative subtle background gradient */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-[var(--color-primary)]/15 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="flex items-start gap-4">
          {/* Logo container */}
          <div className="w-12 h-12 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          </div>
          
          {/* Content details */}
          <div className="flex-1">
            <h3 className="text-sm font-bold text-[var(--color-text)]">Install PrashnaSārathi</h3>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
              Add to your home screen for quick offline access, push notifications, and a standalone app experience.
            </p>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleInstallClick}
                className="btn-primary btn-sm !px-4 !py-1.5 text-xs font-semibold rounded-md shadow-md shadow-[var(--color-primary)]/20"
              >
                Install App
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-tertiary)] rounded-md transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
          
          {/* Close X icon */}
          <button 
            onClick={handleDismiss}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors p-1"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M2 2L14 14M14 2L2 14" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
