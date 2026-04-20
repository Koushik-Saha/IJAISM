import type { Metadata, Viewport } from "next";
import "./globals.css";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import CookieConsent from "@/components/CookieConsent";
import { Analytics } from "@vercel/analytics/react";
import PWARegister from "@/components/PWARegister";
import { Toaster } from "sonner";
import ForcePasswordChangeModal from "@/components/auth/ForcePasswordChangeModal";



import { prisma } from "@/lib/prisma";

export async function generateMetadata(): Promise<Metadata> {
  const setting = await prisma.globalSettings.findUnique({ where: { key: 'site_name' } });
  const siteName = setting?.value || "C5K";

  return {
    title: `${siteName} - Academic Publishing Platform`,
    description: `Leading the Future of Scholarly Research at ${siteName}`,
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: siteName,
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
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#1a365d",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const setting = await prisma.globalSettings.findUnique({ where: { key: 'site_name' } });
  const siteName = setting?.value || "C5K";

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="application-name" content={siteName} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={siteName} />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.svg" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.svg" />
      </head>
      <body className="min-h-screen flex flex-col overflow-x-hidden max-w-full" suppressHydrationWarning>
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
        <CookieConsent />
        <Analytics />
        <PWARegister />
        <ForcePasswordChangeModal />
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
