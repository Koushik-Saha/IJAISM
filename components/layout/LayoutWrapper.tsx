"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { SettingsProvider } from "@/context/SettingsContext";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // Check if the current route is the Interactive Reader
    const isReaderRoute = pathname?.match(/^\/articles\/[^\/]+\/read$/);

    return (
        <SettingsProvider>
            {!isReaderRoute && <Header />}
            <main className="flex-grow w-full overflow-x-hidden">
                {children}
            </main>
            {!isReaderRoute && <Footer />}
        </SettingsProvider>
    );
}
