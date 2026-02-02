"use client";

import { useMemo } from "react";

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

    const handleViewHtml = () => {
        window.open(`/articles/${articleId}/full-text`, '_blank');
    };

    const handleReadPdf = () => {
        if (!pdfUrl) return;
        window.open(`/articles/${articleId}/read`, '_blank');
    };

    const handleViewPdf = () => {
        if (!pdfUrl) return;
        const token = localStorage.getItem('token');
        window.open(`/api/articles/${articleId}/pdf?token=${token || ''}`, '_blank');
    };

    const handleDownloadPdf = () => {
        if (!pdfUrl) return;
        const token = localStorage.getItem('token');
        window.location.href = `/api/articles/${articleId}/pdf?token=${token || ''}&download=true`;
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
                        >
                            ⬇️
                        </button>
                    </>
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
                            className="w-full btn-secondary text-center py-2 flex items-center justify-center gap-2 text-sm"
                        >
                            <span>⬇️</span> Download
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
