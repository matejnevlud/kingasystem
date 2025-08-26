'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import PWAInstallModal from './PWAInstallModal';

interface PWAContextType {
  isInstallable: boolean;
  isStandalone: boolean;
  showInstallModal: () => void;
  hideInstallModal: () => void;
  installApp: () => Promise<void>;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

interface PWAProviderProps {
  children: ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [hasShownModal, setHasShownModal] = useState(() => {
    // Check localStorage for previously dismissed modal
    if (typeof window !== 'undefined') {
      //return localStorage.getItem('pwa-modal-dismissed') === 'true';
    }
    return false;
  });

  useEffect(() => {
    // Check if app is running in standalone mode (comprehensive detection)
    const checkStandalone = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      const standalone = isStandalone || isInWebAppiOS;
      setIsStandalone(standalone);
      return standalone;
    };

    const standalone = checkStandalone();
    console.log('PWA Provider initialized:', { standalone });

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      setShowModal(false);
    };

    // Listen for display mode changes
    const handleDisplayModeChange = () => {
      const newStandalone = checkStandalone();
      if (newStandalone) {
        setShowModal(false);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addListener(handleDisplayModeChange);

    // Only show modal if not in standalone mode and app is installable
    let timer: NodeJS.Timeout | null = null;
    if (!standalone) {
      timer = setTimeout(() => {
        // Only show if we have an install prompt and haven't shown before
        setShowModal(true);
        setHasShownModal(true);
      }, 1000); // Show after 2 seconds to give time for install prompt detection
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeListener(handleDisplayModeChange);
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [hasShownModal, deferredPrompt]);

  const showInstallModal = () => {
    setShowModal(true);
  };

  const hideInstallModal = () => {
    setShowModal(false);
    setHasShownModal(true); // Mark as shown so it doesn't appear again
    // Save to localStorage to persist across sessions
    if (typeof window !== 'undefined') {
      //localStorage.setItem('pwa-modal-dismissed', 'true');
    }
  };

  const installApp = async () => {
    if (!deferredPrompt) return;

    try {
      const result = await deferredPrompt.prompt();
      console.log('Install prompt result:', result);
      
      if (result.outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstallable(false);
        setShowModal(false);
      }
    } catch (error) {
      console.error('Error installing app:', error);
    }
  };

  const contextValue: PWAContextType = {
    isInstallable,
    isStandalone,
    showInstallModal,
    hideInstallModal,
    installApp,
  };

  return (
    <PWAContext.Provider value={contextValue}>
      {children}
      <PWAInstallModal 
        show={showModal} 
        onClose={hideInstallModal}
      />
    </PWAContext.Provider>
  );
}

export function usePWA() {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
}