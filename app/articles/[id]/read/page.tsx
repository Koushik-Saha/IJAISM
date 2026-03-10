import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { sanitizeContent } from "@/lib/security/sanitizer";
import { Download, ChevronLeft, Menu, FileText, Settings, Share2, Quote } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const article = await prisma.article.findUnique({
        where: { id },
        select: { title: true },
    });

    return {
        title: `Interactive Reader: ${article?.title || 'Article'} - C5K`,
    };
}

export default async function ReadArticlePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const article = await prisma.article.findUnique({
        where: { id },
        include: {
            journal: { select: { code: true, fullName: true, coverImageUrl: true } },
            author: { select: { name: true, university: true, affiliation: true, email: true } },
            coAuthors: true
        }
    });

    if (!article) {
        return notFound();
    }

    const pdfSource = `/api/articles/${article.id}/pdf`;

    // Aggregate authors
    const allAuthors = [
        { name: article.author.name || "Unknown", affiliation: article.author.affiliation || article.author.university, isMain: true, email: article.author.email },
        ...article.coAuthors.map((ca) => ({ name: ca.name, affiliation: ca.university, isMain: ca.isMain, email: ca.email })),
    ];

    const publicationDate = article.publicationDate
        ? new Date(article.publicationDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
        : "Not yet published";

    const hasFullText = !!(article as any).fullText;
    const htmlContent = hasFullText ? (article as any).fullText : "<p class='text-gray-500 italic'>Full text is currently unavailable for this article. Please download the PDF to view the complete manuscript.</p>";

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
            {/* Top Navigation Bar - Minimal */}
            <header className="bg-white border-b border-gray-200 h-14 flex items-center justify-between px-4 sm:px-6 z-20 sticky top-0 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link
                        href={`/articles/${article.id}`}
                        className="text-gray-500 hover:text-primary transition-colors flex items-center gap-1 font-medium text-sm"
                        title="Back to Article Details"
                    >
                        <ChevronLeft size={18} />
                        Back to article
                    </Link>
                </div>

                <div className="flex items-center gap-3">
                    <a
                        href={`${pdfSource}?download=true`}
                        className="text-sm bg-[#e8701a] text-white px-4 py-1.5 rounded hover:bg-[#d56113] transition-colors flex items-center gap-2 font-medium"
                    >
                        <Download size={16} />
                        <span className="hidden sm:inline">Download PDF</span>
                    </a>
                </div>
            </header>

            {/* Split Pane Layout */}
            <div className="flex-1 max-w-[1400px] w-full mx-auto flex flex-col md:flex-row relative">

                {/* Left Sidebar (Sticky Outline) */}
                <aside className="w-full md:w-64 shrink-0 bg-white border-r border-gray-200 md:sticky md:top-14 md:h-[calc(100vh-3.5rem)] overflow-y-auto hidden lg:block pb-10">
                    <div className="p-6">
                        <div className="mb-6 flex items-center gap-3">
                            {article.journal.coverImageUrl ? (
                                <img src={article.journal.coverImageUrl} alt={article.journal.code} className="w-10 h-14 object-cover border border-gray-200 shadow-sm" />
                            ) : (
                                <div className="w-10 h-14 bg-gray-200 border border-gray-300 flex items-center justify-center">
                                    <FileText className="text-gray-400" size={20} />
                                </div>
                            )}
                            <div>
                                <h3 className="text-xs font-bold text-gray-800 line-clamp-2 leading-tight">{article.journal.fullName}</h3>
                                <p className="text-[10px] text-gray-500 uppercase mt-0.5">{article.journal.code}</p>
                            </div>
                        </div>

                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4 border-b pb-2">Article Outline</h4>
                        <nav className="flex flex-col gap-1.5 text-sm">
                            <a href="#abstract" className="text-gray-600 hover:text-primary py-1 border-l-2 border-transparent hover:border-primary pl-3 transition-colors">Abstract</a>
                            <a href="#keywords" className="text-gray-600 hover:text-primary py-1 border-l-2 border-transparent hover:border-primary pl-3 transition-colors">Keywords</a>
                            {hasFullText && (
                                <a href="#full-text" className="text-gray-600 hover:text-primary py-1 border-l-2 border-transparent hover:border-primary pl-3 transition-colors">Full Text</a>
                            )}
                            {/* In a fully dynamic system, you'd parse headers from the HTML body here */}
                        </nav>
                    </div>
                </aside>

                {/* Main Article Content */}
                <main className="flex-1 bg-white min-h-[calc(100vh-3.5rem)] lg:border-r lg:border-gray-200">
                    <div className="max-w-3xl mx-auto px-6 lg:px-12 py-10 lg:py-16">

                        {/* Article Header */}
                        <header className="mb-10">
                            {/* Meta Info */}
                            <div className="flex flex-col gap-1 mb-6">
                                <span className="text-gray-600 font-serif text-lg">{article.journal.fullName}</span>
                                {article.volume && article.issue && (
                                    <span className="text-gray-500 text-sm">Volume {article.volume}, Issue {article.issue}, {publicationDate}</span>
                                )}
                            </div>

                            {/* Title */}
                            <h1 className="text-3xl md:text-4xl lg:text-[2.6rem] font-serif font-medium text-gray-900 leading-tight mb-8">
                                {article.title}
                            </h1>

                            {/* Actions Banner */}
                            <div className="flex items-center gap-4 py-3 border-y border-gray-100 mb-8">
                                <button className="text-sm font-medium text-blue-600 hover:text-primary flex items-center gap-1.5" title="Copy Link">
                                    <Share2 size={16} /> Share
                                </button>
                                <button className="text-sm font-medium text-blue-600 hover:text-primary flex items-center gap-1.5" title="Copy Citation">
                                    <Quote size={16} /> Cite
                                </button>
                            </div>

                            {/* Authors */}
                            <div className="mb-4">
                                <div className="flex flex-wrap gap-x-2 gap-y-1 text-base text-gray-800">
                                    {allAuthors.map((author, idx) => (
                                        <span key={idx}>
                                            <a href="#" className="hover:underline hover:text-primary">{author.name}</a>
                                            <sup className="ml-0.5 text-xs text-gray-500">{idx + 1}</sup>
                                            {idx < allAuthors.length - 1 && <span>,</span>}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Affiliations */}
                            <div className="text-sm text-gray-600 mb-8 flex flex-col gap-1 mt-4">
                                {allAuthors.map((author, idx) => (
                                    author.affiliation && (
                                        <div key={`aff-${idx}`} className="flex items-start gap-2">
                                            <sup className="mt-1">{idx + 1}</sup>
                                            <span>{author.affiliation}</span>
                                        </div>
                                    )
                                ))}
                            </div>
                        </header>

                        <hr className="my-10 border-gray-200" />

                        {/* Abstract */}
                        <section id="abstract" className="mb-10 scroll-mt-20">
                            <h2 className="text-2xl font-serif font-bold text-gray-900 mb-4 tracking-tight">Abstract</h2>
                            <p className="text-gray-800 leading-relaxed text-lg">
                                {article.abstract}
                            </p>
                        </section>

                        {/* Keywords */}
                        {(article.keywords && article.keywords.length > 0) && (
                            <section id="keywords" className="mb-10 scroll-mt-20">
                                <h3 className="text-xl font-serif font-bold text-gray-900 mb-3 tracking-tight">Keywords</h3>
                                <div className="flex flex-wrap gap-2 text-gray-800">
                                    {article.keywords.map((kw, idx) => (
                                        <span key={idx} className="after:content-[';'] last:after:content-[''] pr-1">
                                            {kw}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        )}

                        <hr className="my-10 border-gray-200" />

                        {/* Full Text / Body */}
                        <section id="full-text" className="scroll-mt-20 pb-20">
                            {hasFullText && (
                                <h2 className="text-2xl font-serif font-bold text-gray-900 mb-6 tracking-tight">1. Introduction</h2>
                            )}
                            <div
                                className="prose prose-lg max-w-none text-gray-800 
                                           prose-headings:font-serif prose-headings:font-bold prose-headings:text-gray-900 
                                           prose-p:leading-relaxed prose-a:text-blue-600 hover:prose-a:text-blue-800
                                           prose-img:rounded-md prose-img:shadow-sm mt-4"
                                dangerouslySetInnerHTML={{ __html: sanitizeContent(htmlContent) }}
                            />
                        </section>

                    </div>
                </main>

                {/* Optional Right Sidebar (Metrics / Recommended) */}
                <aside className="w-full md:w-72 bg-gray-50 border-l border-gray-200 hidden xl:block p-6">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Metrics</h3>
                    <div className="bg-white p-4 rounded border border-gray-200 shadow-sm flex items-center justify-between mb-6">
                        <div className="flex flex-col">
                            <span className="text-2xl font-light text-primary">{article.viewCount || 0}</span>
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Views</span>
                        </div>
                        <div className="w-px h-8 bg-gray-200"></div>
                        <div className="flex flex-col items-end">
                            <span className="text-2xl font-light text-[#e8701a]">{article.downloadCount || 0}</span>
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Downloads</span>
                        </div>
                    </div>

                    <div className="mt-8 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                        <h4 className="text-sm font-semibold text-blue-900 mb-2 border-b border-blue-200 pb-2">Access Rights</h4>
                        <p className="text-xs text-blue-800 leading-relaxed mb-3">
                            {article.isOpenAccess ? (
                                "This article is open access and distributed under the terms of the Creative Commons Attribution License."
                            ) : (
                                "Full text access may require a subscription. Download limits apply."
                            )}
                        </p>
                    </div>
                </aside>

            </div>
        </div>
    );
}
