import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CookieConsent from "@/components/CookieConsent";
import { Analytics } from "@vercel/analytics/react";
import PWARegister from "@/components/PWARegister";
import { Toaster } from "sonner";



export const metadata: Metadata = {
  title: "IJAISM - International Journal of Advanced Information Systems and Management",
  description: "Dedicated to publishing groundbreaking research in information technology, business management, and related disciplines",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "IJAISM",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icons/icon-512x512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/icon-152x152.svg", sizes: "152x152", type: "image/svg+xml" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#1a365d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="application-name" content="IJAISM" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="IJAISM" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.svg" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.svg" />
      </head>
      <body className="min-h-screen flex flex-col overflow-x-hidden max-w-full">
        <Header />
        <main className="flex-grow w-full overflow-x-hidden">
          {children}
        </main>
        <Footer />
        <CookieConsent />
        <Analytics />
        <PWARegister />
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
