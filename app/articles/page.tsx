'use client';

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const JOURNALS = [
  { code: "aesi", name: "Advances in Engineering and Science Informatics" },
  { code: "amlid", name: "Advances in Machine Learning, IoT and Data Security" },
  { code: "demographic-research-and-social-development-reviews", name: "Demographic Research and Social Development Reviews" },
  { code: "ilprom", name: "International Law Policy Review Organizational Management" },
  { code: "jamsai", name: "Journal of Advances in Medical Sciences and Artificial Intelligence" },
  { code: "jbvada", name: "Journal of Business Venturing, AI and Data Analytics" },
  { code: "jitmb", name: "Journal of Information Technology Management and Business Horizons" },
  { code: "jsae", name: "Journal of Sustainable Agricultural Economics" },
  { code: "ojbem", name: "Open Journal of Business Entrepreneurship and Marketing" },
  { code: "pmsri", name: "Progress on Multidisciplinary Scientific Research and Innovation" },
  { code: "praihi", name: "Periodic Reviews on Artificial Intelligence in Health Informatics" },
  { code: "tbfli", name: "Transactions on Banking, Finance, and Leadership Informatics" },
];

const YEARS = ["2025", "2024", "2023", "2022", "2021", "2020"];

const ARTICLE_TYPES = [
  "Research Article",
  "Review Article",
  "Case Study",
  "Short Communication",
  "Editorial",
  "Letter",
];

