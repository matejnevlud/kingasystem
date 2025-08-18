import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import "./globals.css";
import PWAWrapper from '@/components/PWAWrapper';

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "KingaSystem - Business Management",
    description: "Business management system for tracking sales, expenses, and metrics across multiple units",
    metadataBase: new URL('https://localhost:3000'), // Update this to your production URL
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'KingaSystem',
    },
    formatDetection: {
        telephone: false,
    },
    openGraph: {
        type: 'website',
        siteName: 'KingaSystem',
        title: 'KingaSystem - Business Management',
        description: 'Business management system for tracking sales, expenses, and metrics across multiple units',
    },
    icons: {
        shortcut: '/icons/icon-96x96.png',
        apple: [
            { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
            { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
        ],
    },
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
            <meta name="theme-color" content="#2563eb" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
            <meta name="apple-touch-fullscreen" content="yes" />
            <meta name="mobile-web-app-capable" content="yes" />
            <script
                dangerouslySetInnerHTML={{
                    __html: `
                        if ('serviceWorker' in navigator) {
                            window.addEventListener('load', function() {
                                navigator.serviceWorker.register('/sw.js')
                                    .then(function(registration) {
                                        console.log('SW registered: ', registration);
                                    })
                                    .catch(function(registrationError) {
                                        console.log('SW registration failed: ', registrationError);
                                    });
                            });
                        }
                    `,
                }}
            />
        </head>
        <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
        <PWAWrapper>
            {children}
        </PWAWrapper>
        </body>
        </html>
    );
}
