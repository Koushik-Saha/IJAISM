"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ArticleAccessButtons from "@/components/articles/ArticleAccessButtons";
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
  coverLetterUrl: string | null;
  supplementaryFiles: string[];
  fullText?: string | null;
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
  isApcPaid?: boolean;
  apcAmount?: number;
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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <Link href="/dashboard/submissions" className="text-primary hover:text-primary/80 font-semibold mb-4 inline-block">
              ← Back to Submissions
            </Link>
            <h1 className="text-3xl font-bold text-primary">{article.title}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Article Information</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Journal</p>
                  <p className="font-semibold">{article.journal.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Author</p>
                  <p className="font-semibold">{article.author.name}</p>
                  <p className="text-sm text-gray-600">{article.author.email}</p>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(article.status)}`}>
                      {article.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Plagiarism Check */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span>🛡️</span> Academic Integrity
              </h2>
              {(article as any).similarityScore !== undefined ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-1">Similarity Score</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${(article as any).similarityScore < 15 ? 'bg-green-500' :
                              (article as any).similarityScore < 30 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                            style={{ width: `${Math.min((article as any).similarityScore, 100)}%` }}
                          ></div>
                        </div>
                        <span className={`font-bold text-lg ${(article as any).similarityScore < 15 ? 'text-green-600' :
                          (article as any).similarityScore < 30 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                          {(article as any).similarityScore}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700">
                    {(article as any).similarityScore < 15 ? "This article has a low similarity score. It appears original." :
                      (article as any).similarityScore < 30 ? "Moderate similarity detected. Please review the report carefully." :
                        "High similarity detected. Potential plagiarism concern."}
                  </p>

                  {(article as any).plagiarismReportUrl && (
                    <a
                      href={(article as any).plagiarismReportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm font-semibold flex items-center gap-1"
                    >
                      📄 View Full Plagiarism Report
                    </a>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded border border-gray-100 text-center">
                  <p className="text-gray-500">No plagiarism check data available.</p>
                  <p className="text-xs text-gray-400 mt-1">This feature is active for new submissions.</p>
                </div>
              )}
            </div>

            {/* Abstract */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Abstract</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{article.abstract}</p>
            </div>

             {/* Keywords */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Keywords</h2>
              <div className="flex flex-wrap gap-2">
                {article.keywords.map((keyword, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            {/* Peer Review Feedback */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Reviews</h2>
              {(article as any).reviews && (article as any).reviews.length > 0 ? (
                <div className="space-y-4">
                  {(article as any).reviews.map((review: any, index: number) => {
                    if (review.status !== 'completed') return null;
                    
                    const hasSharedComments = review.isSharedWithAuthor && review.commentsToAuthor;
                    const hasSharedFiles = review.sharedFiles && review.sharedFiles.length > 0;
                    
                    if (!hasSharedComments && !hasSharedFiles) {
                       if (!review.commentsToAuthor && (!review.reviewerFiles || review.reviewerFiles.length === 0)) return null;
                       return null;
                    }

                    return (
                      <div key={index} className="border border-green-200 bg-green-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <p className="font-semibold text-gray-800 text-lg">Reviewer #{review.reviewerNumber || index + 1}</p>
                            <span className="text-sm px-3 py-1 rounded-full bg-green-200 text-green-800 font-bold">
                              Completed
                            </span>
                          </div>
                        </div>

                        {hasSharedComments && (
                          <div className="mt-4 pt-4 border-t border-green-200">
                            <div className="bg-white p-4 rounded border border-gray-100 shadow-sm">
                              <p className="text-sm font-bold text-gray-700 uppercase mb-2">Comments to Author</p>
                              <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{review.commentsToAuthor}</div>
                            </div>
                          </div>
                        )}

                        {hasSharedFiles && (
                          <div className="bg-gray-50 p-4 rounded border border-gray-200 shadow-sm mt-4">
                            <p className="text-sm font-bold text-gray-700 uppercase mb-2 flex items-center gap-2">
                              <span>📎</span> Uploaded Files
                            </p>
                            <div className="flex flex-col gap-2 mt-2">
                              {review.sharedFiles.map((fileUrl: string, fIdx: number) => {
                                const fileName = fileUrl.split('/').pop() || `Attachment ${fIdx + 1}`;
                                return (
                                  <button
                                    key={fIdx}
                                    onClick={() => window.open(fileUrl, '_blank')}
                                    className="text-left w-full bg-white border border-gray-200 hover:border-primary hover:bg-blue-50 px-3 py-2 rounded text-sm text-gray-700 transition-colors flex items-center gap-2"
                                  >
                                    <svg className="w-4 h-4 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    <span className="truncate">{fileName}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No peer reviews available yet.</p>
              )}
            </div>
            
          </div>
          
          {/* Right Sidebar */}
          <div className="lg:col-span-1 space-y-6">

            {/* Author Action Notices */}
            {(article.status === 'proof_requested' || article.status === 'revision_requested' || article.status === 'accepted' || article.status === 'rejected') && (
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-l-primary">
                <h3 className="font-bold text-gray-800 text-lg mb-4">Required Action</h3>
                
                {article.status === 'accepted' && !article.isApcPaid && (
                   <div className="mb-4">
                     <p className="text-sm text-gray-700 mb-3">Your article has been accepted! Please pay the Article Processing Charge (APC) to complete the publication process.</p>
                     <button
                        onClick={async () => {
                          try {
                            const token = localStorage.getItem('token');
                            const res = await fetch('/api/payments/create-apc-session', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                              body: JSON.stringify({ articleId: article.id })
                            });
                            const data = await res.json();
                            if (data.url) {
                              window.location.href = data.url;
                            } else {
                              alert('Failed to start payment: ' + (data.error || 'Unknown error'));
                            }
                          } catch (e) {
                            console.error(e);
                            alert('Payment initialization failed');
                          }
                        }}
                        className="w-full bg-green-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-green-700 transition shadow-sm"
                      >
                        Pay APC Fee
                      </button>
                   </div>
                )}
                {article.status === 'accepted' && article.isApcPaid && (
                  <p className="text-sm text-green-700 font-bold bg-green-50 p-3 rounded">✓ APC Fee Paid. Pending final publication.</p>
                )}

                {article.editorComments && (
                   <div className="mb-4 mt-2">
                    <strong className="text-sm text-gray-800">Editor Comments:</strong>
                    <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{article.editorComments}</p>
                   </div>
                )}
                {article.rejectionReason && article.status === 'rejected' && (
                   <div className="mb-4 bg-red-50 p-3 rounded border border-red-100">
                    <strong className="text-sm text-red-800">Reason for rejection:</strong>
                    <p className="mt-1 text-sm text-red-700 whitespace-pre-wrap">{article.rejectionReason}</p>
                   </div>
                )}
                
                {article.status === 'proof_requested' && (
                  <Link href={`/dashboard/submissions/${article.id}/proof`} className="block text-center w-full bg-purple-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-purple-700 transition">
                    Update Final Proof
                  </Link>
                )}
                {article.status === 'revision_requested' && (
                  <Link href={`/dashboard/submissions/${article.id}/edit`} className="block text-center w-full bg-orange-500 text-white px-4 py-3 rounded-lg font-bold hover:bg-orange-600 transition">
                    Submit Revision
                  </Link>
                )}
              </div>
            )}

            {/* Access Full Text Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-bold text-gray-800 mb-4 text-lg">Access Full Text</h3>
              <ArticleAccessButtons
                articleId={article.id}
                pdfUrl={article.pdfUrl}
                fullTextAvailable={['accepted', 'published', 'proof_requested', 'proof_resubmitted'].includes(article.status.toLowerCase().replace(' ', '_'))}
              />
              {(article.coverLetterUrl || (article.supplementaryFiles && article.supplementaryFiles.length > 0)) && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-2">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Additional Files:</p>
                  {article.coverLetterUrl && (
                    <button
                      onClick={() => {
                        const token = localStorage.getItem("token");
                        window.open(`/api/articles/${article.id}/pdf?type=coverLetter&token=${token || ''}`, '_blank');
                      }}
                      className="w-full text-center py-2 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded font-medium transition-colors border border-gray-200 text-sm"
                    >
                      <span>📎</span> View Cover Letter
                    </button>
                  )}
                  {article.supplementaryFiles && article.supplementaryFiles.map((fileUrl, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        const token = localStorage.getItem("token");
                        window.open(`/api/articles/${article.id}/pdf?type=supplementary&index=${index}&token=${token || ''}`, '_blank');
                      }}
                      className="w-full text-center py-2 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded font-medium transition-colors border border-gray-200 text-sm"
                    >
                      <span>📁</span> View Supplementary File {index + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Status Timeline */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-bold text-gray-800 mb-4 text-lg">Submission Status</h3>
                <div className="relative mt-2">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" style={{ height: 'calc(100% - 20px)' }}></div>
                  <div className="space-y-6">
                    <div className="relative flex items-start pl-10">
                      <div className={`absolute left-2 w-4 h-4 rounded-full border-2 border-white 
                            ${new Date(article.submissionDate) <= new Date() ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">Submitted</h4>
                        <p className="text-xs text-gray-500">{formatDate(article.submissionDate)}</p>
                      </div>
                    </div>
                    <div className="relative flex items-start pl-10">
                      <div className={`absolute left-2 w-4 h-4 rounded-full border-2 border-white 
                            ${['under_review', 'revision_requested', 'resubmitted', 'waiting_for_editor', 'waiting_for_final_decision', 'accepted', 'published', 'rejected', 'proof_requested', 'proof_resubmitted'].includes(article.status.toLowerCase().replace(' ', '_')) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">Under Review</h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {['under_review', 'revision_requested', 'resubmitted'].includes(article.status.toLowerCase().replace(' ', '_'))
                            ? "Reviewers are assessing."
                            : "Process initiated."}
                        </p>
                      </div>
                    </div>
                    <div className="relative flex items-start pl-10">
                      <div className={`absolute left-2 w-4 h-4 rounded-full border-2 border-white 
                            ${['accepted', 'published', 'rejected'].includes(article.status.toLowerCase().replace(' ', '_')) ? (article.status.toLowerCase().replace(' ', '_') === 'rejected' ? 'bg-red-500' : 'bg-green-500') :
                          (article.status.toLowerCase().replace(' ', '_') === 'revision_requested' ? 'bg-orange-500' : 'bg-gray-300')}`}></div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">Decision</h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {article.status.toLowerCase().replace(' ', '_') === 'revision_requested' ? "Revisions required." :
                            article.status.toLowerCase().replace(' ', '_') === 'rejected' ? "Manuscript not accepted." :
                              article.status.toLowerCase().replace(' ', '_') === 'accepted' ? "Accepted for publication." :
                                "Pending."}
                        </p>
                      </div>
                    </div>
                    <div className="relative flex items-start pl-10">
                      <div className={`absolute left-2 w-4 h-4 rounded-full border-2 border-white 
                            ${article.status.toLowerCase().replace(' ', '_') === 'published' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">Published</h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {article.status.toLowerCase().replace(' ', '_') === 'published'
                            ? "Available online."
                            : "Final production."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
            </div>

          </div>
          
        </div>
      </div>
    </div>
  );
}
