'use client';

import { useEffect } from 'react';
import { usePWADetection } from '@/hooks/usePWADetection';

export function PWAEnforcer() {
  const detection = usePWADetection();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Force fullscreen behavior on iOS PWA
    if (detection.isPWA && detection.isIOS) {
      // Hide address bar by scrolling
      window.scrollTo(0, 1);
      
      // Set viewport height to window height
      const setViewportHeight = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      };

      setViewportHeight();
      window.addEventListener('resize', setViewportHeight);
      window.addEventListener('orientationchange', setViewportHeight);

      // Add fullscreen CSS variables
      document.documentElement.style.setProperty('--safe-area-inset-top', 'env(safe-area-inset-top)');
      document.documentElement.style.setProperty('--safe-area-inset-bottom', 'env(safe-area-inset-bottom)');
      document.documentElement.style.setProperty('--safe-area-inset-left', 'env(safe-area-inset-left)');
      document.documentElement.style.setProperty('--safe-area-inset-right', 'env(safe-area-inset-right)');

      return () => {
        window.removeEventListener('resize', setViewportHeight);
        window.removeEventListener('orientationchange', setViewportHeight);
      };
    }
  }, [detection.isPWA, detection.isIOS]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Add PWA class to body and html for CSS targeting
    if (detection.isPWA) {
      document.documentElement.classList.add('pwa-fullscreen');
      document.body.classList.add('pwa-installed');
      if (detection.isIOS) {
        document.body.classList.add('pwa-ios');
      }
      if (detection.isAndroid) {
        document.body.classList.add('pwa-android');
      }
    } else {
      document.documentElement.classList.remove('pwa-fullscreen');
      document.body.classList.remove('pwa-installed', 'pwa-ios', 'pwa-android');
    }

    return () => {
      document.documentElement.classList.remove('pwa-fullscreen');
      document.body.classList.remove('pwa-installed', 'pwa-ios', 'pwa-android');
    };
  }, [detection.isPWA, detection.isIOS, detection.isAndroid]);

  return null; // This component doesn't render anything
}