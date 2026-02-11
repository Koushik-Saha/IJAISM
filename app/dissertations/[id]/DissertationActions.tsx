
"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import SecureDownloadButton from "@/components/ui/SecureDownloadButton";

interface DissertationActionsProps {
    pdfUrl: string | null;
    title: string;
}

export default function DissertationActions({ pdfUrl, title }: DissertationActionsProps) {
    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            toast.success("Link copied to clipboard!");
        } catch (err) {
            console.error('Failed to copy: ', err);
            toast.error("Failed to copy link");
        }
    };

    return (
        <div className="space-y-3">
            {pdfUrl ? (
                <SecureDownloadButton
                    pdfUrl={pdfUrl}
                    className="w-full text-center block bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-bold transition-colors"
                />
            ) : (
                <button
                    disabled
                    className="w-full bg-gray-300 text-gray-500 px-6 py-3 rounded-lg font-bold cursor-not-allowed"
                >
                    PDF Not Available
                </button>
            )}

            <button
                onClick={handleShare}
                className="w-full block text-center border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg font-bold transition-colors"
            >
                Share
            </button>

            <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="font-bold text-gray-800 mb-3">Submit Your Dissertation</h4>
                <p className="text-sm text-gray-600 mb-4">
                    Share your doctoral research with the global academic community
                </p>
                <Link
                    href="/submit"
                    className="block text-center bg-accent hover:bg-accent-dark text-white px-6 py-3 rounded-lg font-bold transition-colors"
                >
                    Submit Now
                </Link>
            </div>
        </div>
    );
}
