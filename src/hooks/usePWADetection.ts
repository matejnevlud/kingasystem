'use client';

import { useState, useEffect } from 'react';

interface PWADetection {
  isPWA: boolean;
  isStandalone: boolean;
  isMobile: boolean;
  isIOS: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isAndroid: boolean;
  canInstall: boolean;
  showInstallPrompt: boolean;
}

export function usePWADetection(): PWADetection {
  const [detection, setDetection] = useState<PWADetection>({
    isPWA: false,
    isStandalone: false,
    isMobile: false,
    isIOS: false,
    isSafari: false,
    isChrome: false,
    isAndroid: false,
    canInstall: false,
    showInstallPrompt: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const userAgent = window.navigator.userAgent;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true ||
                        window.matchMedia('(display-mode: fullscreen)').matches;
    
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    const isChrome = /Chrome/.test(userAgent) && !/Edge/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);

    const isPWA = isStandalone;
    const canInstall = !isPWA && isMobile;
    const showInstallPrompt = canInstall && !localStorage.getItem('pwa-install-dismissed');

    setDetection({
      isPWA,
      isStandalone,
      isMobile,
      isIOS,
      isSafari,
      isChrome,
      isAndroid,
      canInstall,
      showInstallPrompt,
    });
  }, []);

  return detection;
}