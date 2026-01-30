"use client";

import { toast } from "sonner";
import Card from "@/components/ui/Card";
import { useState } from "react";

interface ArticleActionsProps {
    articleId: string;
    title: string;
    pdfUrl?: string | null;
    fullText?: string | null;
    authors: { name: string }[];
    journalName: string;
    publicationDate: string;
    downloads?: number;
    citations?: number;
}

export default function ArticleActions({
    articleId,
    title,
    pdfUrl,
    fullText,
    authors,
    journalName,
    publicationDate,
    downloads = 0,
    citations = 0,
}: ArticleActionsProps) {

    const handleDownload = (e: React.MouseEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
            return;
        }
        const path = pdfUrl?.replace(/^\/uploads\//, '');
        window.open(`/api/files/download/${path}?token=${token}`, '_blank');
    };

    const handleCite = (style: string) => {
        let text = "";
        const year = new Date(publicationDate).getFullYear();
        const authorText = authors.map(a => a.name).join(', '); // Simple join for now

        if (style === "APA") {
            text = `${authors[0].name} et al. (${year}). ${title}. ${journalName}.`;
        } else if (style === "MLA") {
            text = `${authors[0].name}, et al. "${title}." ${journalName} (${year}).`;
        } else if (style === "BibTeX") {
            text = `@article{${articleId},\n  title={${title}},\n  author={${authors.map(a => a.name).join(' and ')}},\n  journal={${journalName}},\n  year={${year}}\n}`;
        }
        navigator.clipboard.writeText(text);
        toast.success(`Copied ${style} citation to clipboard!`);
    };

    const downloadBibTex = () => {
        const year = new Date(publicationDate).getFullYear();
        const text = `@article{${articleId},\n  title={${title}},\n  author={${authors.map(a => a.name).join(' and ')}},\n  journal={${journalName}},\n  year={${year}}\n}`;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `citation-${articleId}.bib`;
        a.click();
        toast.success("Downloaded BibTeX file");
    };

    return (
        <div>
            {/* Metrics */}
            <Card className="mb-6">
                <h3 className="text-lg font-bold mb-4">Article Metrics</h3>
                <div className="space-y-3">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Downloads</span>
                        <span className="font-semibold">{downloads}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Citations</span>
                        <span className="font-semibold">{citations}</span>
                    </div>
                </div>
            </Card>

            {/* Download/View Options */}
            {/* Download/View Options */}
            <Card className="mb-6">
                <h3 className="text-lg font-bold mb-4">Access Full Text</h3>
                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => {
                            window.open(`/articles/${articleId}/full-text`, '_blank');
                        }}
                        className="w-full btn-primary text-center pt-2 pb-2"
                    >
                        View HTML
                    </button>

                    {pdfUrl && (
                        <>
                            <button
                                onClick={() => {
                                    const token = localStorage.getItem('token');
                                    if (!token) {
                                        window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
                                        return;
                                    }
                                    window.open(`/api/articles/${articleId}/pdf?token=${token}`, '_blank');
                                }}
                                className="w-full btn-secondary text-center pt-2 pb-2"
                            >
                                View PDF
                            </button>

                            <button
                                onClick={() => {
                                    const token = localStorage.getItem('token');
                                    if (!token) {
                                        window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
                                        return;
                                    }
                                    window.location.href = `/api/articles/${articleId}/pdf?token=${token}&download=true`;
                                }}
                                className="w-full btn-secondary text-center pt-2 pb-2"
                            >
                                Download PDF
                            </button>
                        </>
                    )}
                </div>
            </Card>

            {/* Cite */}
            <Card className="mb-6">
                <h3 className="text-lg font-bold mb-4">Cite This Article</h3>
                <div className="space-y-2">
                    <select
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        onChange={(e) => handleCite(e.target.value)}
                        defaultValue=""
                    >
                        <option value="" disabled>Select Citation Style</option>
                        <option value="APA">Copy APA Citation</option>
                        <option value="MLA">Copy MLA Citation</option>
                        <option value="BibTeX">Copy BibTeX</option>
                    </select>

                    <button
                        onClick={downloadBibTex}
                        className="w-full btn-secondary text-sm"
                    >
                        Download BibTeX
                    </button>
                </div>
            </Card>

            {/* Share */}
            <Card className="mb-6">
                <h3 className="text-lg font-bold mb-4">Share</h3>
                <div className="flex gap-2">
                    <button className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                        Twitter
                    </button>
                    <button className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
                        LinkedIn
                    </button>
                </div>
            </Card>

            {fullText && !pdfUrl && (
                <div className="mb-6 mt-6 lg:mt-0 lg:hidden">
                    {/* Mobile view handling */}
                </div>
            )}
        </div>
    );
}
