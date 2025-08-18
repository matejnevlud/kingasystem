'use client';

import { useState, useEffect } from 'react';
import { usePWADetection } from '@/hooks/usePWADetection';

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showInstallPrompt, setShowInstallPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const detection = usePWADetection();

    useEffect(() => {
        // Check if app is already installed
        if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Check if running as PWA in browser
        if (window.navigator && 'standalone' in window.navigator && (window.navigator as any).standalone) {
            setIsInstalled(true);
            return;
        }

        // Listen for the beforeinstallprompt event
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            
            // Show install prompt after a delay (optional)
            setTimeout(() => {
                setShowInstallPrompt(true);
            }, 3000);
        };

        // Listen for successful app installation
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setShowInstallPrompt(false);
            setDeferredPrompt(null);
            console.log('PWA was installed');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            return;
        }

        deferredPrompt.prompt();
        
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }
        
        setDeferredPrompt(null);
        setShowInstallPrompt(false);
    };

    const handleDismiss = () => {
        setShowInstallPrompt(false);
        
        // Don't show again for this session
        sessionStorage.setItem('pwa-install-dismissed', 'true');
    };

    // Don't show if already installed, dismissed, or if Safari (Safari has its own modal)
    if (isInstalled || !showInstallPrompt || !deferredPrompt || detection.isSafari) {
        return null;
    }

    // Check if dismissed in this session
    if (sessionStorage.getItem('pwa-install-dismissed')) {
        return null;
    }

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm">
            <div className="bg-blue-600 text-white rounded-lg shadow-lg p-4">
                <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                            Install KingaSystem
                        </p>
                        <p className="text-xs text-blue-100 mt-1">
                            Add to your home screen for quick access
                        </p>
                    </div>
                    <div className="flex-shrink-0">
                        <button
                            onClick={handleDismiss}
                            className="text-blue-100 hover:text-white"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="mt-3 flex space-x-2">
                    <button
                        onClick={handleInstallClick}
                        className="flex-1 bg-white text-blue-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-50 transition-colors"
                    >
                        Install
                    </button>
                    <button
                        onClick={handleDismiss}
                        className="px-3 py-2 text-blue-100 hover:text-white text-sm transition-colors"
                    >
                        Maybe later
                    </button>
                </div>
            </div>
        </div>
    );
}