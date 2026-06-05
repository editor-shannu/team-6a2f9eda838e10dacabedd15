'use client';
import { useState, useEffect } from 'react';

export default function OfflineIndicator({ isOnline }) {
  const [showStatus, setShowStatus] = useState(false);
  const [animationClass, setAnimationClass] = useState('animate-fade-in');

  useEffect(() => {
    // Show status if user goes offline
    if (!isOnline) {
      setShowStatus(true);
      setAnimationClass('animate-slide-down');
    } else {
      // If user comes back online, briefly show "Back Online" and then hide
      if (showStatus) {
        setAnimationClass('bg-emerald-500 text-white border-emerald-600/20');
        const timer = setTimeout(() => {
          setShowStatus(false);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [isOnline]);

  if (!showStatus) return null;

  return (
    <div className={`fixed top-14 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2 rounded-full border shadow-lg flex items-center gap-2 transition-all duration-300 text-xs font-semibold ${
      isOnline 
        ? 'bg-emerald-500/90 text-white border-emerald-600/30 backdrop-blur-md'
        : 'bg-amber-500/90 text-white border-amber-600/30 backdrop-blur-md'
    }`}>
      {isOnline ? (
        <>
          <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
          <span>Back Online! Syncing...</span>
        </>
      ) : (
        <>
          <span className="w-2 h-2 rounded-full bg-red-200 animate-ping"></span>
          <span>Offline Mode: Using cached Q&As</span>
        </>
      )}
    </div>
  );
}
