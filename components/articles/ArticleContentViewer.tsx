"use client";

import { useState } from "react";
import { sanitizeContent } from "@/lib/security/sanitizer";
import { FileText, Code2, Download, ExternalLink } from "lucide-react";

interface Props {
    articleId: string;
    pdfUrl: string | null;
    fullText: string | null;
    abstract: string;
    keywords: string[];
}

export default function ArticleContentViewer({ articleId, pdfUrl, fullText, abstract, keywords }: Props) {
    const [activeTab, setActiveTab] = useState<"abstract" | "fulltext" | "pdf">("abstract");

    const pdfSrc = pdfUrl ? pdfUrl : null;

    const tabs = [
        { id: "abstract" as const, label: "Abstract" },
        ...(fullText ? [{ id: "fulltext" as const, label: "Full Text (HTML)" }] : []),
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

                    {(pdfSrc || fullText) && (
                        <div className="flex gap-3 mt-6">
                            {fullText && (
                                <button
                                    onClick={() => setActiveTab("fulltext")}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-[#007398] text-white text-[14px] font-semibold rounded hover:bg-[#005f7c] transition"
                                >
                                    <Code2 size={16} /> View Full Text (HTML)
                                </button>
                            )}
                            {pdfSrc && (
                                <button
                                    onClick={() => setActiveTab("pdf")}
                                    className="flex items-center gap-2 px-5 py-2.5 border border-[#007398] text-[#007398] text-[14px] font-semibold rounded hover:bg-[#f0f7fa] transition"
                                >
                                    <FileText size={16} /> View PDF
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Full Text Tab */}
            {activeTab === "fulltext" && fullText && (
                <div className="pt-6">
                    <div
                        id="fulltext-content"
                        className="prose max-w-none text-[#1b1c1d] text-[15px] leading-[1.8]
                                   prose-headings:font-serif prose-headings:text-[#1b1c1d] prose-headings:mt-8
                                   prose-p:mb-5 prose-a:text-[#007398] hover:prose-a:underline
                                   prose-img:rounded prose-img:border prose-img:border-[#cfd8dc]
                                   prose-blockquote:border-l-[#007398] prose-blockquote:text-[#4d4d4d]"
                        dangerouslySetInnerHTML={{ __html: sanitizeContent(fullText) }}
                    />
                </div>
            )}

            {/* PDF Tab */}
            {activeTab === "pdf" && pdfSrc && (
                <div className="pt-6">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[13px] text-[#4d4d4d] font-medium">PDF Preview</span>
                        <div className="flex items-center gap-3">
                            <a
                                href={pdfSrc}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-[13px] text-[#007398] hover:underline"
                            >
                                <ExternalLink size={14} /> Open in new tab
                            </a>
                            <a
                                href={pdfSrc}
                                download
                                className="flex items-center gap-1.5 text-[13px] text-[#007398] hover:underline"
                            >
                                <Download size={14} /> Download
                            </a>
                        </div>
                    </div>
                    <div className="border border-[#cfd8dc] rounded overflow-hidden bg-[#f8f9fa]">
                        <iframe
                            src={`${pdfSrc}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
                            className="w-full"
                            style={{ height: "900px" }}
                            title="Article PDF"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
