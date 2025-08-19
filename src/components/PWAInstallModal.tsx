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
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);
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
                        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Located at the bottom of Safari (middle icon)
                  </p>
                </div>
              </div>

              {/* Safari mockup */}
              <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 my-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  {/* Safari header */}
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-t-lg border-b border-gray-200 dark:border-gray-600">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Safari</div>
                  </div>
                  {/* Safari toolbar */}
                  <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 rounded-b-lg">
                    <div className="flex space-x-6">
                      <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0L3.586 12l2.707-2.707a1 1 0 011.414 1.414L6.414 12l1.293 1.293a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                      <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l3.707 3.707-3.707 3.707a1 1 0 01-1.414-1.414L14.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="bg-blue-500 p-2 rounded-lg animate-pulse">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
                      </svg>
                    </div>
                    <div className="flex space-x-6">
                      <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zM12 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4zM12 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3z" clipRule="evenodd" />
                      </svg>
                      <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
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
                    <div className="bg-gray-50 dark:bg-gray-700 px-3 py-1 rounded-lg flex items-center space-x-2">
                      <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Add to Home Screen</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    You may need to scroll down in the share menu to find this option
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    3
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Tap "Add" to confirm
                    </span>
                    <div className="bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-lg">
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Add</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    The app will be added to your home screen and can be opened like any other app
                  </p>
                </div>
              </div>

              {/* Benefits */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 mt-6">
                <h4 className="font-medium text-green-900 dark:text-green-100 text-sm mb-2">
                  ✨ Benefits of installing:
                </h4>
                <ul className="text-xs text-green-700 dark:text-green-300 space-y-1">
                  <li>• Full screen experience (no Safari interface)</li>
                  <li>• Faster loading and offline access</li>
                  <li>• Quick access from your home screen</li>
                  <li>• Native app-like experience</li>
                </ul>
              </div>
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