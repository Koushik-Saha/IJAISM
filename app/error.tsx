'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Runtime Error Caught:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <svg
                        className="w-8 h-8 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong!</h2>
                    <p className="text-gray-600">
                        We apologize for the inconvenience. Our team has been notified of this issue.
                    </p>
                    {process.env.NODE_ENV === 'development' && (
                        <div className="mt-4 p-4 bg-gray-100 rounded text-left overflow-auto text-xs font-mono max-h-32 text-red-600">
                            {error.message}
                        </div>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={() => reset()}
                        className="px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors focus:ring-4 focus:ring-primary/20"
                    >
                        Try Again
                    </button>
                    <Link
                        href="/"
                        className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Return Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
