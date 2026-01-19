'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";

async function getArticles(params: URLSearchParams) {
  try {
    const queryString = params.toString();
    const res = await fetch(`/api/articles/public?${queryString}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error('Failed to fetch');
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching articles:', error);
    return { articles: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } };
  }
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [filters, setFilters] = useState({ journal: '', year: '', sortBy: 'recent' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArticles();
  }, [filters]);

  const loadArticles = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.journal) params.set('journal', filters.journal);
    if (filters.year) params.set('year', filters.year);
    params.set('sortBy', filters.sortBy);
    params.set('page', '1');

    const data = await getArticles(params);
    setArticles(data.articles || []);
    setPagination(data.pagination || { page: 1, limit: 10, total: 0, pages: 0 });
    setLoading(false);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-gray-600">Loading articles...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">Browse Articles</h1>
          <p className="text-xl text-gray-100">
            Explore our collection of peer-reviewed research articles
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <h2 className="text-lg font-bold mb-4">Filter Articles</h2>

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Journal</label>
                <select 
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  value={filters.journal}
                  onChange={(e) => handleFilterChange('journal', e.target.value)}
                >
                  <option value="">All Journals</option>
                  <option value="JITMB">JITMB</option>
                  <option value="JSAE">JSAE</option>
                  <option value="AMLID">AMLID</option>
                  <option value="OJBEM">OJBEM</option>
                  <option value="PRAIHI">PRAIHI</option>
                  <option value="JBVADA">JBVADA</option>
                  <option value="JAMSAI">JAMSAI</option>
                  <option value="AESI">AESI</option>
                  <option value="ILPROM">ILPROM</option>
                  <option value="TBFLI">TBFLI</option>
                  <option value="PMSRI">PMSRI</option>
                  <option value="DRSDR">DRSDR</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Year</label>
                <select 
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  value={filters.year}
                  onChange={(e) => handleFilterChange('year', e.target.value)}
                >
                  <option value="">All Years</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                  <option value="2021">2021</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Sort By</label>
                <select 
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                >
                  <option value="recent">Most Recent</option>
                  <option value="cited">Most Cited</option>
                  <option value="downloaded">Most Downloaded</option>
                </select>
              </div>
            </Card>
          </div>

          {/* Articles List */}
          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">Showing {pagination.total} articles</p>
            </div>

            <div className="space-y-6">
              {articles.length > 0 ? (
                articles.map((article) => (
                <Card key={article.id}>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="mb-2">
                        <span className="text-xs bg-primary text-white px-2 py-1 rounded">
                          {article.journal.code}
                        </span>
                      </div>
                      <Link href={`/articles/${article.id}`}>
                        <h2 className="text-xl font-bold text-primary hover:text-primary-dark mb-2">
                          {article.title}
                        </h2>
                      </Link>
                      <p className="text-sm text-gray-600 mb-2">
                        {article.authors.join(", ")}
                      </p>
                      <p className="text-gray-700 mb-3 line-clamp-2">
                        {article.abstract}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {article.keywords.map((keyword: string) => (
                          <span key={keyword} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                            {keyword}
                          </span>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <span>Published: {article.publicationDate}</span>
                        <span>DOI: {article.doi}</span>
                        <span>Citations: {article.citations}</span>
                        <span>Downloads: {article.downloads}</span>
                      </div>
                    </div>
                    <div className="flex sm:flex-col gap-2">
                      <Link href={`/articles/${article.id}`} className="btn-primary text-sm px-4 py-2 whitespace-nowrap">
                        Read More
                      </Link>
                      <button className="btn-secondary text-sm px-4 py-2 whitespace-nowrap">
                        Download PDF
                      </button>
                    </div>
                  </div>
                </Card>
                ))
              ) : (
                <Card>
                  <div className="text-center py-8 text-gray-500">
                    No articles found. Try adjusting your filters.
                  </div>
                </Card>
              )}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button 
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
                  disabled={pagination.page === 1}
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button 
                      key={pageNum}
                      className={`px-4 py-2 border rounded ${
                        pagination.page === pageNum
                          ? 'bg-primary text-white border-primary'
                          : 'border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button 
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
                  disabled={pagination.page === pagination.pages}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
