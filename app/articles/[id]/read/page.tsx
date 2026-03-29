import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { sanitizeContent } from "@/lib/security/sanitizer";
import { Search, User, Key, ChevronDown, Plus, Share2, Quote, MessageSquare } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const article = await prisma.article.findUnique({
        where: { id },
        select: { title: true },
    });

    return {
        title: `${article?.title || 'Article'} - C5K Advanced Info Systems`,
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

    // Fetch Recommended Articles (same journal, not the current one, max 3)
    const recommendedArticles = await prisma.article.findMany({
        where: {
            journalId: article.journalId,
            id: { not: article.id },
            status: 'published'
        },
        select: {
            id: true,
            title: true,
            journal: { select: { fullName: true } },
            publicationDate: true,
            author: { select: { name: true } },
            volume: true
        },
        take: 3,
        orderBy: { publicationDate: 'desc' }
    });

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
    const htmlContent = hasFullText ? (article as any).fullText : "<p class='text-gray-600 italic mt-4'>Full text is currently unavailable for this article. Please download the PDF to view the complete manuscript.</p>";

    return (
        <div className="flex flex-col min-h-screen bg-white font-sans text-[#1b1c1d]">
            
            {/* 1. Global Navigation Bar (ScienceDirect Style) */}
            <header className="bg-white h-16 flex items-center justify-between px-6 z-30 sticky top-0 shadow-[0_2px_4px_rgba(0,0,0,0.08)]">
                <div className="flex items-center gap-8 h-full">
                    {/* Fake Logo */}
                    <Link href="/" className="flex items-center gap-2 h-full">
                        <div className="w-8 h-10 bg-[url('/img/logo.png')] bg-contain bg-no-repeat bg-center opacity-80" />
                        <span className="text-[#e8701a] font-serif text-2xl tracking-tight">C5K Platform</span>
                    </Link>
                    <nav className="hidden lg:flex items-center h-full space-x-6 text-[15px] font-medium text-[#4d4d4d]">
                        <Link href="/journals" className="hover:text-[#007398]">Journals & Books</Link>
                    </nav>
                </div>

                <div className="flex items-center h-full space-x-6 text-[15px] font-medium text-[#4d4d4d]">
                    <button className="flex items-center gap-1.5 hover:text-[#007398]">
                        <span className="w-5 h-5 flex items-center justify-center rounded-full border border-current text-[11px] font-bold">?</span>
                        Help
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-[#007398]">
                        <Search size={18} /> Search
                    </button>
                    <Link href="/dashboard" className="flex items-center gap-1.5 hover:text-[#007398]">
                        <User size={18} /> My account
                    </Link>
                    <Link href="/login" className="flex items-center gap-1.5 hover:text-[#007398]">
                        <Key size={18} /> Sign in
                    </Link>
                </div>
            </header>

            {/* 2. Access / Purchase PDF Bar (Only if published) */}
            {article.status === 'published' && (
                <div className="border-b border-[#cfd8dc] bg-[#f8f9fa] flex items-center px-6 h-12 sticky top-16 z-20 shadow-sm">
                    <div className="flex items-center max-w-[1400px] w-full mx-auto gap-4">
                        <div className="bg-[#007398] text-white flex items-center h-full px-4 font-bold text-[14px] cursor-pointer hover:bg-[#005f7c] transition">
                            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Access through your organization
                        </div>
                        {/* PDF Download Tracking Link */}
                        <a href={`${pdfSource}?download=true`} target="_blank" rel="noopener noreferrer" className="text-[#007398] font-bold py-2 px-3 text-[14px] hover:underline flex items-center">
                            Purchase or Download PDF
                        </a>
                    </div>
                </div>
            )}

            {/* Split Pane Layout */}
            <div className="flex-1 max-w-[1500px] w-full mx-auto flex lg:flex-row flex-col relative">

                {/* Left Sidebar: Article preview */}
                <aside className="w-full lg:w-[260px] shrink-0 bg-white border-r border-[#cfd8dc] lg:sticky lg:top-[112px] lg:h-[calc(100vh-112px)] overflow-y-auto hidden lg:block pt-8 pr-4">
                    <div className="pl-6">
                        <h4 className="text-[16px] font-bold text-[#4d4d4d] mb-4">Article preview</h4>
                        <nav className="flex flex-col gap-3 text-[14px]">
                            <a href="#abstract" className="text-[#007398] hover:underline">Abstract</a>
                            {article.keywords?.length > 0 && (
                                <a href="#keywords" className="text-[#007398] hover:underline">Keywords</a>
                            )}
                            {hasFullText && (
                                <a href="#introduction" className="text-[#007398] hover:underline">Introduction</a>
                            )}
                            {/* Further sections would dynamic parse HTML here */}
                        </nav>
                    </div>
                </aside>

                {/* Main Article Content */}
                <main className="flex-1 bg-white min-h-[calc(100vh-112px)] relative">
                    <div className="max-w-[850px] mx-auto px-6 py-12">

                        {/* Article Header */}
                        <header className="mb-12">
                            {/* Journal Info Block */}
                            <div className="flex items-start gap-4 mb-8">
                                {article.journal.coverImageUrl ? (
                                    <img src={article.journal.coverImageUrl} alt={article.journal.code} className="w-[84px] h-[112px] object-cover border border-[#cfd8dc] shadow-sm" />
                                ) : (
                                    <div className="w-[84px] h-[112px] bg-[#eef1f3] border border-[#cfd8dc] text-[10px] flex items-center justify-center text-center p-2 text-primary font-bold">
                                        {article.journal.code}
                                    </div>
                                )}
                                <div className="pt-2">
                                    <h3 className="text-[22px] text-[#4d4d4d] hover:text-[#007398] cursor-pointer mb-1 leading-tight">{article.journal.fullName}</h3>
                                    <p className="text-[14px] text-[#007398] hover:underline cursor-pointer mb-0">
                                        Volume {article.volume || 1}, {publicationDate}
                                    </p>
                                </div>
                            </div>

                            {/* Title */}
                            <h1 className="text-[34px] font-serif font-bold text-[#1b1c1d] leading-[1.25] mb-6">
                                {article.title}
                            </h1>

                            {/* Authors Block */}
                            <div className="mb-4">
                                <div className="text-[16px] flex flex-wrap gap-1 leading-relaxed">
                                    {allAuthors.map((author, idx) => {
                                        // Simple letters for superscripts: a, b, c
                                        const letter = String.fromCharCode(97 + idx); // 97 is 'a'
                                        return (
                                            <span key={idx} className="inline-flex items-center">
                                                <a href="#" className="text-[#007398] hover:underline decoration-1 underline-offset-2">
                                                    {author.name}
                                                </a>
                                                <sup className="ml-[2px] text-[11px] text-[#4d4d4d] font-semibold">{letter}</sup>
                                                {author.email && (
                                                    <sup className="ml-[2px] text-[11px] text-[#4d4d4d]" title={author.email}>✉</sup>
                                                )}
                                                {idx < allAuthors.length - 1 && <span className="mr-2">,</span>}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Show More Dropdown for Affiliations (In real React this would use state, here we do pure CSS/HTML or a small client component script. For now static representation) */}
                            <details className="group mb-8">
                                <summary className="flex items-center gap-1 text-[#007398] text-[14px] font-medium cursor-pointer hover:underline list-none">
                                    Show more <ChevronDown size={16} className="group-open:rotate-180 transition-transform" />
                                </summary>
                                <div className="pt-4 text-[13px] text-[#4d4d4d] flex flex-col gap-2">
                                    {allAuthors.map((author, idx) => {
                                        const letter = String.fromCharCode(97 + idx);
                                        return author.affiliation && (
                                            <div key={`aff-${idx}`} className="flex items-start gap-2">
                                                <sup className="mt-0.5 text-[#007398] font-bold">{letter}</sup>
                                                <span>{author.affiliation}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </details>

                            {/* Actions Banner */}
                            <div className="flex items-center gap-6 py-2">
                                <button className="text-[14px] font-medium text-[#007398] hover:underline flex items-center gap-1.5 border border-transparent hover:bg-gray-50 p-1.5 -ml-1.5 rounded">
                                    <Plus size={18} strokeWidth={2.5} /> Add to Mendeley
                                </button>
                                <button className="text-[14px] font-medium text-[#007398] hover:underline flex items-center gap-1.5 border border-transparent hover:bg-gray-50 p-1.5 -ml-1.5 rounded">
                                    <Share2 size={16} strokeWidth={2} /> Share
                                </button>
                                <button className="text-[14px] font-medium text-[#007398] hover:underline flex items-center gap-1.5 border border-transparent hover:bg-gray-50 p-1.5 -ml-1.5 rounded">
                                    <Quote size={17} strokeWidth={2} /> Cite
                                </button>
                            </div>

                            {/* DOI block */}
                            {article.doi && (
                                <div className="mt-4 pt-4 border-t border-[#cfd8dc] flex items-center justify-between text-[13px]">
                                    <a href={`https://doi.org/${article.doi}`} className="text-[#007398] hover:underline break-all">
                                        https://doi.org/{article.doi}
                                    </a>
                                    <a href="#" className="hidden sm:block text-[#007398] hover:underline whitespace-nowrap ml-4">
                                        Get rights and content
                                    </a>
                                </div>
                            )}
                        </header>

                        {/* Abstract block */}
                        <div className="bg-[#f8f9fa] border border-[#cfd8dc] p-6 lg:p-8 mb-10">
                            <section id="abstract" className="scroll-mt-[130px]">
                                <h2 className="text-[22px] font-serif text-[#1b1c1d] mb-4">Abstract</h2>
                                <p className="text-[16px] text-[#1b1c1d] leading-[1.6]">
                                    {article.abstract}
                                </p>
                            </section>
                        </div>

                        {/* Full Text Render */}
                        <section id="introduction" className="scroll-mt-[130px] pb-24 border-t border-[#cfd8dc] pt-10">
                            {hasFullText && (
                                <h2 className="text-[22px] font-serif text-[#1b1c1d] mb-6">Introduction</h2>
                            )}
                            <div
                                className="prose max-w-none text-[#1b1c1d] text-[16px] leading-[1.6]
                                           prose-headings:font-serif prose-headings:text-[22px] prose-headings:text-[#1b1c1d] prose-headings:mt-8 prose-headings:font-normal
                                           prose-p:mb-5 prose-a:text-[#007398] hover:prose-a:underline
                                           prose-img:rounded-sm prose-img:border prose-img:border-[#cfd8dc]"
                                dangerouslySetInnerHTML={{ __html: sanitizeContent(htmlContent) }}
                            />
                        </section>

                    </div>

                    {/* Left/Right Floating Buttons */}
                    <div className="fixed bottom-6 left-6 z-40 hidden xl:block">
                        <button className="bg-[#1b1c1d] hover:bg-black text-white px-5 py-2.5 rounded-full flex items-center gap-2 font-bold text-[14px] shadow-lg transition-transform hover:-translate-y-0.5">
                            <Quote size={18} /> Get citation
                        </button>
                    </div>
                </main>

                {/* Right Sidebar: Recommended articles */}
                <aside className="w-full xl:w-[350px] shrink-0 bg-white border-l border-[#cfd8dc] hidden xl:block pt-8 px-6 pb-20">
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="text-[16px] font-bold text-[#4d4d4d]">Recommended articles</h4>
                        <ChevronDown size={20} className="text-[#007398]" />
                    </div>
                    
                    <div className="flex flex-col gap-6">
                        {recommendedArticles.map(rec => (
                            <div key={rec.id} className="border-b border-[#cfd8dc] pb-6 last:border-0 hover:bg-gray-50 -mx-3 px-3 py-2 rounded transition cursor-pointer group">
                                <Link href={`/articles/${rec.id}/read`} className="block">
                                    <h5 className="text-[15px] text-[#007398] group-hover:underline font-serif leading-snug mb-2">
                                        {rec.title}
                                    </h5>
                                    <p className="text-[12px] text-[#4d4d4d] mb-1">
                                        {rec.journal.fullName}, Volume {rec.volume || 1}, {new Date(rec.publicationDate!).getFullYear() || '2026'}...
                                    </p>
                                    <p className="text-[12px] text-[#4d4d4d] font-medium">
                                        {rec.author.name}
                                    </p>
                                </Link>
                            </div>
                        ))}
                        {recommendedArticles.length === 0 && (
                            <p className="text-[13px] text-gray-500 italic">No recommended articles found.</p>
                        )}
                        
                        {recommendedArticles.length > 0 && (
                            <button className="text-[#007398] text-[14px] font-medium hover:underline flex items-center gap-1">
                                Show {recommendedArticles.length} more articles <ChevronDown size={16} />
                            </button>
                        )}
                    </div>

                    {/* Tracking / Metrics placeholder block similar to ScienceDirect right column metrics */}
                    <div className="mt-12 pt-8 border-t border-[#cfd8dc]">
                        <h4 className="text-[16px] font-bold text-[#4d4d4d] mb-4">Article Metrics</h4>
                        <div className="text-[13px] text-[#4d4d4d] flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span>Citations</span>
                                <span className="font-bold">{article.citationCount}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Captures (Downloads)</span>
                                <span className="font-bold">{article.downloadCount}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Views</span>
                                <span className="font-bold">{article.viewCount}</span>
                            </div>
                        </div>
                    </div>
                </aside>
                
                {/* Floating Feedback button */}
                <div className="fixed bottom-0 right-6 z-40 hidden xl:block">
                    <button className="bg-[#007398] hover:bg-[#005f7c] text-white px-4 py-1.5 rounded-t-md flex items-center gap-2 font-medium text-[13px] shadow-lg">
                        <MessageSquare size={16} /> FEEDBACK
                    </button>
                </div>

            </div>
            
            {/* Simple Footer mimicking Elsevier */}
            <footer className="mt-auto border-t-4 border-[#e8701a] py-6 px-10 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                <div className="max-w-[1500px] mx-auto text-[12px] text-[#4d4d4d] flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 opacity-70">
                        <div className="w-6 h-6 bg-[url('/img/logo.png')] bg-contain bg-no-repeat bg-center" />
                        <span className="font-bold">C5K Platform © 2026</span>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap justify-center">
                        <a href="#" className="hover:underline">About C5K</a>
                        <a href="#" className="hover:underline">Remote access</a>
                        <a href="#" className="hover:underline">Contact and support</a>
                        <a href="#" className="hover:underline">Terms and conditions</a>
                        <a href="#" className="hover:underline">Privacy policy</a>
                        <a href="#" className="hover:underline">Cookie settings</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
