'use client';

import { useState, useEffect } from 'react';

interface PWAInstallModalProps {
  show: boolean;
  onClose: () => void;
}

export default function PWAInstallModal({ show, onClose }: PWAInstallModalProps) {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if device is iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if app is already in standalone mode
    const checkStandalone = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      setIsStandalone(isStandalone || isInWebAppiOS);
    };

    // Check immediately and also listen for changes
    checkStandalone();
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addListener(checkStandalone);

    return () => {
      mediaQuery.removeListener(checkStandalone);
    };
  }, []);

  if (isStandalone || !show) {
    return null; // Don't show modal if already in PWA mode or not shown
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold">Install KingaSystem</h3>
              <p className="text-blue-100 text-sm">Add to Home Screen</p>
            </div>
            <button 
              onClick={onClose} 
              className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {isIOS ? (
            <div className="space-y-6">
              <p className="text-center text-gray-600 dark:text-gray-300 text-sm">
                Follow these steps to install KingaSystem on your iPhone:
              </p>

              {/* Step 1 */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    1
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Tap the Share button
                    </span>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l2 2v6h6l-2 2-6-6-6 6-2-2h6V4l2-2z"/>
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Located at the bottom of Safari (middle icon)
                  </p>
                </div>
              </div>


              {/* Step 2 */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    2
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Scroll down and tap "Add to Home Screen"
                    </span>
                    
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    You may need to scroll down in the share menu to find this option
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              
              
            </div>
          ) : (
            <div className="space-y-4 text-center">
              <div className="text-4xl mb-4">📱</div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                Install KingaSystem
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Look for the install prompt in your browser or check your browser menu for "Add to Home Screen" or "Install App"
              </p>
            </div>
          )}

          <div className="mt-8 flex flex-col space-y-3">
            <button
              onClick={onClose}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200"
            >
              Got It!
            </button>
            <button
              onClick={onClose}
              className="w-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium py-2 px-4 rounded-xl transition-colors duration-200"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}