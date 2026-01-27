import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Page Not Found - C5K',
    description: 'The requested page could not be found.',
};

export default function NotFound() {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full text-center space-y-8">
                <div className="relative">
                    <h1 className="text-9xl font-black text-gray-200">404</h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-gray-800">Page Not Found</span>
                    </div>
                </div>

                <p className="text-gray-600 text-lg">
                    The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/"
                        className="px-8 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-sm hover:shadow"
                    >
                        Go to Homepage
                    </Link>
                    <Link
                        href="/contact"
                        className="px-8 py-3 bg-white text-gray-700 font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        Contact Support
                    </Link>
                </div>
            </div>
        </div>
    );
}
