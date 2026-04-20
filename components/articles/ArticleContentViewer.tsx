"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { FileText, Download, ExternalLink } from "lucide-react";

const PdfCanvasViewer = dynamic(() => import("./PdfCanvasViewer"), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center min-h-[300px]">
            <div className="w-8 h-8 border-4 border-[#007398] border-t-transparent rounded-full animate-spin" />
        </div>
    ),
});

interface Props {
    articleId: string;
    pdfUrl: string | null;
    fullText: string | null;
    abstract: string;
    keywords: string[];
}

export default function ArticleContentViewer({ articleId, pdfUrl, fullText, abstract, keywords }: Props) {
    // If a PDF is available, default to the full-text (PDF canvas) view; else abstract
    const [activeTab, setActiveTab] = useState<"abstract" | "fulltext" | "pdf">("abstract");

    const pdfSrc = pdfUrl || null;

    const tabs = [
        { id: "abstract" as const, label: "Abstract" },
        ...(pdfSrc ? [{ id: "fulltext" as const, label: "Full Text" }] : []),
        ...(pdfSrc ? [{ id: "pdf" as const, label: "PDF" }] : []),
    ];

    return (
        <div>
            {/* Tab switcher */}
            <div className="border-b border-[#cfd8dc] flex gap-0 mb-0">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-5 py-3 text-[14px] font-semibold border-b-2 transition-colors -mb-px ${
                            activeTab === tab.id
                                ? "border-[#e8701a] text-[#e8701a]"
                                : "border-transparent text-[#4d4d4d] hover:text-[#007398]"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Abstract Tab */}
            {activeTab === "abstract" && (
                <div className="pt-6">
                    <div className="bg-[#f8f9fa] border border-[#cfd8dc] p-6 lg:p-8 mb-8" id="abstract">
                        <h2 className="text-[20px] font-serif font-bold text-[#1b1c1d] mb-3">Abstract</h2>
                        <p className="text-[15px] text-[#1b1c1d] leading-[1.7]">{abstract}</p>
                    </div>

                    {keywords && keywords.length > 0 && (
                        <div id="keywords" className="mb-8">
                            <h3 className="text-[15px] font-bold text-[#4d4d4d] uppercase tracking-wide mb-3">Keywords</h3>
                            <div className="flex flex-wrap gap-2">
                                {keywords.map((kw, i) => (
                                    <span key={i} className="px-3 py-1 bg-white border border-[#cfd8dc] text-[13px] text-[#007398] rounded-full hover:bg-[#f0f7fa] cursor-pointer transition">
                                        {kw}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {pdfSrc && (
                        <div className="flex flex-wrap gap-3 mt-6">
                            <button
                                onClick={() => setActiveTab("fulltext")}
                                className="flex items-center gap-2 px-5 py-2.5 bg-[#007398] text-white text-[14px] font-semibold rounded hover:bg-[#005f7c] transition"
                            >
                                <FileText size={16} /> Read Full Text
                            </button>
                            <button
                                onClick={() => setActiveTab("pdf")}
                                className="flex items-center gap-2 px-5 py-2.5 border border-[#007398] text-[#007398] text-[14px] font-semibold rounded hover:bg-[#f0f7fa] transition"
                            >
                                <FileText size={16} /> View PDF
                            </button>
                            <a
                                href={`/articles/${articleId}/html`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-5 py-2.5 border border-[#e8701a] text-[#e8701a] text-[14px] font-semibold rounded hover:bg-[#fff5ee] transition"
                            >
                                <ExternalLink size={16} /> View Full Article
                            </a>
                        </div>
                    )}
                </div>
            )}

            {/* Full Text Tab — renders PDF pages as canvas (100% visual match) */}
            {activeTab === "fulltext" && pdfSrc && (
                <div className="pt-4" id="fulltext-content">
                    <PdfCanvasViewer pdfUrl={pdfSrc} />
                </div>
            )}

            {/* PDF Tab — native browser embed */}
            {activeTab === "pdf" && pdfSrc && (
                <div className="pt-6">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[13px] text-[#4d4d4d] font-medium">PDF Viewer</span>
                        <div className="flex items-center gap-3">
                            <a href={pdfSrc} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-[13px] font-semibold text-[#007398] hover:underline">
                                <ExternalLink size={14} /> Open in new tab
                            </a>
                            <a href={pdfSrc} download
                                className="flex items-center gap-1.5 text-[13px] font-semibold text-[#007398] hover:underline">
                                <Download size={14} /> Download
                            </a>
                        </div>
                    </div>

                    <div className="border border-[#cfd8dc] rounded overflow-hidden bg-[#f8f9fa]">
                        <object data={pdfSrc} type="application/pdf" className="w-full" style={{ height: "900px" }}>
                            {/* Fallback */}
                            <div className="flex flex-col items-center justify-center min-h-[500px] gap-0 p-10 text-center bg-gradient-to-b from-[#f0f7fa] to-[#e8f4f8]">
                                <div className="relative mb-6">
                                    <div className="w-24 h-24 rounded-full bg-[#007398]/10 flex items-center justify-center">
                                        <div className="w-16 h-16 rounded-full bg-[#007398]/15 flex items-center justify-center">
                                            <FileText size={32} className="text-[#007398]" />
                                        </div>
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#e8701a] flex items-center justify-center">
                                        <ExternalLink size={10} className="text-white" />
                                    </div>
                                </div>
                                <h3 className="text-[18px] font-bold text-[#1b1c1d] mb-2">Read the Full Article</h3>
                                <p className="text-[13px] text-[#4d4d4d] max-w-[300px] leading-relaxed mb-8">
                                    Open the PDF in your browser or download it to read offline at your convenience.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-[340px]">
                                    <a href={pdfSrc} target="_blank" rel="noopener noreferrer"
                                        className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-[#007398] text-white text-[14px] font-bold rounded-lg hover:bg-[#005f7c] shadow-md hover:shadow-lg transition-all">
                                        <ExternalLink size={15} /> Open PDF
                                    </a>
                                    <a href={pdfSrc} download
                                        className="flex-1 flex items-center justify-center gap-2 px-5 py-3 border-2 border-[#007398] text-[#007398] text-[14px] font-bold rounded-lg hover:bg-[#007398] hover:text-white transition-all">
                                        <Download size={15} /> Download
                                    </a>
                                </div>
                                <p className="text-[11px] text-[#4d4d4d]/60 mt-6">PDF · Portable Document Format</p>
                            </div>
                        </object>
                    </div>
                </div>
            )}
        </div>
    );
}
