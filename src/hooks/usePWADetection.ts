'use client';

import { useState, useEffect } from 'react';

export interface PWADetectionResult {
  isPWA: boolean;
  isStandalone: boolean;
  isFullscreen: boolean;
  isBrowser: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isChrome: boolean;
  displayMode: 'browser' | 'standalone' | 'fullscreen' | 'minimal-ui';
  canInstall: boolean;
}

export function usePWADetection(): PWADetectionResult {
  const [detection, setDetection] = useState<PWADetectionResult>({
    isPWA: false,
    isStandalone: false,
    isFullscreen: false,
    isBrowser: true,
    isIOS: false,
    isAndroid: false,
    isSafari: false,
    isChrome: false,
    displayMode: 'browser',
    canInstall: false,
  });
  
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Set client flag to avoid hydration issues
    setIsClient(true);
    
    const detectEnvironment = () => {
      if (typeof window === 'undefined') return;
      
      const userAgent = navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(userAgent);
      const isAndroid = /android/.test(userAgent);
      const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
      const isChrome = /chrome/.test(userAgent);

      // Check if running as PWA
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
      
      // iOS specific PWA detection
      const isIOSStandalone = isIOS && (window.navigator as any).standalone === true;
      
      // Combined PWA detection
      const isPWA = isStandalone || isFullscreen || isIOSStandalone;
      
      // Determine display mode
      let displayMode: PWADetectionResult['displayMode'] = 'browser';
      if (isFullscreen) displayMode = 'fullscreen';
      else if (isStandalone || isIOSStandalone) displayMode = 'standalone';
      else if (window.matchMedia('(display-mode: minimal-ui)').matches) displayMode = 'minimal-ui';

      // Check if app can be installed (beforeinstallprompt support)
      const canInstall = 'BeforeInstallPromptEvent' in window || 
                        ('serviceWorker' in navigator && !isPWA);

      setDetection({
        isPWA,
        isStandalone: isStandalone || isIOSStandalone,
        isFullscreen,
        isBrowser: !isPWA,
        isIOS,
        isAndroid,
        isSafari,
        isChrome,
        displayMode,
        canInstall: canInstall && !isPWA,
      });
    };

    // Initial detection
    detectEnvironment();

    // Listen for display mode changes
    const mediaQueries = [
      window.matchMedia('(display-mode: standalone)'),
      window.matchMedia('(display-mode: fullscreen)'),
      window.matchMedia('(display-mode: minimal-ui)'),
    ];

    const handleDisplayModeChange = () => {
      detectEnvironment();
    };

    mediaQueries.forEach(mq => {
      if (mq.addEventListener) {
        mq.addEventListener('change', handleDisplayModeChange);
      } else {
        // Fallback for older browsers
        mq.addListener(handleDisplayModeChange);
      }
    });

    // Cleanup
    return () => {
      mediaQueries.forEach(mq => {
        if (mq.removeEventListener) {
          mq.removeEventListener('change', handleDisplayModeChange);
        } else {
          // Fallback for older browsers
          mq.removeListener(handleDisplayModeChange);
        }
      });
    };
  }, []);

  // Return safe defaults during SSR to prevent hydration mismatches
  if (!isClient) {
    return {
      isPWA: false,
      isStandalone: false,
      isFullscreen: false,
      isBrowser: true,
      isIOS: false,
      isAndroid: false,
      isSafari: false,
      isChrome: false,
      displayMode: 'browser',
      canInstall: false,
    };
  }

  return detection;
}

// Helper function to get display mode as a string for debugging
export function getDisplayModeString(detection: PWADetectionResult): string {
  if (detection.isFullscreen) return 'Fullscreen PWA';
  if (detection.isStandalone) return 'Standalone PWA';
  if (detection.isBrowser) {
    if (detection.isSafari) return 'Safari Browser';
    if (detection.isChrome) return 'Chrome Browser';
    return 'Browser';
  }
  return 'Unknown';
}