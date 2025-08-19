import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import "./globals.css";
import { PWAWrapper } from "@/components/pwa/PWAWrapper";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "KingaSystem",
    description: "Business management system for tracking sales, expenses, and metrics",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "KingaSystem"
    },
    other: {
        "mobile-web-app-capable": "yes",
        "apple-mobile-web-app-capable": "yes",
        "apple-mobile-web-app-status-bar-style": "black-translucent"
    }
};

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
    themeColor: '#1f2937'
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <head>
            <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.svg" />
            <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.svg" />
            <link rel="icon" type="image/svg+xml" sizes="32x32" href="/icons/icon-32x32.svg" />
            <link rel="icon" type="image/svg+xml" sizes="16x16" href="/icons/icon-16x16.svg" />
            <meta name="apple-mobile-web-app-title" content="KingaSystem" />
            <meta name="application-name" content="KingaSystem" />
            <style dangerouslySetInnerHTML={{
                __html: `
                    /* PWA Fullscreen styles */
                    @media (display-mode: standalone) {
                        body { 
                            padding-top: env(safe-area-inset-top); 
                            padding-bottom: env(safe-area-inset-bottom);
                            padding-left: env(safe-area-inset-left);
                            padding-right: env(safe-area-inset-right);
                        }
                    }
                    
                    /* iOS specific fullscreen */
                    @supports (-webkit-touch-callout: none) {
                        body {
                            padding-top: env(safe-area-inset-top);
                            padding-bottom: env(safe-area-inset-bottom);
                        }
                    }
                    
                    /* Hide scrollbars in standalone mode */
                    @media (display-mode: standalone) {
                        body::-webkit-scrollbar {
                            display: none;
                        }
                        body {
                            -ms-overflow-style: none;
                            scrollbar-width: none;
                        }
                    }
                    
                    /* Force fullscreen viewport on iOS */
                    html, body {
                        height: 100%;
                        overflow-x: hidden;
                    }
                `
            }} />
        </head>
        <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
        <PWAWrapper>
            {children}
        </PWAWrapper>
        <script dangerouslySetInnerHTML={{
            __html: `
                if ('serviceWorker' in navigator) {
                    window.addEventListener('load', function() {
                        navigator.serviceWorker.register('/sw.js');
                    });
                }
            `
        }} />
        </body>
        </html>
    );
}
