"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";

interface Article {
  id: string;
  title: string;
  abstract: string;
  keywords: string[];
  status: string;
  articleType: string;
  submissionDate: string;
  pdfUrl: string | null;
  journal: {
    fullName: string;
    code: string;
    issn: string;
  };
  author: {
    name: string;
    email: string;
  };
  editorComments: string | null;
  rejectionReason: string | null;
}

export default function SubmissionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login?redirect=/dashboard/submissions');
          return;
        }

        const response = await fetch(`/api/articles/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('token');
            router.push('/login?redirect=/dashboard/submissions');
            return;
          }
          if (response.status === 404) {
            setError('Submission not found');
            return;
          }
          throw new Error('Failed to fetch submission details');
        }

        const data = await response.json();
        setArticle(data.article);
      } catch (err: any) {
        setError(err.message || 'Failed to load submission details');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchSubmission();
    }
  }, [id, router]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase().replace(' ', '_')) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'under_review':
      case 'in_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'waiting_for_editor':
        return 'bg-purple-100 text-purple-800';
      case 'accepted':
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'revision_requested':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-bold text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error || 'Submission not found'}</p>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <Link
              href="/dashboard/submissions"
              className="text-primary hover:text-primary/80 font-semibold"
            >
              ← Back to Submissions
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/dashboard/submissions"
            className="text-primary hover:text-primary/80 font-semibold flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Submissions
          </Link>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-primary mb-2">{article.title}</h1>
              <p className="text-gray-600">Submission ID: {article.id}</p>
            </div>
            <span className={`px-4 py-2 text-sm font-semibold rounded-full ${getStatusColor(article.status)} whitespace-nowrap capitalize`}>
              {article.status.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-6">
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-2">Journal</h3>
              <p className="text-gray-900">{article.journal.fullName}</p>
              <p className="text-sm text-gray-600">
                {article.journal.code} • ISSN: {article.journal.issn}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-2">Submission Date</h3>
              <p className="text-gray-900">{formatDate(article.submissionDate)}</p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-2">Article Type</h3>
              <p className="text-gray-900 capitalize">{article.articleType}</p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-2">Author</h3>
              <p className="text-gray-900">{article.author.name}</p>
              <p className="text-sm text-gray-600">{article.author.email}</p>
            </div>
          </div>
        </div>

        {/* Abstract */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-primary mb-4">Abstract</h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{article.abstract}</p>
        </div>

        {/* Keywords */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-primary mb-4">Keywords</h2>
          <div className="flex flex-wrap gap-2">
            {article.keywords.map((keyword, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>

        {/* Manuscript */}
        {article.pdfUrl && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-primary mb-4">Manuscript</h2>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <svg className="w-10 h-10 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
                <div className="ml-4">
                  <p className="text-sm font-bold text-gray-900">Manuscript PDF</p>
                  <p className="text-xs text-gray-600">Click to download or view</p>
                </div>
              </div>
              <a
                href={article.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                View PDF
              </a>
            </div>
          </div>
        )}

        {/* Review Status */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-primary mb-4">Review Status</h2>

          {article.status.toLowerCase().replace(' ', '_') === 'submitted' && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Your submission is currently being processed. We will assign reviewers shortly and notify you of any updates.
                  </p>
                </div>
              </div>
            </div>
          )}

          {article.status.toLowerCase().replace(' ', '_') === 'under_review' && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Your article is currently under peer review. We will notify you once the review process is complete.
                  </p>
                </div>
              </div>
            </div>
          )}

          {article.status.toLowerCase().replace(' ', '_') === 'waiting_for_editor' && (
            <div className="bg-purple-50 border-l-4 border-purple-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-purple-700">
                    Review process complete. The editor is now making a final decision on your article.
                  </p>
                </div>
              </div>
            </div>
          )}

          {(article.status.toLowerCase().replace(' ', '_') === 'accepted' || article.status.toLowerCase().replace(' ', '_') === 'published') && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700 font-semibold">
                    {article.status === 'published' ? 'Congratulations! Your article has been published.' : 'Congratulations! Your article has been accepted for publication.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {article.status.toLowerCase().replace(' ', '_') === 'rejected' && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 font-semibold mb-1">
                    Unfortunately, your submission was not accepted.
                  </p>
                  {(article.rejectionReason || article.editorComments) && (
                    <div className="text-sm text-red-700 mt-2 bg-red-100 p-2 rounded">
                      <strong>Reason:</strong> {article.rejectionReason || article.editorComments}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {article.status.toLowerCase().replace(' ', '_') === 'revision_requested' && (
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-orange-700 font-semibold mb-1">
                    Revisions have been requested for your article.
                  </p>
                  {article.editorComments && (
                    <div className="text-sm text-orange-800 mt-2 bg-orange-100 p-3 rounded border border-orange-200">
                      <strong>Editor Comments:</strong>
                      <p className="mt-1 whitespace-pre-wrap">{article.editorComments}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Placeholder for future reviewer/review data */}
          <div className="mt-6">
            <h3 className="text-sm font-bold text-gray-700 mb-2">Review Timeline</h3>
            <div className="border-l-2 border-gray-300 pl-4 space-y-4">
              <div className="relative">
                <div className="absolute -left-[22px] w-4 h-4 rounded-full bg-primary"></div>
                <p className="text-sm text-gray-700 font-semibold">Submitted</p>
                <p className="text-xs text-gray-600">{formatDate(article.submissionDate)}</p>
              </div>
              {/* Future: Add more timeline events as they happen */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
