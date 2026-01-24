"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthModal from "@/components/ui/AuthModal";

interface AuthProtectedLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string;
    children: React.ReactNode;
    className?: string;
}

export default function AuthProtectedLink({
    href,
    children,
    className,
    ...props
}: AuthProtectedLinkProps) {
    const router = useRouter();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Check auth status on mount and listen for changes
    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('token');
            if (token) {
                // Basic expiration check could go here if needed, 
                // but usually presence is enough for UI toggle, API will validate.
                setIsLoggedIn(true);
            } else {
                setIsLoggedIn(false);
            }
        };

        checkAuth();

        // Listen for standard auth events we emit in this app
        window.addEventListener('userLoggedIn', checkAuth);
        window.addEventListener('userLoggedOut', checkAuth);
        window.addEventListener('storage', checkAuth);

        return () => {
            window.removeEventListener('userLoggedIn', checkAuth);
            window.removeEventListener('userLoggedOut', checkAuth);
            window.removeEventListener('storage', checkAuth);
        };
    }, []);

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (!isLoggedIn) {
            e.preventDefault();
            setIsAuthModalOpen(true);
        }
        // If logged in, let the default Link behavior happen (navigation)
    };

    return (
        <>
            <Link
                href={href}
                className={className}
                onClick={handleClick}
                {...props}
            >
                {children}
            </Link>

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                title="Start Your Submission"
                description="To maintain the quality and integrity of our peer-review process, we require all authors to log in before submitting an article. This ensures you can track your submission status and communicate effectively with our editors."
            />
        </>
    );
}
