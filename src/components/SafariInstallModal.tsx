'use client';

import { useState, useEffect } from 'react';
import { usePWADetection } from '@/hooks/usePWADetection';

export default function SafariInstallModal() {
    const [showModal, setShowModal] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const detection = usePWADetection();

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        // Only run on client side and only show for Safari users who are not in PWA mode
        if (!isClient) return;
        
        if (detection.isSafari && detection.isBrowser && !isDismissed) {
            // Check if user has dismissed this modal before
            const dismissed = localStorage.getItem('safari-install-modal-dismissed');
            if (!dismissed) {
                // Show modal after a short delay
                const timer = setTimeout(() => {
                    setShowModal(true);
                }, 2000);
                return () => clearTimeout(timer);
            }
        }
    }, [detection.isSafari, detection.isBrowser, isDismissed, isClient]);

    const handleDismiss = (permanent = false) => {
        setShowModal(false);
        setIsDismissed(true);
        
        if (permanent) {
            localStorage.setItem('safari-install-modal-dismissed', 'true');
        } else {
            // Show again in 24 hours
            const dismissTime = new Date().getTime();
            localStorage.setItem('safari-install-modal-dismissed-temp', dismissTime.toString());
        }
    };

    const handleInstallNow = () => {
        setShowModal(false);
        // The modal instructions will guide them through the process
    };

    // Don't render during SSR or if conditions aren't met
    if (!isClient || !detection.isSafari || !detection.isBrowser || !showModal) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 text-center">
                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C13.1 2 14 2.9 14 4V8C14 9.1 13.1 10 12 10C10.9 10 10 9.1 10 8V4C10 2.9 10.9 2 12 2M21 9V7L19 8L21 9M15 9V7L13 8L15 9M9 9V7L7 8L9 9M3 9V7L1 8L3 9M12 10.5C17 10.5 21 14.5 21 19.5C21 20.6 20.1 21.5 19 21.5H5C3.9 21.5 3 20.6 3 19.5C3 14.5 7 10.5 12 10.5Z"/>
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold">Install KingaSystem</h2>
                    <p className="text-blue-100 mt-1">Get the full app experience</p>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="text-center mb-6">
                        <p className="text-gray-600 mb-4">
                            For the best experience, install KingaSystem as an app on your device. 
                            It's fast, reliable, and works offline!
                        </p>
                    </div>

                    {/* Step-by-step instructions */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-800 mb-3">How to install:</h3>
                        
                        <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                                1
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-gray-700">Tap the</span>
                                <div className="inline-flex items-center px-2 py-1 bg-blue-50 rounded">
                                    <svg className="w-4 h-4 text-blue-600 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
                                    </svg>
                                    <span className="text-sm font-medium text-blue-600">Share</span>
                                </div>
                                <span className="text-gray-700">button</span>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                                2
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-gray-700">Scroll down and tap</span>
                                <div className="inline-flex items-center px-2 py-1 bg-green-50 rounded">
                                    <svg className="w-4 h-4 text-green-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                        <line x1="12" y1="8" x2="12" y2="16"/>
                                        <line x1="8" y1="12" x2="16" y2="12"/>
                                    </svg>
                                    <span className="text-sm font-medium text-green-600">Add to Home Screen</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                                3
                            </div>
                            <div className="text-gray-700">
                                Tap <span className="font-semibold">"Add"</span> to confirm
                            </div>
                        </div>
                    </div>

                    {/* Visual hint */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Look for the share button at the bottom of your Safari browser</span>
                        </div>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="px-6 pb-6 space-y-3">
                    <button
                        onClick={handleInstallNow}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                        Got it! Let me install
                    </button>
                    
                    <div className="flex space-x-2">
                        <button
                            onClick={() => handleDismiss(false)}
                            className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                        >
                            Maybe later
                        </button>
                        
                        <button
                            onClick={() => handleDismiss(true)}
                            className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                        >
                            Don't show again
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}