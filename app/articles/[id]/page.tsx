"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Card from "@/components/ui/Card";

interface Article {
  id: string;
  title: string;
  abstract: string;
  keywords: string[];
  fullText?: string;
  pdfUrl?: string;
  doi?: string;
  volume?: number;
  issue?: number;
  pages?: string;
  journal: {
    code: string;
    fullName: string;
  };
  authors: {
    name: string;
    affiliation?: string;
    orcid?: string;
  }[];
  correspondingAuthor?: string;
  publicationDate: string;
  received?: string;
  revised?: string;
  accepted?: string;
  published?: string;
  status: string;
  reviews?: {
    id: string;
    reviewer: {
      name: string;
    };
    decision: string;
    commentsToAuthor?: string;
  }[];
  views?: number;
  downloads?: number;
  citations?: number;
}

export default function ArticleDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchArticle = async () => {
      try {
        // 1. Try public API first (for published articles)
        let response = await fetch(`/api/articles/public/${id}`);

        // 2. If 404 (not published) and user has token, try protected API (author preview)
        if (response.status === 404) {
          const token = localStorage.getItem('token');
          if (token) {
            const protectedResponse = await fetch(`/api/articles/${id}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            // If protected fetch succeeds, use it
            if (protectedResponse.ok) {
              response = protectedResponse;
            }
          }
        }

        if (!response.ok) {
          if (response.status === 404) throw new Error("Article not found");
          if (response.status === 403) throw new Error("Access denied");
          throw new Error("Failed to load article");
        }

        const data = await response.json();
        const rawArticle = data.article;

        // 3. Normalize data structure
        // Public API returns 'authors' array, Protected API returns single 'author' object
        // We need to unify this for the UI
        const authors = rawArticle.authors
          ? rawArticle.authors
          : (rawArticle.author ? [{
            name: rawArticle.author.name,
            affiliation: rawArticle.author.affiliation || rawArticle.author.university || ''
          }] : []);

        const journal = rawArticle.journal.fullName
          ? rawArticle.journal
          : { code: rawArticle.journal.code, fullName: rawArticle.journal.name }; // Handle potential naming diffs if any

        const formattedArticle: Article = {
          ...rawArticle,
          authors: authors,
          journal: {
            code: rawArticle.journal.code,
            fullName: rawArticle.journal.fullName || rawArticle.journal.name || rawArticle.journal.code
          },
          publicationDate: rawArticle.publicationDate
            ? new Date(rawArticle.publicationDate).toISOString().split('T')[0]
            : 'Not yet published',
          received: rawArticle.createdAt
            ? new Date(rawArticle.createdAt).toISOString().split('T')[0]
            : undefined,
          accepted: rawArticle.acceptanceDate
            ? new Date(rawArticle.acceptanceDate).toISOString().split('T')[0]
            : undefined,
          published: rawArticle.publicationDate
            ? new Date(rawArticle.publicationDate).toISOString().split('T')[0]
            : undefined,
          status: rawArticle.status,
          reviews: rawArticle.reviews || [],
        };

        setArticle(formattedArticle);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading article...</div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center flex-col">
        <div className="text-xl text-red-600 mb-4">{error || "Article not found"}</div>
        <Link href="/articles" className="text-primary hover:underline">Back to Articles</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="text-sm text-gray-600 mb-4">
            <Link href="/" className="hover:text-primary">Home</Link>
            {" / "}
            <Link href="/articles" className="hover:text-primary">Articles</Link>
            {" / "}
            <span className="text-gray-900 line-clamp-1">{article.title}</span>
          </nav>
          <div className="mb-4">
            <span className="text-xs bg-primary text-white px-2 py-1 rounded">
              {article.journal.code}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{article.title}</h1>
          <div className="flex flex-wrap gap-4 text-gray-600 mb-4">
            <span>Published: {article.publicationDate}</span>
            {article.doi && <span>DOI: {article.doi}</span>}
            {article.volume && <span>Volume {article.volume}</span>}
            {article.issue && <span>Issue {article.issue}</span>}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Authors */}
            <Card className="mb-6">
              <h2 className="text-xl font-bold mb-4">Authors</h2>
              {article.authors.map((author, index) => (
                <div key={index} className="mb-3">
                  <p className="font-semibold">{author.name}</p>
                  {author.affiliation && <p className="text-sm text-gray-600">{author.affiliation}</p>}
                </div>
              ))}
            </Card>

            {/* Abstract */}
            <Card className="mb-6">
              <h2 className="text-xl font-bold mb-4">Abstract</h2>
              <p className="text-gray-700 leading-relaxed">{article.abstract}</p>
            </Card>

            {/* Reviewer Feedback - Only visible if Revision Requested */}
            {article.status === 'revision_requested' && article.reviews && article.reviews.length > 0 && (
              <Card className="mb-6 bg-orange-50 border-orange-200">
                <h2 className="text-xl font-bold mb-4 text-orange-900">Reviewer Feedback</h2>
                <div className="space-y-4">
                  {article.reviews.map((review) => (
                    <div key={review.id} className="bg-white p-4 rounded border border-orange-100 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900">{review.reviewer?.name || "Anonymous Reviewer"}</span>
                        <span className={`text-xs px-2 py-1 rounded font-medium ${review.decision === 'accept' ? 'bg-green-100 text-green-700' :
                          review.decision === 'reject' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                          {review.decision ? review.decision.replace('_', ' ').toUpperCase() : 'PENDING'}
                        </span>
                      </div>
                      {review.commentsToAuthor && (
                        <div className="text-gray-800 text-sm whitespace-pre-wrap">
                          {review.commentsToAuthor}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-orange-200">
                  <p className="text-sm text-orange-800 mb-3">
                    Please address the feedback above and resubmit your article.
                  </p>
                  <Link
                    href={`/submit?resubmit=${article.id}`}
                    className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-medium px-4 py-2 rounded transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Resubmit Article
                  </Link>
                </div>
              </Card>
            )}

            {/* Keywords */}
            <Card className="mb-6">
              <h2 className="text-xl font-bold mb-4">Keywords</h2>
              <div className="flex flex-wrap gap-2">
                {article.keywords.map((keyword) => (
                  <span key={keyword} className="bg-gray-200 text-gray-700 px-3 py-1 rounded">
                    {keyword}
                  </span>
                ))}
              </div>
            </Card>

            {/* Full Text (if available) or PDF Link */}
            {article.pdfUrl ? (
              <Card className="mb-6">
                <h2 className="text-xl font-bold mb-4">Full Text</h2>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">📄</span>
                    <div>
                      <p className="font-bold">Full Article PDF</p>
                      <p className="text-sm text-gray-600">Download to read full content</p>
                    </div>
                  </div>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      const token = localStorage.getItem('token');
                      if (!token) {
                        // Redirect to login
                        window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
                        return;
                      }
                      const path = article.pdfUrl?.replace(/^\/uploads\//, '');
                      window.open(`/api/files/download/${path}?token=${token}`, '_blank');
                    }}
                    className="btn-primary"
                  >
                    View PDF
                  </a>
                </div>
              </Card>
            ) : article.fullText ? (
              <Card className="mb-6">
                <h2 className="text-xl font-bold mb-4">Full Text</h2>
                <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                  {article.fullText}
                </div>
              </Card>
            ) : null}

            {/* Timeline */}
            <Card>
              <h2 className="text-xl font-bold mb-4">Article Timeline</h2>
              <div className="space-y-2 text-sm">
                {article.received && (
                  <div className="flex justify-between">
                    <span className="font-semibold">Received:</span>
                    <span>{article.received}</span>
                  </div>
                )}
                {article.accepted && (
                  <div className="flex justify-between">
                    <span className="font-semibold">Accepted:</span>
                    <span>{article.accepted}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-semibold">Published:</span>
                  <span>{article.published || "Pending"}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            {/* Metrics */}
            <Card className="mb-6">
              <h3 className="text-lg font-bold mb-4">Article Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Downloads</span>
                  <span className="font-semibold">{article.downloads || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Citations</span>
                  <span className="font-semibold">{article.citations || 0}</span>
                </div>
              </div>
            </Card>

            {/* Download */}
            {article.pdfUrl && (
              <Card className="mb-6">
                <h3 className="text-lg font-bold mb-4">Download</h3>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    const token = localStorage.getItem('token');
                    if (!token) {
                      window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
                      return;
                    }
                    const path = article.pdfUrl?.replace(/^\/uploads\//, '');
                    window.open(`/api/files/download/${path}?token=${token}`, '_blank');
                  }}
                  className="w-full btn-primary mb-2 block text-center pt-2 pb-2"
                >Download PDF</a>
              </Card>
            )}

            {/* Cite */}
            <Card className="mb-6">
              <h3 className="text-lg font-bold mb-4">Cite This Article</h3>
              <select className="w-full border border-gray-300 rounded px-3 py-2 mb-2">
                <option>APA</option>
                <option>MLA</option>
                <option>BibTeX</option>
              </select>
              <button
                onClick={() => {
                  const citation = `${article.authors[0].name}. "${article.title}". ${article.journal.fullName}. ${article.publicationDate}.`;
                  navigator.clipboard.writeText(citation);
                  alert("Citation copied to clipboard!");
                }}
                className="w-full btn-secondary"
              >
                Copy Citation
              </button>
            </Card>

            {/* Share */}
            <Card className="mb-6">
              <h3 className="text-lg font-bold mb-4">Share</h3>
              <div className="flex gap-2">
                <button className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                  Twitter
                </button>
                <button className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
                  LinkedIn
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
