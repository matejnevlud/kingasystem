import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import "./globals.css";
import { PWAProvider } from "@/components/PWAProvider";

// Force light mode script
const forceLightModeScript = `
  (function() {
    // Force light mode immediately
    document.documentElement.classList.add('light');
    document.documentElement.style.colorScheme = 'light';

    // Override any dark mode media queries
    const style = document.createElement('style');
    style.textContent = \`
      @media (prefers-color-scheme: dark) {
        :root {
          --background: #ffffff !important;
          --foreground: #171717 !important;
        }
        body {
          background: #ffffff !important;
          color: #171717 !important;
        }
      }
    \`;
    document.head.appendChild(style);
  })();
`;

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
    description: "Business management system for tracking sales, expenses, and business metrics",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "KingaSystem",
    },
};

export const viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
    themeColor: "#000000",
};

export default function RootLayout({
                                        children,
                                    }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="light">
        <head>
            <script dangerouslySetInnerHTML={{ __html: forceLightModeScript }} />
            <meta name="application-name" content="KingaSystem" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="default" />
            <meta name="apple-mobile-web-app-title" content="KingaSystem" />
            <meta name="mobile-web-app-capable" content="yes" />
            <meta name="msapplication-config" content="/icons/browserconfig.xml" />
            <meta name="msapplication-TileColor" content="#ffffff" />
            <meta name="msapplication-tap-highlight" content="no" />
            <meta name="color-scheme" content="light" />

            <link rel="apple-touch-icon" href="/icons/icon-152x152.png" />
            <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
            <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180x180.png" />

            <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
            <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
            <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#000000" />
            <link rel="shortcut icon" href="/favicon.ico" />
        </head>
        <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
        <PWAProvider>
            {children}
        </PWAProvider>
        </body>
    </html>
    );
}
