import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { User, Mail, GraduationCap, Building2, BookOpen, Download, BarChart2 } from "lucide-react";
import SafeJournalCover from "@/components/journals/SafeJournalCover";
 
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const user = await prisma.user.findUnique({
        where: { id },
        select: { name: true, university: true },
    });
    return {
        title: `${user?.name || "Author Profile"} - C5K Platform`,
        description: `View publications and academic profile of ${user?.name} at ${user?.university || "C5K"}.`,
    };
}

export default async function AuthorProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const author = await prisma.user.findUnique({
        where: { id },
        include: {
            articles: {
                where: { status: "published" },
                include: { journal: true, coAuthors: { orderBy: { order: "asc" } } }
            },
            coAuthors: {
                where: { article: { status: "published" } },
                include: {
                    article: {
                        include: { journal: true, author: true, coAuthors: { orderBy: { order: "asc" } } }
                    }
                }
            }
        }
    });

    if (!author) {
        return notFound();
    }

    // Merge articles from main author and co-author roles
    const mainArticles = author.articles.map(a => ({ ...a, role: "Main Author" }));
    const coArticles = author.coAuthors.map(ca => ({ ...ca.article, role: "Co-Author" }));
    
    // De-duplicate and sort by publication date
    const allArticlesMap = new Map();
    [...mainArticles, ...coArticles].forEach(art => {
        allArticlesMap.set(art.id, art);
    });
    
    const sortedArticles = Array.from(allArticlesMap.values()).sort((a, b) => {
        const dateA = a.publicationDate ? new Date(a.publicationDate).getTime() : 0;
        const dateB = b.publicationDate ? new Date(b.publicationDate).getTime() : 0;
        return dateB - dateA;
    });

    const totalViews = sortedArticles.reduce((acc, art) => acc + (art.viewCount || 0), 0);
    const totalDownloads = sortedArticles.reduce((acc, art) => acc + (art.downloadCount || 0), 0);

    return (
        <div className="min-h-screen bg-[#f8f9fa]">
            {/* Header / Banner Area */}
            <div className="bg-[#007398] text-white py-12 shadow-inner">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center border-4 border-white/20 shadow-xl overflow-hidden shrink-0">
                            {author.profileImageUrl ? (
                                <img src={author.profileImageUrl} alt={author.name || ""} className="w-full h-full object-cover" />
                            ) : (
                                <User size={64} className="text-white/50" />
                            )}
                        </div>
                        <div className="text-center md:text-left">
                            <h1 className="text-4xl font-serif font-bold mb-2">{author.name}</h1>
                            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-blue-50 text-sm">
                                {author.university && (
                                    <div className="flex items-center gap-1.5">
                                        <GraduationCap size={16} />
                                        <span>{author.university}</span>
                                    </div>
                                )}
                                {author.affiliation && author.affiliation !== author.university && (
                                    <div className="flex items-center gap-1.5">
                                        <Building2 size={16} />
                                        <span>{author.affiliation}</span>
                                    </div>
                                )}
                                {author.email && (
                                    <div className="flex items-center gap-1.5">
                                        <Mail size={16} />
                                        <span className="opacity-80">{author.email}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-6 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    
                    {/* Left Sidebar: Statistics */}
                    <aside className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2">Author Metrics</h2>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <BookOpen size={18} className="text-[#007398]" />
                                        <span className="text-sm font-medium">Articles</span>
                                    </div>
                                    <span className="text-lg font-bold text-gray-900">{sortedArticles.length}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <BarChart2 size={18} className="text-[#007398]" />
                                        <span className="text-sm font-medium">Total Views</span>
                                    </div>
                                    <span className="text-lg font-bold text-gray-900">{totalViews}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <Download size={18} className="text-[#007398]" />
                                        <span className="text-sm font-medium">Total Downloads</span>
                                    </div>
                                    <span className="text-lg font-bold text-gray-900">{totalDownloads}</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 overflow-hidden">
                            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">Top Journals</h2>
                            <div className="flex flex-wrap gap-2">
                                {Array.from(new Set(sortedArticles.map(a => a.journal.code))).map(code => (
                                    <span key={code} className="px-2.5 py-1 bg-gray-50 text-gray-600 border border-gray-200 rounded text-[11px] font-bold uppercase tracking-wider">
                                        {code}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </aside>

                    {/* Right Side: Publications List */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-2xl font-serif font-bold text-gray-900">Publications</h2>
                            <span className="text-sm text-gray-500 font-medium">{sortedArticles.length} results</span>
                        </div>

                        <div className="space-y-4">
                            {sortedArticles.map((article) => {
                                const pubDate = article.publicationDate
                                    ? new Date(article.publicationDate).toLocaleDateString("en-GB", { month: "short", year: "numeric" })
                                    : "N/A";
                                
                                return (
                                    <div key={article.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-5 flex gap-5 group">
                                        {/* Mini Cover */}
                                        <div className="hidden sm:block shrink-0">
                                            <SafeJournalCover 
                                                code={article.journal.code}
                                                coverImageUrl={article.journal.coverImageUrl}
                                                themeColor={article.journal.themeColor || "#007398"}
                                                className="w-16 h-20 object-cover border border-gray-100 shadow-sm rounded-sm"
                                                fallbackClassName="w-16 h-20 flex items-center justify-center text-center p-1 border border-gray-100 shadow-sm text-[8px] font-bold text-white rounded-sm"
                                            />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-white px-2 py-0.5 rounded" style={{ backgroundColor: article.journal.themeColor || "#007398" }}>
                                                    {article.journal.code}
                                                </span>
                                                <span className="text-[11px] text-gray-400 font-medium">
                                                    {pubDate} • {article.articleType || "Research Article"}
                                                </span>
                                            </div>

                                            <Link href={`/articles/${article.id}/read`}>
                                                <h3 className="text-[17px] font-bold text-gray-900 group-hover:text-[#007398] transition-colors leading-snug mb-2">
                                                    {article.title}
                                                </h3>
                                            </Link>

                                            <div className="text-[13px] text-gray-600 mb-3 line-clamp-2 leading-relaxed italic opacity-80">
                                                {article.abstract?.substring(0, 180)}...
                                            </div>

                                            <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                                <div className="flex items-center gap-4 text-[11px] text-gray-500 font-medium">
                                                    <span className="flex items-center gap-1.5">
                                                        <BarChart2 size={12} className="text-gray-400" />
                                                        {article.viewCount || 0} Views
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <Download size={12} className="text-gray-400" />
                                                        {article.downloadCount || 0} Downloads
                                                    </span>
                                                </div>
                                                <Link 
                                                    href={`/articles/${article.id}/read`}
                                                    className="text-[12px] font-bold text-[#007398] hover:underline flex items-center gap-1"
                                                >
                                                    View Full Article
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {sortedArticles.length === 0 && (
                                <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
                                    No publications found for this author.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
