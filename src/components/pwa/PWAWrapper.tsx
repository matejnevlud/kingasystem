'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePWADetection } from '@/hooks/usePWADetection';
import { PWAInstallModal } from './PWAInstallModal';
import { PWAEnforcer } from './PWAEnforcer';

interface PWAWrapperProps {
  children: ReactNode;
}

export function PWAWrapper({ children }: PWAWrapperProps) {
  const detection = usePWADetection();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  const getWrapperClasses = () => {
    const classes = ['min-h-screen'];

    if (detection.isPWA) {
      classes.push('pwa-mode');
      if (detection.isIOS) {
        classes.push('pwa-ios');
      }
      if (detection.isAndroid) {
        classes.push('pwa-android');
      }
    } else {
      classes.push('browser-mode');
      if (detection.isSafari) {
        classes.push('browser-safari');
      }
      if (detection.isChrome) {
        classes.push('browser-chrome');
      }
      if (detection.isIOS) {
        classes.push('browser-ios');
      }
      if (detection.isAndroid) {
        classes.push('browser-android');
      }
    }

    return classes.join(' ');
  };

  return (
    <div className={getWrapperClasses()}>
      <style jsx global>{`
        .pwa-mode {
          /* PWA fullscreen mode styles */
          min-height: 100vh;
          min-height: 100dvh; /* Dynamic viewport height for mobile */
          padding-top: env(safe-area-inset-top);
          padding-bottom: env(safe-area-inset-bottom);
          padding-left: env(safe-area-inset-left);
          padding-right: env(safe-area-inset-right);
        }

        .pwa-ios {
          /* iOS PWA specific styles */
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -webkit-tap-highlight-color: transparent;
          /* Force fullscreen on iOS */
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        .browser-mode {
          /* Regular browser mode styles */
          min-height: 100vh;
        }

        .browser-safari.browser-ios {
          /* Safari on iOS specific styles */
          padding-bottom: env(safe-area-inset-bottom);
          /* Prevent address bar bounce */
          position: fixed;
          width: 100%;
          height: 100%;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        /* Hide scrollbars in PWA mode for cleaner look */
        .pwa-mode::-webkit-scrollbar {
          display: none;
        }

        .pwa-mode {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* Status bar adjustments for PWA */
        @media (display-mode: standalone) {
          body {
            background-color: #1f2937; /* theme color */
          }
          
          .pwa-mode {
            /* Additional standalone mode styling */
            background-color: #1f2937;
          }
        }

        /* Prevent zoom on inputs in iOS Safari */
        .browser-safari.browser-ios input,
        .browser-safari.browser-ios select,
        .browser-safari.browser-ios textarea {
          font-size: 16px !important;
        }

        /* PWA fullscreen detection styling */
        @media (display-mode: standalone) {
          .pwa-mode::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: env(safe-area-inset-top);
            background-color: #1f2937;
            z-index: 1000;
          }
        }

        /* Body classes for PWA mode */
        body.pwa-installed {
          background-color: #1f2937;
          height: 100vh;
          height: calc(var(--vh, 1vh) * 100);
          overflow-x: hidden;
        }

        body.pwa-ios {
          /* iOS specific body adjustments */
          padding-top: var(--safe-area-inset-top, 0);
          padding-bottom: var(--safe-area-inset-bottom, 0);
          padding-left: var(--safe-area-inset-left, 0);
          padding-right: var(--safe-area-inset-right, 0);
        }

        /* Root element height adjustments */
        html.pwa-fullscreen,
        html.pwa-fullscreen body {
          height: 100%;
          height: 100vh;
          height: calc(var(--vh, 1vh) * 100);
          overflow-x: hidden;
        }
      `}</style>
      
      {children}
      
      {/* PWA behavior enforcer */}
      <PWAEnforcer />
      
      {/* Show install modal for browsers */}
      <PWAInstallModal />
    </div>
  );
}