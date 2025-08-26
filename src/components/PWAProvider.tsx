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
  const [hasShownModal, setHasShownModal] = useState(false);

  useEffect(() => {
    // Check if app is running in standalone mode
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

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

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Show modal after a delay if not in standalone mode and not shown before
    let timer: NodeJS.Timeout | null = null;
    if (!standalone) {
      timer = setTimeout(() => {
        console.log('Showing PWA install modal');
        setShowModal(true);
        setHasShownModal(true);
      }, 1000); // Show after 1 second
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, []);

  const showInstallModal = () => {
    setShowModal(true);
  };

  const hideInstallModal = () => {
    setShowModal(false);
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