'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<any>({ articles: [], journals: [] });
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState('all');

  useEffect(() => {
    if (query && query.length >= 2) {
      performSearch();
    }
  }, [query, type]);

  const performSearch = async () => {
    if (query.trim().length < 2) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${type}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setResults(data.results || { articles: [], journals: [] });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      performSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-6">Search Results</h1>

        {/* Search Form */}
        <Card className="mb-8">
          <form onSubmit={handleSearch} className="flex gap-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles, journals..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button type="submit" className="btn-primary">
              Search
            </button>
          </form>

          {/* Filter Tabs */}
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => setType('all')}
              className={`px-4 py-2 rounded ${
                type === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setType('articles')}
              className={`px-4 py-2 rounded ${
                type === 'articles' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Articles
            </button>
            <button
              onClick={() => setType('journals')}
              className={`px-4 py-2 rounded ${
                type === 'journals' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Journals
            </button>
          </div>
        </Card>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-xl text-gray-600">Searching...</div>
          </div>
        ) : query.length < 2 ? (
          <Card>
            <div className="text-center py-12 text-gray-500">
              Enter at least 2 characters to search
            </div>
          </Card>
        ) : results.articles.length === 0 && results.journals.length === 0 ? (
          <Card>
            <div className="text-center py-12 text-gray-500">
              No results found for "{query}"
            </div>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Articles Results */}
            {results.articles.length > 0 && (type === 'all' || type === 'articles') && (
              <div>
                <h2 className="text-2xl font-bold mb-4">
                  Articles ({results.articles.length})
                </h2>
                <div className="space-y-4">
                  {results.articles.map((article: any) => (
                    <Card key={article.id}>
                      <Link href={`/articles/${article.id}`}>
                        <h3 className="text-xl font-bold text-primary hover:text-primary-dark mb-2">
                          {article.title}
                        </h3>
                      </Link>
                      <p className="text-sm text-gray-600 mb-2">
                        By {article.author} • {article.journalName} ({article.journal})
                      </p>
                      <p className="text-gray-700 mb-2 line-clamp-2">
                        {article.abstract}
                      </p>
                      {article.publishedAt && (
                        <p className="text-xs text-gray-500">
                          Published: {new Date(article.publishedAt).toLocaleDateString()}
                        </p>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Journals Results */}
            {results.journals.length > 0 && (type === 'all' || type === 'journals') && (
              <div>
                <h2 className="text-2xl font-bold mb-4">
                  Journals ({results.journals.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.journals.map((journal: any) => (
                    <Link key={journal.id} href={`/journals/${journal.code.toLowerCase()}`}>
                      <Card className="h-full">
                        <h3 className="text-lg font-bold text-primary mb-2">
                          {journal.fullName}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {journal.code}
                        </p>
                        {journal.description && (
                          <p className="text-sm text-gray-700 line-clamp-3">
                            {journal.description}
                          </p>
                        )}
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
