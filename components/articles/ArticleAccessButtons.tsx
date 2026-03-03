"use client";

import { useMemo, useState, useEffect } from "react";
import { track } from "@vercel/analytics";
import Link from "next/link";
import { toast } from "sonner";

interface ArticleAccessButtonsProps {
    articleId: string;
    pdfUrl?: string | null;
    fullTextAvailable?: boolean;
    onDownload?: () => void;
    className?: string;
    variant?: "default" | "compact";
}

export default function ArticleAccessButtons({
    articleId,
    pdfUrl,
    fullTextAvailable = false,
    className = "",
    variant = "default"
}: ArticleAccessButtonsProps) {

    const [isChecking, setIsChecking] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [downloadStats, setDownloadStats] = useState<any>(null);

    useEffect(() => {
        const fetchStats = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                const res = await fetch('/api/user/download-status', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setDownloadStats(data);
                }
            } catch (err) {
                console.error("Failed to load download stats", err);
            }
        };
        fetchStats();
    }, []);

    const handleViewHtml = () => {
        track('HTML View', { articleId });
        window.open(`/articles/${articleId}/full-text`, '_blank');
    };

    const handleReadPdf = () => {
        if (!pdfUrl) return;
        track('Interactive Reader Open', { articleId });
        window.open(`/articles/${articleId}/read`, '_blank');
    };

    const handleViewPdf = () => {
        if (!pdfUrl) return;
        track('PDF View', { articleId });
        const token = localStorage.getItem('token');
        window.open(`/api/articles/${articleId}/pdf?token=${token || ''}`, '_blank');
    };

    const handleDownloadPdf = async () => {
        if (!pdfUrl) return;
        setIsChecking(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/user/download-status', {
                headers: { 'Authorization': `Bearer ${token || ''}` }
            });
            const status = await res.json();

            if (!status.authenticated) {
                toast.error("Please log in to download articles.");
                window.location.href = `/login?redirect=/articles/${articleId}`;
                return;
            }

            if (!status.canDownload && status.tier !== 'admin') {
                setDownloadStats(status);
                setShowUpgradeModal(true);
                return;
            }

            track('PDF Download', { articleId });
            window.location.href = `/api/articles/${articleId}/pdf?token=${token || ''}&download=true`;

        } catch (err) {
            console.error(err);
            toast.error("Failed to verify download eligibility.");
        } finally {
            setIsChecking(false);
        }
    };

    if (variant === "compact") {
        return (
            <div className={`flex flex-wrap gap-2 ${className}`}>
                <button
                    onClick={handleViewHtml}
                    className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-200 hover:bg-purple-100 font-medium flex items-center gap-1"
                    title="View as Webpage"
                >
                    🌐 HTML
                </button>
                {pdfUrl && (
                    <>
                        <button
                            onClick={handleReadPdf}
                            className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded border border-orange-200 hover:bg-orange-100 font-medium flex items-center gap-1"
                            title="Interactive Reader"
                        >
                            📖 Read
                        </button>
                        <button
                            onClick={handleViewPdf}
                            className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200 hover:bg-blue-100 font-medium flex items-center gap-1"
                            title="View PDF"
                        >
                            📄 PDF
                        </button>
                        <button
                            onClick={handleDownloadPdf}
                            className="text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded border border-gray-200 hover:bg-gray-100 font-medium flex items-center gap-1"
                            title="Download"
                            disabled={isChecking}
                        >
                            {isChecking ? "⏳" : "⬇️"}
                        </button>
                    </>
                )}

                {/* Upgrade Modal Compact */}
                {showUpgradeModal && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-center">
                            <div className="text-4xl mb-4">🔒</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Download Limit Reached</h3>
                            <p className="text-gray-600 mb-6">
                                You've reached your limit of {downloadStats?.limit} downloads for your <strong>{downloadStats?.tier}</strong> tier this month.
                                Upgrade your membership to unlock unlimited PDF downloads and premium features.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button onClick={() => setShowUpgradeModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors font-medium">
                                    Maybe Later
                                </button>
                                <Link href="/membership" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-bold shadow-md transition-all">
                                    View Pricing
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Default Variant (Sidebar / Card style)
    return (
        <div className={`flex flex-col gap-2 w-full ${className}`}>
            <button
                onClick={handleViewHtml}
                className="w-full btn-primary text-center py-2 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white border-transparent"
            >
                <span>🌐</span> View Full Text (HTML)
            </button>

            {pdfUrl && (
                <>
                    <button
                        onClick={handleReadPdf}
                        className="w-full text-center py-2 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white rounded font-medium transition-colors shadow-sm"
                    >
                        <span>📖</span> Interactive Reader
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={handleViewPdf}
                            className="w-full btn-secondary text-center py-2 flex items-center justify-center gap-2 text-sm"
                        >
                            <span>📄</span> View PDF
                        </button>
                        <button
                            onClick={handleDownloadPdf}
                            disabled={isChecking}
                            className={`w-full btn-secondary text-center py-2 flex items-center justify-center gap-2 text-sm ${isChecking ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            <span>{isChecking ? "⏳" : "⬇️"}</span> {isChecking ? "Checking..." : "Download"}
                        </button>
                    </div>

                    {downloadStats?.authenticated && downloadStats?.limit !== 'unlimited' && downloadStats?.tier !== 'admin' && (
                        <div className="text-xs text-center text-gray-500 mt-2">
                            {downloadStats.remaining} free {downloadStats.remaining === 1 ? 'download' : 'downloads'} remaining this month.
                        </div>
                    )}
                </>
            )}

            {/* Upgrade Modal Default */}
            {showUpgradeModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-in fade-in zoom-in duration-200">
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                            🔒
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2">Limit Reached</h3>
                        <p className="text-gray-600 mb-8 border-b border-gray-100 pb-6">
                            You've exhausted your <strong>{downloadStats?.limit} available downloads</strong> for the {downloadStats?.tier} tier this month.
                            Support our open-access mission and upgrade your membership to unlock unlimited downloads.
                        </p>
                        <div className="flex flex-col gap-3">
                            <Link href="/membership" className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg font-bold shadow-lg transition-transform hover:-translate-y-0.5">
                                View Premium Memberships
                            </Link>
                            <button onClick={() => setShowUpgradeModal(false)} className="w-full py-3 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg font-medium transition-colors">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
