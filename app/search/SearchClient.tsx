'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Image from 'next/image';

const SEARCH_TYPES = [
    { id: 'all', label: 'All' },
    { id: 'articles', label: 'Articles' },
    { id: 'journals', label: 'Journals' },
    { id: 'blogs', label: 'Blogs' },
    { id: 'thesis', label: 'Thesis' },
    { id: 'books', label: 'Books' },
    { id: 'announcements', label: 'Announcements' },
    { id: 'conferences', label: 'Conferences' },
];

export default function SearchPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [results, setResults] = useState<any>({
        articles: [], journals: [], announcements: [], 
        blogs: [], thesis: [], books: [], conferences: []
    });
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState(searchParams.get('type') || 'all');

    useEffect(() => {
        if (query && query.length >= 2) {
            performSearch();
        }
    }, [query, activeTab]);

    const performSearch = async () => {
        if (query.trim().length < 2) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&scope=${activeTab}`);
            if (!res.ok) throw new Error('Search failed');
            const data = await res.json();
            setResults(data.results || {});
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim().length >= 2) {
            router.push(`/search?q=${encodeURIComponent(query)}&type=${activeTab}`);
            performSearch();
        }
    };

    const hasResults = Object.values(results).some((arr: any) => arr && arr.length > 0);

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-white border-b sticky top-16 md:top-20 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <form onSubmit={handleSearch} className="max-w-3xl flex gap-3">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search all academic resources..."
                                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all shadow-sm"
                            />
                        </div>
                        <button type="submit" className="px-8 py-3 bg-primary text-white rounded-full font-bold hover:bg-primary-dark transition-all shadow-md active:scale-95">
                            Search
                        </button>
                    </form>

                    {/* Filter Tabs */}
                    <div className="flex gap-2 mt-6 overflow-x-auto pb-2 no-scrollbar">
                        {SEARCH_TYPES.map((type) => (
                            <button
                                key={type.id}
                                onClick={() => setActiveTab(type.id)}
                                className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                                    activeTab === type.id 
                                    ? 'bg-primary text-white shadow-md' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                        <p className="mt-4 text-gray-500 font-medium italic">Searching library...</p>
                    </div>
                ) : !query || query.length < 2 ? (
                    <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
                        <div className="text-5xl mb-4">🔍</div>
                        <h2 className="text-xl font-bold text-gray-900">Explore our repository</h2>
                        <p className="text-gray-500 max-w-md mx-auto mt-2">Enter keywords, DOI, or ISBN to search across journals, articles, books and more.</p>
                    </div>
                ) : !hasResults ? (
                    <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
                        <div className="text-5xl mb-4">🏜️</div>
                        <h2 className="text-xl font-bold text-gray-900">No matches found</h2>
                        <p className="text-gray-500 max-w-md mx-auto mt-2">We couldn't find anything matching "{query}". Try broadening your search terms or checking another category.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Results Column */}
                        <div className="lg:col-span-8 space-y-10">
                            
                            {/* Articles */}
                            {(activeTab === 'all' || activeTab === 'articles') && results.articles?.length > 0 && (
                                <section>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                        <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
                                        Articles
                                    </h2>
                                    <div className="space-y-4">
                                        {results.articles.map((article: any) => (
                                            <Card key={article.id} className="p-6">
                                                <Link href={`/articles/${article.id}`}>
                                                    <h3 className="text-xl font-bold text-primary hover:underline leading-tight mb-2">
                                                        {article.title}
                                                    </h3>
                                                </Link>
                                                <p className="text-sm text-gray-500 mb-3 font-medium">
                                                    {article.author} • <span className="text-blue-600 italic">{article.journal}</span> {article.publishedAt && `• ${new Date(article.publishedAt).getFullYear()}`}
                                                </p>
                                                <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                                                    {article.abstract}
                                                </p>
                                                {article.doi && (
                                                    <div className="mt-3 inline-block px-2 py-1 bg-gray-100 rounded text-[10px] font-mono text-gray-500">
                                                        DOI: {article.doi}
                                                    </div>
                                                )}
                                            </Card>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Books */}
                            {(activeTab === 'all' || activeTab === 'books') && results.books?.length > 0 && (
                                <section>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                        <span className="w-2 h-8 bg-purple-600 rounded-full"></span>
                                        Academic Books
                                    </h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {results.books.map((book: any) => (
                                            <Card key={book.id} className="p-4 flex gap-4">
                                                {book.coverImageUrl && (
                                                    <div className="w-24 h-32 relative flex-shrink-0 rounded shadow-sm overflow-hidden">
                                                        <Image src={book.coverImageUrl} alt={book.title} fill className="object-cover" />
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <Link href={`/books/${book.id}`}>
                                                        <h3 className="font-bold text-gray-900 group-hover:text-primary leading-tight line-clamp-2">
                                                            {book.title}
                                                        </h3>
                                                    </Link>
                                                    <p className="text-xs text-gray-500 mt-1">{book.authors?.join(', ')}</p>
                                                    <div className="mt-2 flex items-center justify-between">
                                                        <span className="text-sm font-bold text-green-600">{book.price || 'Free'}</span>
                                                        <span className="text-[10px] text-gray-400">ISBN: {book.isbn}</span>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Thesis / Thesis */}
                            {(activeTab === 'all' || activeTab === 'thesis') && results.thesis?.length > 0 && (
                                <section>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                        <span className="w-2 h-8 bg-orange-600 rounded-full"></span>
                                        Thesis & Dissertations
                                    </h2>
                                    <div className="space-y-4">
                                        {results.thesis.map((thesis: any) => (
                                            <Card key={thesis.id} className="p-6 border-l-4 border-orange-500">
                                                <Link href={`/dissertations/${thesis.id}`}>
                                                    <h3 className="font-bold text-gray-900 hover:text-primary leading-tight text-lg mb-1">
                                                        {thesis.title}
                                                    </h3>
                                                </Link>
                                                <p className="text-sm font-medium text-gray-600 italic">
                                                    {thesis.author} • {thesis.university} ({thesis.degreeType})
                                                </p>
                                                <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                                                    {thesis.abstract}
                                                </p>
                                            </Card>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Blogs */}
                            {(activeTab === 'all' || activeTab === 'blogs') && results.blogs?.length > 0 && (
                                <section>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                        <span className="w-2 h-8 bg-green-600 rounded-full"></span>
                                        Research Blog
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {results.blogs.map((blog: any) => (
                                            <Card key={blog.id} className="overflow-hidden p-0 flex flex-col h-full">
                                                {blog.featuredImageUrl && (
                                                    <div className="w-full h-40 relative">
                                                        <Image src={blog.featuredImageUrl} alt={blog.title} fill className="object-cover" />
                                                    </div>
                                                )}
                                                <div className="p-5 flex-1 flex flex-col">
                                                    <Link href={`/blogs/${blog.slug}`}>
                                                        <h3 className="font-bold text-gray-900 hover:text-primary line-clamp-2 mb-2">
                                                            {blog.title}
                                                        </h3>
                                                    </Link>
                                                    <p className="text-xs text-gray-500 mb-3">{blog.author} • {blog.publishedAt && new Date(blog.publishedAt).toLocaleDateString()}</p>
                                                    <p className="text-sm text-gray-600 line-clamp-3 mb-4">{blog.excerpt}</p>
                                                    <div className="mt-auto">
                                                        <Link href={`/blogs/${blog.slug}`} className="text-xs font-bold text-primary flex items-center gap-1 group">
                                                            Read Full Blog <span className="group-hover:translate-x-1 transition-transform">→</span>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Conferences */}
                            {(activeTab === 'all' || activeTab === 'conferences') && results.conferences?.length > 0 && (
                                <section>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                        <span className="w-2 h-8 bg-red-600 rounded-full"></span>
                                        Academic Conferences
                                    </h2>
                                    <div className="space-y-4">
                                        {results.conferences.map((conf: any) => (
                                            <Card key={conf.id} className="p-0 overflow-hidden flex flex-col sm:flex-row h-full">
                                                {conf.bannerImageUrl && (
                                                    <div className="sm:w-48 h-40 sm:h-auto relative">
                                                        <Image src={conf.bannerImageUrl} alt={conf.title} fill className="object-cover" />
                                                    </div>
                                                )}
                                                <div className="p-6 flex-1">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h3 className="font-bold text-gray-900 group-hover:text-primary text-xl">
                                                            {conf.acronym ? `${conf.acronym}: ${conf.title}` : conf.title}
                                                        </h3>
                                                        <span className="px-2 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded uppercase tracking-wider">Conference</span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 flex items-center gap-4">
                                                        <span>📅 {new Date(conf.startDate).toLocaleDateString()}</span>
                                                        <span>📍 {conf.venue ? `${conf.venue}, ${conf.city}` : conf.city}</span>
                                                    </p>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </section>
                            )}

                             {/* Announcements */}
                             {(activeTab === 'all' || activeTab === 'announcements') && results.announcements?.length > 0 && (
                                <section>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                        <span className="w-2 h-8 bg-yellow-500 rounded-full"></span>
                                        Latest Announcements
                                    </h2>
                                    <div className="space-y-3">
                                        {results.announcements.map((ann: any) => (
                                            <Card key={ann.id} className="p-4 bg-yellow-50/50 border-yellow-100">
                                                <div className="flex gap-4">
                                                    {ann.thumbnailUrl && (
                                                        <div className="w-16 h-16 relative flex-shrink-0 rounded-lg overflow-hidden border">
                                                            <Image src={ann.thumbnailUrl} alt="" fill className="object-cover" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1">
                                                        <Link href={`/announcements/${ann.id}`}>
                                                            <h3 className="font-bold text-gray-900 hover:text-primary leading-snug">
                                                                {ann.title}
                                                            </h3>
                                                        </Link>
                                                        <p className="text-xs text-gray-500 mt-1">{ann.publishedAt && new Date(ann.publishedAt).toLocaleDateString()} • {ann.category || 'General'}</p>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* Sidebar Column */}
                        <div className="lg:col-span-4 space-y-8">
                            
                            {/* Journals Highlights (Smaller format) */}
                            {(activeTab === 'all' || activeTab === 'journals') && results.journals?.length > 0 && (
                                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center justify-between">
                                        Journals
                                        <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">{results.journals.length}</span>
                                    </h2>
                                    <div className="space-y-6">
                                        {results.journals.map((journal: any) => (
                                            <div key={journal.id} className="group border-b border-gray-50 pb-6 last:border-0 last:pb-0">
                                                <Link href={`/journals/${journal.code.toLowerCase()}`}>
                                                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block mb-1">{journal.code}</span>
                                                    <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors leading-snug">
                                                        {journal.fullName}
                                                    </h3>
                                                </Link>
                                                {journal.description && (
                                                    <p className="text-xs text-gray-500 mt-2 line-clamp-2 italic">
                                                        {journal.description}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <Link href="/journals" className="mt-8 block w-full py-3 bg-gray-50 text-gray-600 text-center rounded-xl text-sm font-bold hover:bg-gray-100 transition-colors">
                                        View All Journals
                                    </Link>
                                </div>
                            )}

                            {/* Help Section */}
                            <div className="bg-gradient-to-br from-primary to-blue-700 rounded-3xl p-8 text-white shadow-xl">
                                <h3 className="text-lg font-bold mb-4">Need help?</h3>
                                <p className="text-blue-100 text-sm leading-relaxed mb-6">
                                    Can't find a specific document or publication? Our editorial team can help you locate resources or answer questions about submissions.
                                </p>
                                <Link href="/contact" className="block w-full py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-center text-sm font-bold transition-all">
                                    Contact Support
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
