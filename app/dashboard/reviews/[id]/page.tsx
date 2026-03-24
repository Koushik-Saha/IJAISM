"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";

interface Review {
  id: string;
  reviewerNumber: number;
  status: string;
  dueDate: string | null;
  assignedAt: string;
  decision: string | null;
  commentsToAuthor: string | null;
  commentsToEditor: string | null;
  reviewerFiles?: string[];
  article: {
    id: string;
    title: string;
    abstract: string;
    keywords: string[];
    articleType: string;
    submissionDate: string;
    status: string;
    pdfUrl: string | null;
    coverLetterUrl: string | null;
    supplementaryFiles: string[];
    author: {
      name: string;
      email: string;
      university: string;
      affiliation: string | null;
    };
    journal: {
      fullName: string;
      code: string;
      issn: string | null;
    };
  };
}

export default function ReviewSubmissionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const formatArticleStatus = (status: string) => {
    switch (status) {
      case 'submitted': return 'Submitted';
      case 'under_review': return 'Under Review';
      case 'revision_requested': return 'Revision Requested';
      case 'resubmitted': return 'Resubmitted';
      case 'waiting_for_final_decision': return 'Decision Pending';
      case 'accepted': return 'Accepted';
      case 'published': return 'Published';
      case 'rejected': return 'Rejected';
      default: return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  };

  const [review, setReview] = useState<Review | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<{
    decision: string;
    commentsToAuthor: string;
    commentsToEditor: string;
    reviewerFiles: File[];
  }>({
    decision: '',
    commentsToAuthor: '',
    commentsToEditor: '',
    reviewerFiles: [],
  });

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login?redirect=/dashboard/reviews');
          return;
        }

        const response = await fetch(`/api/reviews/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('token');
            router.push('/login?redirect=/dashboard/reviews');
            return;
          }
          if (response.status === 404) {
            setError('Review not found or access denied');
            return;
          }
          throw new Error('Failed to fetch review');
        }

        const data = await response.json();

        if (['invited', 'declined'].includes(data.review.status)) {
          setError('You must accept this review invitation before accessing the manuscript.');
          return;
        }

        setReview(data.review);

        // If already completed, populate form with previous data
        if (data.review.status === 'completed') {
          setFormData({
            decision: data.review.decision || '',
            commentsToAuthor: data.review.commentsToAuthor || '',
            commentsToEditor: data.review.commentsToEditor || '',
            reviewerFiles: data.review.reviewerFiles || [], 
          });
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load review');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchReview();
    }
  }, [id, router]);

  const handleStartReview = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reviews/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setReview((prev) => prev ? { ...prev, status: 'in_progress' } : null);
      }
    } catch (err) {
      console.error('Failed to start review:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.decision) {
      alert('Please select a decision');
      return;
    }

    // Validation based on decision
    if (['minor_revision', 'major_revision'].includes(formData.decision)) {
      if (formData.commentsToAuthor.trim().length < 50) {
        alert('For revision requests, detailed comments to the author are required (min 50 chars).');
        return;
      }
      if (formData.commentsToEditor.trim().length === 0) {
        alert('For revision requests, please provide a summary/reason to the editor.');
        return;
      }
    } else if (['accept', 'reject'].includes(formData.decision)) {
      // Comments are optional for Accept/Reject, but if provided, should likely still be reasonable length?
      // User said "user did not have to comment it is optional".
      // So we skip the length check if empty, but maybe enforce it if not empty? 
      // For simplicity and user request compliance: totally optional.
    } else {
      // Fallback for strictness? User said "reviser must have to...". 
      // Let's stick to the prompt: optional for accept/reject.
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');

      let reviewerFileUrls: string[] = [];

      if (formData.reviewerFiles.length > 0) {
        for (const file of formData.reviewerFiles) {
          const fileFormData = new FormData();
          fileFormData.append('file', file);
          fileFormData.append('fileType', 'reviewerFile');

          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: fileFormData,
          });

          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            reviewerFileUrls.push(uploadData.data.url);
          } else {
            throw new Error(`Failed to upload file: ${file.name}`);
          }
        }
      }

      const payload = {
        decision: formData.decision,
        commentsToAuthor: formData.commentsToAuthor,
        commentsToEditor: formData.commentsToEditor,
        reviewerFiles: reviewerFileUrls
      };

      const response = await fetch(`/api/reviews/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      toast.success('Review submitted successfully!');
      router.push('/dashboard/reviews');
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
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

  if (error || !review) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
            <p className="text-sm text-red-700">{error || 'Review not found'}</p>
          </div>
          <div className="mt-6">
            <Link href="/dashboard/reviews" className="text-primary hover:text-primary/80 font-semibold">
              ← Back to Reviews
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isCompleted = review.status === 'completed';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/dashboard/reviews" className="text-primary hover:text-primary/80 font-semibold flex items-center">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Reviews
          </Link>
        </div>

        {/* Article Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-primary mb-2">{review.article.title}</h1>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Review #{review.reviewerNumber}</span>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${review.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  review.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  } capitalize`}>
                  {review.status.replace(/_/g, ' ')}
                </span>
                
                <span className="px-3 py-1 text-xs font-semibold rounded-full border border-gray-200 bg-gray-50 text-gray-700 capitalize flex items-center gap-1">
                  Article Status: {formatArticleStatus(review.article.status)}
                </span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600">Journal: <span className="font-medium text-gray-900">{review.article.journal.fullName}</span></p>
              <p className="text-sm text-gray-600">Type: <span className="font-medium text-gray-900 capitalize">{review.article.articleType}</span></p>
              <p className="text-sm text-gray-600">Author: <span className="font-medium text-gray-900">{review.article.author.name}</span>
                {review.article.author.name.includes('Author') && <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded border">Double-Blind</span>}
              </p>
              <p className="text-sm text-gray-600">Institution: <span className="font-medium text-gray-900">{review.article.author.university}</span></p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Submitted: <span className="font-medium text-gray-900">
                {new Date(review.article.submissionDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span></p>
              <p className="text-sm text-gray-600">Due Date: <span className="font-medium text-gray-900">
                {review.dueDate ? new Date(review.dueDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }) : 'N/A'}
              </span></p>
            </div>
          </div>

          {review.status === 'pending' && (
            <button
              onClick={handleStartReview}
              className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-primary/90 transition-colors"
            >
              Start Review
            </button>
          )}
        </div>

        {/* Abstract */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-primary mb-4">Abstract</h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{review.article.abstract}</p>
        </div>

        {/* Keywords */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-primary mb-4">Keywords</h2>
          <div className="flex flex-wrap gap-2">
            {review.article.keywords.map((keyword, index) => (
              <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                {keyword}
              </span>
            ))}
          </div>
        </div>

        {/* Manuscript */}
        {review.article.pdfUrl && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-primary mb-4">Manuscript</h2>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <svg className="w-10 h-10 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
                <div className="ml-4">
                  <p className="text-sm font-bold text-gray-900">Full Manuscript PDF</p>
                  <p className="text-xs text-gray-600">View Only (Download Disabled)</p>
                </div>
              </div>
              <button
                onClick={() => {
                  const token = localStorage.getItem('token');
                  if (token) {
                    window.open(`/api/articles/${review.article.id}/pdf?token=${token}`, '_blank');
                  } else {
                    toast.error("Authentication required");
                  }
                }}
                className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                View PDF
              </button>
            </div>

            {/* Additional Files for Reviewer */}
            {(review.article.coverLetterUrl || (review.article.supplementaryFiles && review.article.supplementaryFiles.length > 0)) && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-2">
                <p className="text-sm font-semibold text-gray-700 mb-1">Additional Files:</p>
                {review.article.coverLetterUrl && (
                  <button
                    onClick={() => {
                      const token = localStorage.getItem("token");
                      window.open(`/api/articles/${review.article.id}/pdf?type=coverLetter&token=${token || ''}`, '_blank');
                    }}
                    className="w-full text-center py-2 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded font-medium transition-colors border border-gray-200 text-sm"
                  >
                    <span>📎</span> View Cover Letter
                  </button>
                )}
                {review.article.supplementaryFiles && review.article.supplementaryFiles.map((fileUrl, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      const token = localStorage.getItem("token");
                      window.open(`/api/articles/${review.article.id}/pdf?type=supplementary&index=${index}&token=${token || ''}`, '_blank');
                    }}
                    className="w-full text-center py-2 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded font-medium transition-colors border border-gray-200 text-sm"
                  >
                    <span>📁</span> View Supplementary File {index + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
        }

        {/* Review Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-primary mb-4">
            {isCompleted ? 'Your Review' : 'Submit Review'}
          </h2>

          {isCompleted && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 flex justify-between items-center">
              <div>
                <p className="text-sm text-green-700 font-semibold">
                  ✓ Review completed and submitted
                </p>
                <p className="text-xs text-green-600 mt-1">Thank you for your contribution.</p>
              </div>
              <button
                onClick={() => {
                  const token = localStorage.getItem('token');
                  window.open(`/api/reviews/${review.id}/certificate?token=${token}`, '_blank');
                }}
                className="bg-green-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-green-700 transition flex items-center gap-2"
              >
                <span>📜</span> Download Certificate
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Decision */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">Decision *</label>
              <div className="space-y-3">
                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="decision"
                    value="minor_revision"
                    checked={formData.decision === 'minor_revision'}
                    onChange={(e) => setFormData({ ...formData, decision: e.target.value })}
                    disabled={isCompleted}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <p className="font-semibold text-blue-700">Minor Revision</p>
                    <p className="text-sm text-gray-600">Requires small adjustments before acceptance</p>
                  </div>
                </label>

                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="decision"
                    value="no_recommendation"
                    checked={formData.decision === 'no_recommendation'}
                    onChange={(e) => setFormData({ ...formData, decision: e.target.value })}
                    disabled={isCompleted}
                    className="w-4 h-4 text-gray-600 border-gray-300 focus:ring-gray-500"
                  />
                  <div className="ml-3">
                    <p className="font-semibold text-gray-700">No Recommendation</p>
                    <p className="text-sm text-gray-600">Decline to provide a distinct publication decision</p>
                  </div>
                </label>

                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="decision"
                    value="accept"
                    checked={formData.decision === 'accept'}
                    onChange={(e) => setFormData({ ...formData, decision: e.target.value })}
                    disabled={isCompleted}
                    className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                  />
                  <div className="ml-3">
                    <p className="font-semibold text-green-700">Accept</p>
                    <p className="text-sm text-gray-600">Article meets all criteria for publication</p>
                  </div>
                </label>

                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="decision"
                    value="reject"
                    checked={formData.decision === 'reject'}
                    onChange={(e) => setFormData({ ...formData, decision: e.target.value })}
                    disabled={isCompleted}
                    className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                  />
                  <div className="ml-3">
                    <p className="font-semibold text-red-700">Reject</p>
                    <p className="text-sm text-gray-600">Article does not meet publication standards</p>
                  </div>
                </label>

                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="decision"
                    value="major_revision"
                    checked={formData.decision === 'major_revision'}
                    onChange={(e) => setFormData({ ...formData, decision: e.target.value })}
                    disabled={isCompleted}
                    className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                  />
                  <div className="ml-3">
                    <p className="font-semibold text-orange-700">Major Revision</p>
                    <p className="text-sm text-gray-600">Requires significant foundational changes</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Comments to Author */}
            <div>
              <label htmlFor="commentsToAuthor" className="block text-sm font-bold text-gray-700 mb-2">
                Comments to Author {['minor_revision', 'major_revision'].includes(formData.decision) ? '* (Minimum 50 characters)' : '(Optional)'}
              </label>
              <textarea
                id="commentsToAuthor"
                rows={8}
                value={formData.commentsToAuthor}
                onChange={(e) => setFormData({ ...formData, commentsToAuthor: e.target.value })}
                disabled={isCompleted}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                placeholder="Provide detailed feedback for the author on the strengths and weaknesses of the manuscript..."
              />
              <p className="mt-1 text-sm text-gray-500">
                {formData.commentsToAuthor.length} characters
                {formData.commentsToAuthor.length < 50 && ` (${50 - formData.commentsToAuthor.length} more required)`}
              </p>
            </div>

            {/* Comments to Editor (Optional) */}
            <div>
              <label htmlFor="commentsToEditor" className="block text-sm font-bold text-gray-700 mb-2">
                Confidential Comments to Editor {['minor_revision', 'major_revision'].includes(formData.decision) ? '*' : '(Optional)'}
              </label>
              <textarea
                id="commentsToEditor"
                rows={4}
                value={formData.commentsToEditor}
                onChange={(e) => setFormData({ ...formData, commentsToEditor: e.target.value })}
                disabled={isCompleted}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                placeholder="Add any confidential comments for the editor (not shared with the author)..."
              />
            </div>

            {/* Reviewer Supplementary Files Upload */}
            {!isCompleted && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Attach Files (Optional)
                </label>
                <p className="text-xs text-gray-500 mb-2">Upload marked-up manuscripts, datasets, or supplementary notes for the author and editor.</p>
                <input
                  type="file"
                  multiple
                  disabled={isCompleted || isSubmitting}
                  accept=".pdf,.doc,.docx,.jpg,.png,.jpeg,.csv,.xlsx"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all cursor-pointer"
                  onChange={(e) => {
                    if (e.target.files) {
                      const newFiles = Array.from(e.target.files);
                      setFormData(prev => {
                        // Avoid exact duplicates by name and size
                        const currentFiles = prev.reviewerFiles;
                        const filteredNew = newFiles.filter(nf => 
                          !currentFiles.some(cf => cf instanceof File && cf.name === nf.name && cf.size === nf.size)
                        );
                        return {
                          ...prev,
                          reviewerFiles: [...prev.reviewerFiles, ...filteredNew]
                        };
                      });
                      // Reset input value so the same file can be selected again if removed
                      e.target.value = '';
                    }
                  }}
                />

                {formData.reviewerFiles.length > 0 && (
                  <div className="mt-4 flex flex-col gap-2">
                    <p className="text-xs font-semibold text-gray-700">Selected Files:</p>
                    {formData.reviewerFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-gray-50 border px-3 py-2 rounded">
                        <span className="text-sm text-gray-800 truncate pr-4">{file.name}</span>
                        <button
                          type="button"
                          className="text-red-500 hover:text-red-700 text-xs font-bold shrink-0"
                          onClick={() => {
                            const newFiles = [...formData.reviewerFiles];
                            newFiles.splice(idx, 1);
                            setFormData({ ...formData, reviewerFiles: newFiles });
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Display Read-Only Supplementary Files if Completed */}
            {isCompleted && formData.reviewerFiles && formData.reviewerFiles.length > 0 && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Attached Files
                </label>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col gap-3 mt-2">
                  {(formData.reviewerFiles as any[]).map((fileUrl: any, idx) => {
                    const urlString = typeof fileUrl === 'string' ? fileUrl : (fileUrl.url || fileUrl.name || 'File');
                    let fileName = 'Attached File';
                    if (typeof urlString === 'string' && urlString.includes('/')) {
                      fileName = urlString.split('/').pop() || 'File';
                    } else if (typeof urlString === 'string') {
                      fileName = urlString;
                    }
                    
                    return (
                      <div key={idx} className="flex items-center justify-between bg-white border border-gray-200 p-3 rounded shadow-sm">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                          </svg>
                          <span className="text-sm font-medium text-gray-700 truncate">{fileName}</span>
                        </div>
                        {typeof urlString === 'string' && urlString.startsWith('http') && (
                          <a 
                            href={urlString} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-blue-50 text-primary hover:bg-blue-100 flex items-center gap-1 font-semibold border-primary border px-3 py-1.5 rounded text-xs transition-colors shrink-0"
                          >
                            Download <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Submit Button */}
            {!isCompleted && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary text-white py-3 px-6 rounded-lg font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting Review...' : 'Submit Review'}
              </button>
            )}
          </form>
        </div>
      </div >
    </div >
  );
}