async function fetchArticles(params: URLSearchParams) {
  try {
    const res = await fetch(`/api/articles/public?${params.toString()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed');
    return await res.json();
  } catch {
    return { articles: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } };
  }
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);

  // Hero search (submitted on Enter/button click)
  const [heroInput, setHeroInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  // Sidebar filters
  const [journal, setJournal] = useState('');
  const [year, setYear] = useState('');
  const [articleType, setArticleType] = useState('');
  const [openAccess, setOpenAccess] = useState(false);
  const [sortBy, setSortBy] = useState('recent');

  const [currentPage, setCurrentPage] = useState(1);

  const load = useCallback(async (page: number) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (appliedSearch) params.set('search', appliedSearch);
    if (journal) params.set('journal', journal);
    if (year) params.set('year', year);
    if (articleType) params.set('articleType', articleType);
    if (openAccess) params.set('openAccess', 'true');
    params.set('sortBy', sortBy);
    params.set('page', String(page));
    const data = await fetchArticles(params);
    setArticles(data.articles || []);
    setPagination(data.pagination || { page, limit: 10, total: 0, pages: 0 });
    setLoading(false);
  }, [appliedSearch, journal, year, articleType, openAccess, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [appliedSearch, journal, year, articleType, openAccess, sortBy]);

  useEffect(() => {
    load(currentPage);
  }, [load, currentPage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(heroInput.trim());
  };

  const clearFilters = () => {
    setHeroInput('');
    setAppliedSearch('');
    setJournal('');
    setYear('');
    setArticleType('');
    setOpenAccess(false);
    setSortBy('recent');
  };

  const hasFilters = appliedSearch || journal || year || articleType || openAccess || sortBy !== 'recent';

  const selectCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero with search */}
      <div className="bg-primary text-white py-14 relative overflow-hidden">
        {/* decorative wave */}
        <div className="absolute bottom-0 left-0 right-0 h-12 opacity-10">
          <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path d="M0 48L480 0L960 48L1440 0V48H0Z" fill="white"/>
          </svg>
        </div>

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">Browse Articles</h1>
          <p className="text-lg text-blue-100 mb-8">
            Explore our collection of peer-reviewed research articles
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl mx-auto">
            <div className="flex-1 relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={heroInput}
                onChange={e => setHeroInput(e.target.value)}
                placeholder="Search by title, abstract, or keyword..."
                className="w-full pl-12 pr-4 py-3.5 rounded-xl text-gray-900 text-[15px] focus:outline-none focus:ring-2 focus:ring-white/60 shadow-lg"
              />
            </div>
            <button
              type="submit"
              className="px-7 py-3.5 bg-white text-primary font-bold rounded-xl hover:bg-blue-50 transition shadow-lg whitespace-nowrap"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-gray-900">Filter Articles</h2>
                {hasFilters && (
                  <button onClick={clearFilters} className="text-xs text-primary hover:underline font-medium">
                    Clear all
                  </button>
                )}
              </div>

              {/* Journal */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Journal</label>
                <select className={selectCls} value={journal} onChange={e => setJournal(e.target.value)}>
                  <option value="">All Journals</option>
                  {JOURNALS.map(j => (
                    <option key={j.code} value={j.code}>{j.code.toUpperCase()}</option>
                  ))}
                </select>
                {journal && (
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {JOURNALS.find(j => j.code === journal)?.name}
                  </p>
                )}
              </div>

              {/* Year */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Year</label>
                <select className={selectCls} value={year} onChange={e => setYear(e.target.value)}>
                  <option value="">All Years</option>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              {/* Article Type */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Article Type</label>
                <select className={selectCls} value={articleType} onChange={e => setArticleType(e.target.value)}>
                  <option value="">All Types</option>
                  {ARTICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Sort By */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sort By</label>
                <select className={selectCls} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="recent">Most Recent</option>
                  <option value="oldest">Oldest First</option>
                  <option value="cited">Most Cited</option>
                  <option value="downloaded">Most Downloaded</option>
                </select>
              </div>

              {/* Open Access */}
              <div className="border-t border-gray-100 pt-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={openAccess}
                      onChange={e => setOpenAccess(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-primary transition-colors"></div>
                    <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5"></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Open Access Only</span>
                </label>
              </div>
            </div>
          </div>

          {/* Articles List */}
          <div className="lg:col-span-3">
            {/* Results header */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-gray-600">
                {loading ? 'Loading...' : (
                  <>
                    Showing <span className="font-bold text-gray-900">{pagination.total}</span> article{pagination.total !== 1 ? 's' : ''}
                    {appliedSearch && <> for <span className="font-bold text-primary">"{appliedSearch}"</span></>}
                  </>
                )}
              </p>
              {hasFilters && !loading && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                  Filters active
                </span>
              )}
            </div>

            <div className="space-y-4">
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                        <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <div className="h-9 bg-gray-200 rounded w-24"></div>
                        <div className="h-9 bg-gray-200 rounded w-28"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : articles.length > 0 ? (
                articles.map((article) => (
                  <div key={article.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-xs font-bold bg-primary text-white px-2 py-0.5 rounded">
                            {article.journal.code.toUpperCase()}
                          </span>
                          {article.isOpenAccess && (
                            <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded">
                              Open Access
                            </span>
                          )}
                          {article.articleType && article.articleType !== 'Research Article' && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              {article.articleType}
                            </span>
                          )}
                        </div>

                        <Link href={`/articles/${article.id}/read`}>
                          <h2 className="text-[17px] font-bold text-primary hover:text-blue-700 mb-1.5 leading-snug transition-colors">
                            {article.title}
                          </h2>
                        </Link>

                        {article.authors.length > 0 && (
                          <p className="text-sm text-gray-600 mb-2 font-medium">
                            By {article.authors.join(", ")}
                          </p>
                        )}

                        <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                          {article.abstract}
                        </p>

                        {article.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {article.keywords.slice(0, 6).map((kw: string, i: number) => (
                              <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">
                                {kw}
                              </span>
                            ))}
                            {article.keywords.length > 6 && (
                              <span className="text-xs text-gray-400">+{article.keywords.length - 6} more</span>
                            )}
                          </div>
                        )}

                        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                          {article.publicationDate && (
                            <span>Published: <span className="text-gray-700">{article.publicationDate}</span></span>
                          )}
                          {article.doi && (
                            <span className="truncate max-w-[200px]">DOI: <span className="text-gray-700">{article.doi.replace('https://doi.org/', '')}</span></span>
                          )}
                          <span>Citations: <span className="text-gray-700">{article.citations}</span></span>
                          <span>Downloads: <span className="text-gray-700">{article.downloads}</span></span>
                        </div>
                      </div>

                      <div className="flex sm:flex-col gap-2 shrink-0">
                        <Link
                          href={`/articles/${article.id}/read`}
                          className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition whitespace-nowrap"
                        >
                          Read More
                        </Link>
                        {article.pdfUrl && (
                          <a
                            href={article.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center px-4 py-2 border border-primary text-primary text-sm font-semibold rounded-lg hover:bg-primary/5 transition whitespace-nowrap"
                          >
                            Download PDF
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-xl border border-dashed border-gray-300 p-16 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500 font-medium">No articles found</p>
                  <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
                  {hasFilters && (
                    <button onClick={clearFilters} className="mt-4 text-sm text-primary hover:underline font-semibold">
                      Clear all filters
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && !loading && (
              <div className="flex justify-center items-center gap-1.5 mt-8">
                <button
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={currentPage === 1}
                  onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                >
                  ← Prev
                </button>
                {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => {
                  let p = i + 1;
                  if (pagination.pages > 7) {
                    const start = Math.max(1, currentPage - 3);
                    p = start + i;
                    if (p > pagination.pages) return null;
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className={`px-3 py-2 border rounded-lg text-sm ${currentPage === p ? 'bg-primary text-white border-primary' : 'border-gray-300 hover:bg-gray-50'}`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={currentPage === pagination.pages}
                  onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
