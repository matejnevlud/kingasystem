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
    setIsIOS(true);

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

                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg">

                          <g id="🔍-Product-Icons" stroke="none" stroke-width="1.5" fill="none" fill-rule="evenodd">
                              <g id="ic_fluent_share_ios_48_regular" fill="#212121" fill-rule="nonzero">
                                  <path d="M37.75,20.75 C38.3972087,20.75 38.9295339,21.2418747 38.9935464,21.8721948 L39,22 L39,36.75 C39,39.5770076 36.7655511,41.8821316 33.9664046,41.995621 L33.75,42 L14.25,42 C11.4229924,42 9.11786837,39.7655511 9.00437905,36.9664046 L9,36.75 L9,22 C9,21.3096441 9.55964406,20.75 10.25,20.75 C10.8972087,20.75 11.4295339,21.2418747 11.4935464,21.8721948 L11.5,22 L11.5,36.75 C11.5,38.2125318 12.6417046,39.4084043 14.0824777,39.4949812 L14.25,39.5 L33.75,39.5 C35.2125318,39.5 36.4084043,38.3582954 36.4949812,36.9175223 L36.5,36.75 L36.5,22 C36.5,21.3096441 37.0596441,20.75 37.75,20.75 Z M15.0903301,14.1442911 L22.8685047,6.36611652 C23.3241164,5.91050485 24.0439368,5.88013074 24.5347763,6.27499419 L24.6362716,6.36611652 L32.4144462,14.1442911 C32.9026016,14.6324465 32.9026016,15.4239027 32.4144462,15.9120581 C31.9588346,16.3676697 31.2390141,16.3980439 30.7481746,16.0031804 L30.6466793,15.9120581 L25,10.265 L25,30.5 C25,31.1472087 24.5081253,31.6795339 23.8778052,31.7435464 L23.75,31.75 C23.1027913,31.75 22.5704661,31.2581253 22.5064536,30.6278052 L22.5,30.5 L22.5,10.269 L16.858097,15.9120581 C16.4024854,16.3676697 15.6826649,16.3980439 15.1918254,16.0031804 L15.0903301,15.9120581 C14.6347184,15.4564464 14.6043443,14.736626 14.9992078,14.2457865 L15.0903301,14.1442911 L22.8685047,6.36611652 L15.0903301,14.1442911 Z" id="🎨-Color">

                      </path>
                              </g>
                          </g>
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