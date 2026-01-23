"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles: string[];
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Check for token/user
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");

        if (!token || !userStr) {
            toast.error("You must be logged in to access this page");
            router.push("/login");
            return;
        }

        try {
            const user = JSON.parse(userStr);

            // 2. Check role
            if (allowedRoles.includes(user.role)) {
                setAuthorized(true);
            } else {
                toast.error("You do not have permission to access this page");
                router.push("/dashboard");
            }
        } catch (e) {
            console.error("Failed to parse user data", e);
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            router.push("/login");
        } finally {
            setLoading(false);
        }
    }, [router, allowedRoles]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-primary text-xl font-semibold animate-pulse">
                    Verifying access...
                </div>
            </div>
        );
    }

    if (!authorized) {
        return null; // Or a custom 403 Forbidden Component if preferred, but we hold null while redirecting
    }

    return <>{children}</>;
}
