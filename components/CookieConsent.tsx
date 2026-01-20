'use client';

import { useState, useEffect } from 'react';

export default function CookieConsent() {
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookie_consent');
        if (!consent) {
            setShowBanner(true);
        }
    }, []);

    const acceptCookies = () => {
        localStorage.setItem('cookie_consent', 'true');
        setShowBanner(false);
    };

    if (!showBanner) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 shadow-lg z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm">
                    <p>
                        We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.
                        <a href="/privacy" className="underline ml-1 hover:text-gray-300">Learn more</a>
                    </p>
                </div>
                <button
                    onClick={acceptCookies}
                    className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-md text-sm font-semibold transition-colors whitespace-nowrap"
                >
                    Accept All
                </button>
            </div>
        </div>
    );
}
