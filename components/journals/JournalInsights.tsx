"use client";

import Link from "next/link";

interface JournalInsightsProps {
    journalCode: string;
    aimsAndScope: string | null;
    issn: string | null;
    eIssn: string | null;
    subjectAreas: string | null;
    articleProcessingCharge: number | null;
    indexing: string | null;
    timeToFirstDecision: string | null;
    reviewTime: string | null;
    revisionTime: string | null;
    submissionToAcceptance: string | null;
    acceptanceToPublication: string | null;
}

export default function JournalInsights({
    journalCode,
    aimsAndScope,
    issn,
    eIssn,
    subjectAreas,
    articleProcessingCharge,
    indexing,
    timeToFirstDecision,
    reviewTime,
    revisionTime,
    submissionToAcceptance,
    acceptanceToPublication,
}: JournalInsightsProps) {

    // Helper to split bullet points if they are in a single string separated by " • " or "•"
    const subjectList = subjectAreas
        ? subjectAreas.split(/•/g).map(s => s.trim()).filter(s => s.length > 0)
        : [];

    const indexingList = indexing
        ? indexing.split(/,|•|\n/).map(s => s.trim()).filter(s => s.length > 0)
        : [];

    return (
        <div className="bg-white p-8 border-t border-gray-200 mt-12">
            <h2 className="text-3xl font-bold mb-8 font-serif text-gray-900 border-b-2 border-gray-900 pb-2 inline-block">
                Journal Insights
            </h2>

            <div className="space-y-8 divide-y divide-gray-100">

                {/* Aims & Scope */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-4">
                    <div className="font-bold text-lg text-gray-900">Aims & Scope</div>
                    <div className="md:col-span-3">
                        <p className="mb-2 text-gray-800 line-clamp-2">
                            {aimsAndScope || "No aims and scope available."}
                        </p>
                        <Link
                            href={`/journals/${journalCode}/overview`}
                            className="text-blue-700 hover:underline font-semibold text-sm"
                        >
                            View full aims & scope
                        </Link>
                    </div>
                </div>

                {/* ISSN */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-4 pt-8">
                    <div className="font-bold text-lg text-gray-900">ISSN</div>
                    <div className="md:col-span-3 text-gray-800 font-medium">
                        {eIssn && <span>Online ISSN: {eIssn}</span>}
                        {eIssn && issn && <span className="mx-3 text-gray-400">|</span>}
                        {issn && <span>Print ISSN: {issn}</span>}
                    </div>
                </div>

                {/* Subject Areas */}
                {subjectList.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-4 pt-8">
                        <div className="font-bold text-lg text-gray-900">Subject Areas</div>
                        <div className="md:col-span-3">
                            <ul className="leading-relaxed text-gray-800">
                                {subjectList.map((area, idx) => (
                                    <li key={idx} className="mb-1">
                                        • {area}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {/* Article Publishing Charge */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-4 pt-8">
                    <div className="font-bold text-lg text-gray-900">Article publishing charge</div>
                    <div className="md:col-span-3">
                        <div className="text-3xl font-bold font-serif mb-2">
                            {articleProcessingCharge ? `$${articleProcessingCharge}` : "Free"}
                        </div>
                        <div className="text-sm font-semibold text-gray-700 mb-2">
                            Article publishing charge for open access
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            This journal offers authors the choice to publish their work open access.
                            To publish open access, an Article Publishing Charge (APC) applies.
                        </p>
                    </div>
                </div>

                {/* Publishing Timeline */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-4 pt-8">
                    <div className="font-bold text-lg text-gray-900">Publishing timeline</div>
                    <div className="md:col-span-3">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                            <div>
                                <div className="text-2xl font-bold font-serif">{timeToFirstDecision || "N/A"}</div>
                                <div className="text-xs text-gray-600 mt-1">Time to first decision</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold font-serif">{reviewTime || "N/A"}</div>
                                <div className="text-xs text-gray-600 mt-1">Review time</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold font-serif">{revisionTime || "N/A"}</div>
                                <div className="text-xs text-gray-600 mt-1">Revision time</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold font-serif">{submissionToAcceptance || "N/A"}</div>
                                <div className="text-xs text-gray-600 mt-1">Submission to Acceptance</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold font-serif">{acceptanceToPublication || "N/A"}</div>
                                <div className="text-xs text-gray-600 mt-1">Acceptance to publication</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Abstracting and Indexing */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-4 pt-8">
                    <div className="font-bold text-lg text-gray-900">Abstracting and indexing</div>
                    <div className="md:col-span-3">
                        <ul className="space-y-1">
                            {indexingList.map((idxItem, i) => (
                                <li key={i} className="flex items-center text-gray-800">
                                    <span className="mr-2">•</span> {idxItem}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

            </div>
        </div>
    );
}
