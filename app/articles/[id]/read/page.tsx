import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { ChevronRight, Download, BookOpen, Calendar, Hash, Globe, FileText, BarChart2 } from "lucide-react";
import ArticleContentViewer from "@/components/articles/ArticleContentViewer";
import ArticleCiteShare from "@/components/articles/ArticleCiteShare";
import AuthorListWithModal from "@/components/articles/AuthorListWithModal";
import SafeJournalCover from "@/components/journals/SafeJournalCover";

function journalCoverUrl(raw: string | null): string | null {
    if (!raw) return null;
    if (raw.startsWith("http")) return raw;
    return `https://c5k.com/public/backend/journal/${raw.replace(/^\//, "")}`;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const article = await prisma.article.findUnique({
        where: { id },
        select: { title: true, abstract: true },
    });
    return {
        title: `${article?.title || "Article"} - C5K Advanced Info Systems`,
        description: article?.abstract?.substring(0, 160),
    };
}

export default async function ReadArticlePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const article = await prisma.article.findUnique({
        where: { id },
        include: {
            journal: {
                select: {
                    id: true, code: true, fullName: true, coverImageUrl: true,
                    issn: true, eIssn: true, themeColor: true,
                },
            },
            author: {
                select: { name: true, university: true, affiliation: true, email: true },
            },
            coAuthors: { orderBy: { order: "asc" } },
        },
    });

    // Ensure we exist, then safely increment views on page load (background async)
    if (!article) {
        return notFound();
    }

    await prisma.article.update({
        where: { id: article.id },
        data: { viewCount: { increment: 1 } }
    }).catch(console.error);

    const recommendedArticles = await prisma.article.findMany({
        where: { journalId: article.journalId, id: { not: article.id }, status: "published" },
        select: {
            id: true, title: true, volume: true, issue: true, publicationDate: true,
            author: { select: { name: true } },
            coAuthors: { select: { name: true, isMain: true }, orderBy: { order: "asc" }, take: 1 },
        },
        take: 5,
        orderBy: { publicationDate: "desc" },
    });

    // Aggregate authors
    let allAuthors = [
        {
            name: article.author.name || "Unknown",
            affiliation: article.author.affiliation || article.author.university || null,
            email: article.author.email,
            isMain: true,
        },
        ...article.coAuthors.map((ca) => ({
            name: ca.name,
            affiliation: (ca as any).university || null,
            email: (ca as any).email || null,
            isMain: ca.isMain,
        })),
    ];

    // Remove the migration admin from the authors list
    allAuthors = allAuthors.filter(a => a.name !== 'The Mother Admin');

    const pubDate = article.publicationDate
        ? new Date(article.publicationDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
        : null;
    const pubYear = article.publicationDate ? new Date(article.publicationDate).getFullYear().toString() : null;

    const subDate = article.submissionDate
        ? new Date(article.submissionDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
        : null;
    const accDate = article.acceptanceDate
        ? new Date(article.acceptanceDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
        : null;

    // DOI — stored as full URL or just suffix
    const doiFull = article.doi || null;
    const doiSuffix = doiFull
        ? doiFull.replace("https://doi.org/", "")
        : null;
    const articleCode = doiFull
        ? doiFull.replace("https://doi.org/10.63471/", "")
        : null;

    // PDF path — direct public file
    const pdfUrl = article.pdfUrl || null;
    const hasFullText = !!(article as any).fullText && (article as any).fullText.length > 100;

    const themeColor = article.journal.themeColor || "#007398";

    return (
        <div className="flex flex-col min-h-screen bg-white font-sans text-[#1b1c1d]">

            {/* ── Top Navigation Bar ─────────────────────────────────────────── */}
            <header className="bg-white h-14 flex items-center justify-between px-6 z-30 sticky top-0 shadow-[0_1px_4px_rgba(0,0,0,0.10)] border-b border-gray-100">
                <div className="flex items-center gap-6">
                    <Link href="/" className="flex items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/logo.png" alt="C5K" className="h-8 w-auto object-contain opacity-90" />
                        <span className="text-[#e8701a] font-serif text-xl font-bold tracking-tight hidden sm:block">C5K Platform</span>
                    </Link>
                    <nav className="hidden lg:flex items-center gap-5 text-[14px] font-medium text-[#4d4d4d]">
                        <Link href="/journals" className="hover:text-[#007398] transition-colors">Journals</Link>
                        <Link href="/articles" className="hover:text-[#007398] transition-colors">Articles</Link>
                    </nav>
                </div>
                <div className="flex items-center gap-4 text-[14px] font-medium text-[#4d4d4d]">
                    <Link href="/dashboard" className="hover:text-[#007398] transition-colors hidden sm:block">My Account</Link>
                    <Link href="/login" className="px-4 py-1.5 border border-[#007398] text-[#007398] rounded text-[13px] font-semibold hover:bg-[#f0f7fa] transition">Sign In</Link>
                </div>
            </header>

            {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
            <div className="bg-[#f8f9fa] border-b border-[#cfd8dc] px-6 py-2.5">
                <div className="max-w-[1400px] mx-auto flex items-center gap-1.5 text-[12px] text-[#4d4d4d] flex-wrap">
                    <Link href="/" className="hover:text-[#007398] hover:underline">Home</Link>
                    <ChevronRight size={12} className="text-gray-400" />
                    <Link href="/journals" className="hover:text-[#007398] hover:underline">Journals</Link>
                    <ChevronRight size={12} className="text-gray-400" />
                    <Link href={`/journal/${article.journal.code}`} className="hover:text-[#007398] hover:underline">
                        {article.journal.code.toUpperCase()}
                    </Link>
                    {article.volume && (
                        <>
                            <ChevronRight size={12} className="text-gray-400" />
                            <span>Vol. {article.volume}{article.issue ? `, Iss. ${article.issue}` : ""}</span>
                        </>
                    )}
                    <ChevronRight size={12} className="text-gray-400" />
                    <span className="text-[#1b1c1d] font-medium truncate max-w-[200px]">{article.title.substring(0, 50)}{article.title.length > 50 ? "…" : ""}</span>
                </div>
            </div>

            {/* ── Main 3-Column Layout ───────────────────────────────────────── */}
            <div className="flex-1 max-w-[1400px] w-full mx-auto flex lg:flex-row flex-col">

                {/* LEFT sidebar – section navigation */}
                <aside className="hidden lg:block w-[220px] shrink-0 border-r border-[#cfd8dc] sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto pt-8 pr-4">
                    <div className="pl-5">
                        <p className="text-[11px] font-bold text-[#4d4d4d] uppercase tracking-widest mb-4">Sections</p>
                        <nav className="flex flex-col gap-2.5 text-[13px]">
                            <a href="#abstract" className="text-[#007398] hover:underline">Abstract</a>
                            {article.keywords?.length > 0 && (
                                <a href="#keywords" className="text-[#007398] hover:underline">Keywords</a>
                            )}
                            {hasFullText && <a href="#fulltext-content" className="text-[#007398] hover:underline">Full Text</a>}
                            {pdfUrl && <a href="#pdf-viewer" className="text-[#007398] hover:underline">PDF Viewer</a>}
                            <a href="#article-info" className="text-[#007398] hover:underline">Article Info</a>
                            <a href="#metrics" className="text-[#007398] hover:underline">Metrics</a>
                        </nav>

                        {/* Journal mini card */}
                        <div className="mt-10 border-t border-[#cfd8dc] pt-6">
                            <p className="text-[11px] font-bold text-[#4d4d4d] uppercase tracking-widest mb-3">Journal</p>
                            <Link href={`/journal/${article.journal.code}`}>
                                <SafeJournalCover
                                    code={article.journal.code}
                                    coverImageUrl={article.journal.coverImageUrl}
                                    themeColor={themeColor}
                                    className="w-[80px] h-[107px] object-cover border border-[#cfd8dc] shadow-sm mb-2 hover:opacity-90 transition"
                                    fallbackClassName="w-[80px] h-[107px] flex items-center justify-center text-center p-2 border border-[#cfd8dc] shadow-sm mb-2 text-[10px] font-bold text-white rounded-sm"
                                />
                                <p className="text-[11px] text-[#007398] hover:underline leading-snug">{article.journal.fullName}</p>
                            </Link>
                        </div>
                    </div>
                </aside>

                {/* ── MAIN CONTENT ───────────────────────────────────────────── */}
                <main className="flex-1 min-w-0 bg-white">
                    <div className="max-w-[800px] mx-auto px-6 py-10">

                        {/* ── Article Header ──────────────────────────────────── */}
                        <header className="mb-10">

                            {/* Journal + volume info row */}
                            <div className="flex items-start gap-4 mb-6">
                                <Link href={`/journal/${article.journal.code}`} className="shrink-0">
                                    <SafeJournalCover
                                        code={article.journal.code}
                                        coverImageUrl={article.journal.coverImageUrl}
                                        themeColor={themeColor}
                                        className="w-[72px] h-[96px] object-cover border border-[#cfd8dc] shadow hover:opacity-90 transition"
                                        fallbackClassName="w-[72px] h-[96px] flex items-center justify-center text-center p-1.5 border border-[#cfd8dc] shadow text-[9px] font-bold text-white rounded-sm leading-tight"
                                    />
                                </Link>
                                <div className="pt-1">
                                    {article.articleType && (
                                        <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded mb-2 text-white"
                                            style={{ background: themeColor }}>
                                            {article.articleType}
                                        </span>
                                    )}
                                    <Link href={`/journal/${article.journal.code}`}
                                        className="block text-[17px] font-semibold text-[#4d4d4d] hover:text-[#007398] leading-tight mb-1 transition-colors">
                                        {article.journal.fullName}
                                    </Link>
                                    <p className="text-[13px] text-[#007398]">
                                        {article.volume && `Volume ${article.volume}`}
                                        {article.issue && `, Issue ${article.issue}`}
                                        {pubDate && ` · ${pubDate}`}
                                    </p>
                                    {(article.journal.issn || article.journal.eIssn) && (
                                        <p className="text-[11px] text-[#4d4d4d] mt-0.5">
                                            {article.journal.issn && `ISSN: ${article.journal.issn}`}
                                            {article.journal.issn && article.journal.eIssn && " · "}
                                            {article.journal.eIssn && `E-ISSN: ${article.journal.eIssn}`}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Title */}
                            <h1 className="text-[30px] font-serif font-bold text-[#1b1c1d] leading-[1.3] mb-5">
                                {article.title}
                            </h1>

                            {/* Authors */}
                            <div className="mb-2">
                                <AuthorListWithModal authors={allAuthors} />
                            </div>

                            {/* Affiliations */}
                            {allAuthors.some(a => a.affiliation) && (
                                <details className="group mb-4">
                                    <summary className="flex items-center gap-1 text-[13px] text-[#007398] font-medium cursor-pointer hover:underline list-none">
                                        Show affiliations
                                        <svg className="w-4 h-4 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </summary>
                                    <div className="mt-3 text-[13px] text-[#4d4d4d] flex flex-col gap-1.5 pl-1">
                                        {allAuthors.map((author, idx) =>
                                            author.affiliation ? (
                                                <div key={idx} className="flex items-start gap-2">
                                                    <span className="font-semibold text-[#007398] shrink-0">{author.name}:</span>
                                                    <span>{author.affiliation}</span>
                                                </div>
                                            ) : null
                                        )}
                                    </div>
                                </details>
                            )}

                            {/* DOI row */}
                            {doiFull && (
                                <div className="flex items-center gap-4 text-[13px] py-3 border-t border-[#cfd8dc]">
                                    <div className="flex items-center gap-1.5 text-[#4d4d4d]">
                                        <Hash size={13} className="text-gray-400" />
                                        <span className="font-semibold">Article ID:</span>
                                        <span className="font-mono font-bold text-[#1b1c1d]">{articleCode}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[#4d4d4d]">
                                        <Globe size={13} className="text-gray-400" />
                                        <span className="font-semibold">DOI:</span>
                                        <a href={doiFull} target="_blank" rel="noopener noreferrer"
                                            className="text-[#007398] hover:underline break-all">
                                            {doiFull}
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* Cite / Share bar */}
                            <ArticleCiteShare
                                title={article.title}
                                authors={allAuthors.map(a => a.name)}
                                journal={article.journal.fullName}
                                volume={article.volume}
                                issue={article.issue}
                                year={pubYear || undefined}
                                doi={doiFull}
                                articleId={article.id}
                            />
                        </header>

                        {/* ── Tabbed Content: Abstract / Full Text / PDF ─────── */}
                        <ArticleContentViewer
                            articleId={article.id}
                            pdfUrl={pdfUrl}
                            fullText={(article as any).fullText || null}
                            abstract={article.abstract || ""}
                            keywords={article.keywords || []}
                        />

                        {/* ── Article Information Box ───────────────────────── */}
                        <section id="article-info" className="mt-12 border border-[#cfd8dc] rounded-lg overflow-hidden">
                            <div className="px-6 py-4 bg-[#f8f9fa] border-b border-[#cfd8dc]">
                                <h2 className="text-[16px] font-bold text-[#1b1c1d]">Article Information</h2>
                            </div>
                            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5 text-[14px]">
                                {subDate && (
                                    <div className="flex items-start gap-3">
                                        <Calendar size={15} className="text-gray-400 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-[11px] font-bold uppercase text-[#4d4d4d] tracking-wide">Received</p>
                                            <p className="text-[#1b1c1d] font-medium">{subDate}</p>
                                        </div>
                                    </div>
                                )}
                                {accDate && (
                                    <div className="flex items-start gap-3">
                                        <Calendar size={15} className="text-gray-400 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-[11px] font-bold uppercase text-[#4d4d4d] tracking-wide">Accepted</p>
                                            <p className="text-[#1b1c1d] font-medium">{accDate}</p>
                                        </div>
                                    </div>
                                )}
                                {pubDate && (
                                    <div className="flex items-start gap-3">
                                        <Calendar size={15} className="text-gray-400 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-[11px] font-bold uppercase text-[#4d4d4d] tracking-wide">Published</p>
                                            <p className="text-[#1b1c1d] font-medium">{pubDate}</p>
                                        </div>
                                    </div>
                                )}
                                {doiFull && (
                                    <div className="flex items-start gap-3">
                                        <Globe size={15} className="text-gray-400 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-[11px] font-bold uppercase text-[#4d4d4d] tracking-wide">DOI</p>
                                            <a href={doiFull} target="_blank" rel="noopener noreferrer"
                                                className="text-[#007398] hover:underline break-all text-[13px]">
                                                {doiFull}
                                            </a>
                                        </div>
                                    </div>
                                )}
                                {article.journal.issn && (
                                    <div className="flex items-start gap-3">
                                        <BookOpen size={15} className="text-gray-400 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-[11px] font-bold uppercase text-[#4d4d4d] tracking-wide">ISSN</p>
                                            <p className="text-[#1b1c1d] font-medium">{article.journal.issn}</p>
                                        </div>
                                    </div>
                                )}
                                {article.journal.eIssn && (
                                    <div className="flex items-start gap-3">
                                        <BookOpen size={15} className="text-gray-400 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-[11px] font-bold uppercase text-[#4d4d4d] tracking-wide">E-ISSN</p>
                                            <p className="text-[#1b1c1d] font-medium">{article.journal.eIssn}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-start gap-3">
                                    <FileText size={15} className="text-gray-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-[11px] font-bold uppercase text-[#4d4d4d] tracking-wide">Article Type</p>
                                        <p className="text-[#1b1c1d] font-medium">{article.articleType || "Research Article"}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Globe size={15} className="text-gray-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-[11px] font-bold uppercase text-[#4d4d4d] tracking-wide">Open Access</p>
                                        <p className="text-[#1b1c1d] font-medium">{article.isOpenAccess ? "Yes – Open Access" : "Restricted"}</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                    </div>
                </main>

                {/* ── RIGHT SIDEBAR ────────────────────────────────────────────── */}
                <aside className="hidden xl:block w-[300px] shrink-0 border-l border-[#cfd8dc] sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto pt-8 px-5 pb-20">

                    {/* Download / Access buttons */}
                    {pdfUrl && (
                        <div className="mb-8">
                            <h4 className="text-[12px] font-bold text-[#4d4d4d] uppercase tracking-widest mb-3">Access</h4>
                            <a href={`/api/articles/${article.id}/track-download`} target="_blank" rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[#007398] text-white text-[14px] font-bold rounded hover:bg-[#005f7c] transition mb-2">
                                <Download size={16} /> Download PDF
                            </a>
                            <a href={`/api/articles/${article.id}/track-download`} target="_blank" rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 border border-[#007398] text-[#007398] text-[14px] font-semibold rounded hover:bg-[#f0f7fa] transition">
                                <FileText size={16} /> View PDF
                            </a>
                        </div>
                    )}

                    {/* Article Metrics */}
                    <div id="metrics" className="mb-8 border border-[#cfd8dc] rounded-lg overflow-hidden">
                        <div className="px-4 py-3 bg-[#f8f9fa] border-b border-[#cfd8dc] flex items-center gap-2">
                            <BarChart2 size={14} className="text-[#4d4d4d]" />
                            <h4 className="text-[12px] font-bold text-[#4d4d4d] uppercase tracking-wider">Article Metrics</h4>
                        </div>
                        <div className="px-4 py-4 flex flex-col gap-3">
                            <div className="flex items-center justify-between text-[13px]">
                                <span className="text-[#4d4d4d]">Views</span>
                                <span className="font-bold text-[#1b1c1d]">{article.viewCount ?? 0}</span>
                            </div>
                            <div className="flex items-center justify-between text-[13px]">
                                <span className="text-[#4d4d4d]">Downloads</span>
                                <span className="font-bold text-[#1b1c1d]">{article.downloadCount ?? 0}</span>
                            </div>
                            <div className="flex items-center justify-between text-[13px]">
                                <span className="text-[#4d4d4d]">Citations</span>
                                <span className="font-bold text-[#1b1c1d]">{article.citationCount ?? 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* Recommended articles */}
                    {recommendedArticles.length > 0 && (
                        <div>
                            <h4 className="text-[12px] font-bold text-[#4d4d4d] uppercase tracking-widest mb-4">Related Articles</h4>
                            <div className="flex flex-col gap-5">
                                {recommendedArticles.map((rec) => {
                                    let recAuthor = rec.author?.name || rec.coAuthors?.[0]?.name || "Unknown";
                                    if (recAuthor === 'The Mother Admin') {
                                        recAuthor = rec.coAuthors?.[0]?.name || "Unknown";
                                    }
                                    return (
                                        <Link key={rec.id} href={`/articles/${rec.id}/read`}
                                            className="group border-b border-[#cfd8dc] pb-5 last:border-0 block">
                                            <h5 className="text-[13px] text-[#007398] group-hover:underline font-medium leading-snug mb-1.5">
                                                {rec.title}
                                            </h5>
                                            <p className="text-[11px] text-[#4d4d4d]">
                                                {rec.volume && `Vol. ${rec.volume}`}
                                                {rec.issue && ` · Iss. ${rec.issue}`}
                                                {rec.publicationDate && ` · ${new Date(rec.publicationDate).getFullYear()}`}
                                            </p>
                                            <p className="text-[11px] text-[#4d4d4d] font-medium mt-0.5">{recAuthor}</p>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </aside>
            </div>

            {/* ── Footer ────────────────────────────────────────────────────── */}
            <footer className="mt-auto border-t-4 border-[#e8701a] py-6 px-8 bg-white">
                <div className="max-w-[1400px] mx-auto text-[12px] text-[#4d4d4d] flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 opacity-80">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/logo.png" alt="C5K" className="h-5 w-auto" />
                        <span className="font-bold">C5K Platform © {new Date().getFullYear()}</span>
                    </div>
                    <div className="flex items-center gap-5 flex-wrap justify-center">
                        <Link href="/about" className="hover:underline hover:text-[#007398]">About C5K</Link>
                        <Link href="/journals" className="hover:underline hover:text-[#007398]">Journals</Link>
                        <a href="#" className="hover:underline hover:text-[#007398]">Terms & Conditions</a>
                        <a href="#" className="hover:underline hover:text-[#007398]">Privacy Policy</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
