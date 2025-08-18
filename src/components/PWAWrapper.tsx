'use client';

import { usePWADetection, getDisplayModeString } from '@/hooks/usePWADetection';
import { ReactNode, useEffect } from 'react';
import SafariInstallModal from './SafariInstallModal';

interface PWAWrapperProps {
  children: ReactNode;
  showDebugInfo?: boolean;
}

export default function PWAWrapper({ children, showDebugInfo = false }: PWAWrapperProps) {
  const detection = usePWADetection();

  useEffect(() => {
    // Add CSS classes to body based on detection
    const body = document.body;
    
    // Remove existing PWA classes
    body.classList.remove('pwa-mode', 'browser-mode', 'safari-browser', 'chrome-browser', 'ios-device', 'android-device', 'standalone-pwa', 'fullscreen-pwa');
    
    // Add appropriate classes
    if (detection.isPWA) {
      body.classList.add('pwa-mode');
      if (detection.isFullscreen) body.classList.add('fullscreen-pwa');
      if (detection.isStandalone) body.classList.add('standalone-pwa');
    } else {
      body.classList.add('browser-mode');
      if (detection.isSafari) body.classList.add('safari-browser');
      if (detection.isChrome) body.classList.add('chrome-browser');
    }
    
    if (detection.isIOS) body.classList.add('ios-device');
    if (detection.isAndroid) body.classList.add('android-device');
    
  }, [detection]);

  return (
    <div className={`
      app-wrapper
      ${detection.isPWA ? 'pwa-mode' : 'browser-mode'}
      ${detection.isSafari ? 'safari-browser' : ''}
      ${detection.isChrome ? 'chrome-browser' : ''}
      ${detection.isIOS ? 'ios-device' : ''}
      ${detection.isAndroid ? 'android-device' : ''}
      ${detection.isFullscreen ? 'fullscreen-pwa' : ''}
      ${detection.isStandalone ? 'standalone-pwa' : ''}
    `}>
      
      {children}
      
      {/* Safari Install Modal */}
      <SafariInstallModal />
    </div>
  );
}