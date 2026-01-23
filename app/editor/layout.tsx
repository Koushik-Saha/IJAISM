"use client";

import RoleGuard from "@/components/auth/RoleGuard";

export default function EditorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <RoleGuard allowedRoles={["editor", "super_admin"]}>
            {children}
        </RoleGuard>
    );
}
