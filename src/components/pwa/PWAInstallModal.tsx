'use client';

import { useState, useEffect } from 'react';
import { usePWADetection } from '@/hooks/usePWADetection';

interface PWAInstallModalProps {
  onClose?: () => void;
}

export function PWAInstallModal({ onClose }: PWAInstallModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const detection = usePWADetection();

  useEffect(() => {
    if (detection.showInstallPrompt) {
      setIsVisible(true);
    }
  }, [detection.showInstallPrompt]);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
    onClose?.();
  };

  if (!isVisible || detection.isPWA) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 shadow-xl">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Install KingaSystem
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>
          
          <p className="text-gray-600 mb-6">
            Add KingaSystem to your home screen for the best experience. 
            The app will run in fullscreen mode without the browser interface.
          </p>

          {detection.isIOS && detection.isSafari && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                How to install on iPhone/iPad:
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">
                      Tap the <strong>Share</strong> button in Safari
                    </p>
                    <div className="mt-1 text-xs text-gray-500">
                      (The square with an arrow pointing up at the bottom of the screen)
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">
                      Scroll down and tap <strong>"Add to Home Screen"</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">
                      Tap <strong>"Add"</strong> to confirm
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    ✓
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">
                      Find the KingaSystem app icon on your home screen!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {detection.isAndroid && detection.isChrome && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                How to install on Android:
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">
                      Tap the <strong>Menu</strong> (three dots) in Chrome
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">
                      Tap <strong>"Add to Home screen"</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">
                      Tap <strong>"Add"</strong> to confirm
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex space-x-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Maybe Later
            </button>
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Got It!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}