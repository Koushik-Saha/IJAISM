"use client";

import { useState } from "react";
import { Share2, Quote, Copy, Check, X } from "lucide-react";

interface Props {
    title: string;
    authors: string[];
    journal: string;
    volume?: number | null;
    issue?: number | null;
    year?: string;
    doi?: string | null;
    articleId: string;
}

export default function ArticleCiteShare({ title, authors, journal, volume, issue, year, doi, articleId }: Props) {
    const [showCite, setShowCite] = useState(false);
    const [copied, setCopied] = useState(false);
    const [citeStyle, setCiteStyle] = useState<"apa" | "mla" | "bibtex">("apa");

    const authorStr = authors.join(", ");
    const yr = year || new Date().getFullYear().toString();
    const doiLink = doi || `https://doi.org/10.63471/${articleId}`;
    const doiId = doi ? doi.replace("https://doi.org/", "") : `10.63471/${articleId}`;

    const citations: Record<"apa" | "mla" | "bibtex", string> = {
        apa: `${authorStr} (${yr}). ${title}. ${journal}${volume ? `, ${volume}` : ""}${issue ? `(${issue})` : ""}. ${doiLink}`,
        mla: `${authorStr}. "${title}." ${journal}${volume ? `, vol. ${volume}` : ""}${issue ? `, no. ${issue}` : ""}, ${yr}. ${doiLink}`,
        bibtex: `@article{${articleId.substring(0, 8)},\n  title={${title}},\n  author={${authorStr}},\n  journal={${journal}},\n  volume={${volume || ""}},\n  number={${issue || ""}},\n  year={${yr}},\n  doi={${doiId}}\n}`,
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(citations[citeStyle]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex items-center gap-4 py-3 border-t border-[#cfd8dc]">
            <button
                onClick={() => setShowCite(true)}
                className="flex items-center gap-1.5 text-[14px] font-medium text-[#007398] hover:text-[#005f7c] hover:bg-gray-50 px-2 py-1.5 rounded transition"
            >
                <Quote size={16} /> Cite
            </button>
            <button
                onClick={() => {
                    if (navigator.share) {
                        navigator.share({ title, url: window.location.href });
                    } else {
                        navigator.clipboard.writeText(window.location.href);
                    }
                }}
                className="flex items-center gap-1.5 text-[14px] font-medium text-[#007398] hover:text-[#005f7c] hover:bg-gray-50 px-2 py-1.5 rounded transition"
            >
                <Share2 size={15} /> Share
            </button>

            {/* Citation Modal */}
            {showCite && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl border border-[#cfd8dc]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#cfd8dc]">
                            <h3 className="font-bold text-[16px] text-[#1b1c1d]">Cite this article</h3>
                            <button onClick={() => setShowCite(false)} className="text-gray-400 hover:text-gray-700">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="px-6 py-5">
                            <div className="flex gap-2 mb-4">
                                {(["apa", "mla", "bibtex"] as const).map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setCiteStyle(s)}
                                        className={`px-4 py-1.5 rounded-full text-[13px] font-semibold border transition ${
                                            citeStyle === s
                                                ? "bg-[#007398] text-white border-[#007398]"
                                                : "border-[#cfd8dc] text-[#4d4d4d] hover:bg-gray-50"
                                        }`}
                                    >
                                        {s.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                            <div className="bg-[#f8f9fa] border border-[#cfd8dc] rounded p-4 text-[13px] text-[#1b1c1d] whitespace-pre-wrap font-mono leading-relaxed">
                                {citations[citeStyle]}
                            </div>
                            <button
                                onClick={handleCopy}
                                className="mt-3 flex items-center gap-2 px-4 py-2 bg-[#007398] text-white text-[13px] font-semibold rounded hover:bg-[#005f7c] transition"
                            >
                                {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy citation</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
