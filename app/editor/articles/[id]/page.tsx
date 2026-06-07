"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import ConfirmModal from "@/components/ui/ConfirmModal";
import ArticleAccessButtons from "@/components/articles/ArticleAccessButtons";
import AuthorsManager from "@/components/articles/AuthorsManager";
import { getArticleAuthors } from "@/lib/articles/authors";

interface Article {
  id: string;
  title: string;
  abstract: string;
  keywords: string[];
  status: string;
  doi?: string | null;
  articleType?: string | null;
  publicationDate?: string | null;
  submissionDate?: string | null;
  acceptanceDate?: string | null;
  language?: string | null;
  isOpenAccess?: boolean;
  pdfUrl?: string | null;
  coverLetterUrl?: string | null;
  supplementaryFiles?: string[];
  author: {
    name: string;
    email: string;
    university: string;
  };
  coAuthors?: Array<{
    id: string;
    name: string;
    university?: string | null;
    isMain: boolean;
    order: number;
  }>;
  journalId: string;
  issueId?: string;
  volume?: number;
  issue?: number;
  journal: {
    fullName: string;
    code: string;
  };
  reviews: Array<{
    id: string;
    reviewerNumber: number;
    status: string;
    reviewer: {
      name: string;
      email: string;
    };
    decision?: string;
    commentsToAuthor?: string;
    commentsToEditor?: string;
    reviewerFiles?: string[];
  }>;
  isApcPaid?: boolean;
  apcAmount?: number;
  similarityScore?: number;
  plagiarismReportUrl?: string;
  activityLogs?: Array<{
    id: string;
    action: string;
    details?: string;
    createdAt: string;
    user: {
      name: string;
      role: string;
    }
  }>;
  editors?: Array<{
    id: string;
    articleId: string;
    userId: string;
    comments?: string | null;
    updatedAt: string;
    user: {
      id: string;
      name: string;
      email: string;
      university: string;
    };
  }>;
}

export default function AdminArticleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [reviewers, setReviewers] = useState<any[]>([]);
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionType, setDecisionType] = useState<'publish' | 'reject' | 'revise' | 'accept' | 'proof_requested' | null>(null);
  const [decisionComments, setDecisionComments] = useState('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Issue Assignment State
  const [availableIssues, setAvailableIssues] = useState<any[]>([]);
  const [allJournals, setAllJournals] = useState<any[]>([]);
  const [filterJournalId, setFilterJournalId] = useState<string>('');
  const [selectedIssue, setSelectedIssue] = useState<string>('');
  const [isAssigningIssue, setIsAssigningIssue] = useState(false);
  const [showCreateIssueModal, setShowCreateIssueModal] = useState(false);
  const [createIssueLoading, setCreateIssueLoading] = useState(false);
  const [newIssueData, setNewIssueData] = useState({
    volume: '',
    issue: '',
    year: new Date().getFullYear(),
    title: '',
    isSpecial: false
  });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [reviewerSearch, setReviewerSearch] = useState('');
  const [showAllReviewers, setShowAllReviewers] = useState(false);
  const [sharedReviews, setSharedReviews] = useState<{ reviewId: string; shareComments: boolean; sharedFiles: string[] }[]>([]);
  const [isEditingDOI, setIsEditingDOI] = useState(false);
  const [editedDOI, setEditedDOI] = useState('');
  const [isUpdatingDOI, setIsUpdatingDOI] = useState(false);
  const [isEditingArticleId, setIsEditingArticleId] = useState(false);
  const [editedArticleId, setEditedArticleId] = useState('');
  const [isUpdatingArticleId, setIsUpdatingArticleId] = useState(false);
  const [isEditingAuthors, setIsEditingAuthors] = useState(false);
  const [editedAuthors, setEditedAuthors] = useState<any[]>([]);
  const [isSavingAuthors, setIsSavingAuthors] = useState(false);
  const [authorErrors, setAuthorErrors] = useState<Record<string, string>>({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdatingArticle, setIsUpdatingArticle] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: "",
    abstract: "",
    keywords: "",
    articleType: "",
    journalId: "",
    volume: "",
    issue: "",
    status: "",
    language: "en",
    isOpenAccess: true,
    pdfUrl: "",
  });

  const [journalEditors, setJournalEditors] = useState<any[]>([]);
  const [isSavingArticleEditors, setIsSavingArticleEditors] = useState(false);
  const [editorSearch, setEditorSearch] = useState('');
  const [pendingEditorIds, setPendingEditorIds] = useState<string[]>([]);
  const [evaluationComment, setEvaluationComment] = useState('');
  const [isSavingComment, setIsSavingComment] = useState(false);

  const openEditModal = () => {
    if (!article) return;
    setEditFormData({
      title: article.title || "",
      abstract: article.abstract || "",
      keywords: Array.isArray(article.keywords) ? article.keywords.join(", ") : (article.keywords || ""),
      articleType: article.articleType || "Research Article",
      journalId: article.journalId || "",
      volume: article.volume !== null && article.volume !== undefined ? String(article.volume) : "",
      issue: article.issue !== null && article.issue !== undefined ? String(article.issue) : "",
      status: article.status || "submitted",
      language: article.language || "en",
      isOpenAccess: article.isOpenAccess ?? true,
      pdfUrl: article.pdfUrl || "",
    });
    setShowEditModal(true);
  };

  const handleDeleteArticle = () => {
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/editor/articles/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete article");
      }

      toast.success("Article deleted successfully");
      router.push('/editor/articles');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to delete article");
    }
  };

  const handleUpdateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingArticle(true);
    try {
      const token = localStorage.getItem('token');
      const volumeVal = editFormData.volume.trim() ? parseInt(editFormData.volume) : null;
      const issueVal = editFormData.issue.trim() ? parseInt(editFormData.issue) : null;
      const keywordsArray = editFormData.keywords.split(",").map(k => k.trim()).filter(Boolean);

      const response = await fetch(`/api/editor/articles/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: editFormData.title,
          abstract: editFormData.abstract,
          keywords: keywordsArray,
          articleType: editFormData.articleType,
          journalId: editFormData.journalId,
          volume: volumeVal,
          issue: issueVal,
          status: editFormData.status,
          language: editFormData.language,
          isOpenAccess: editFormData.isOpenAccess,
          pdfUrl: editFormData.pdfUrl,
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update article");

      toast.success("Article updated successfully");
      setShowEditModal(false);
      fetchArticle();
    } catch (err: any) {
      toast.error(err.message || "Failed to update article");
    } finally {
      setIsUpdatingArticle(false);
    }
  };

  const startEditingAuthors = () => {
    if (!article) return;
    const resolved = getArticleAuthors({
      author: article.author as any,
      coAuthors: article.coAuthors || []
    });
    setEditedAuthors(resolved.map(a => ({
      name: a.name,
      email: a.email || '',
      university: a.affiliation || '',
      isMain: a.isMain,
      order: a.order
    })));
    setIsEditingAuthors(true);
  };

  const handleSaveAuthors = async () => {
    setAuthorErrors({});
    setIsSavingAuthors(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/articles/${id}/authors`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ authors: editedAuthors })
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.error?.details && data.error.code === 'VALIDATION_ERROR') {
          setAuthorErrors(data.error.details);
        }
        throw new Error(data.error?.message || data.error || 'Failed to update authors');
      }

      toast.success('Authors updated successfully');
      setIsEditingAuthors(false);
      fetchArticle();
    } catch (e: any) {
      toast.error(e.message || 'Failed to update authors');
    } finally {
      setIsSavingAuthors(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchArticle();
      fetchReviewers();
      fetchCurrentUser();
    }
  }, [id]);

  useEffect(() => {
    if (article?.journalId) {
      fetchJournalEditors();
    }
  }, [article?.journalId]);

  useEffect(() => {
    if (article && currentUser) {
      const myAssignment = article.editors?.find((e: any) => e.userId === currentUser.id);
      if (myAssignment) {
        setEvaluationComment(myAssignment.comments || '');
      }
    }
  }, [article, currentUser]);

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!article?.journalId) return;

    setCreateIssueLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/editor/issues', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newIssueData,
          journalId: article.journalId,
          volume: parseInt(newIssueData.volume),
          issue: parseInt(newIssueData.issue),
          year: parseInt(newIssueData.year as any)
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create issue");

      toast.success("Issue created successfully");
      setShowCreateIssueModal(false);
      fetchIssues(); // Refresh the list
      // Auto-select
      if (data.issue?.id) {
        setSelectedIssue(data.issue.id);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreateIssueLoading(false);
    }
  };

  const DOI_PREFIX = 'https://doi.org/10.63471/';

  const handleUpdateArticleId = async () => {
    const trimmed = editedArticleId.trim();
    if (!trimmed) {
      toast.error("Article ID cannot be empty");
      return;
    }
    setIsUpdatingArticleId(true);
    try {
      const token = localStorage.getItem('token');
      const newDoi = `${DOI_PREFIX}${trimmed}`;
      const response = await fetch(`/api/editor/articles/${id}/doi`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ doi: newDoi })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update Article ID");
      }

      toast.success("Article ID updated successfully");
      setIsEditingArticleId(false);
      fetchArticle();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUpdatingArticleId(false);
    }
  };

  const handleUpdateDOI = async () => {
    if (!editedDOI.trim()) {
      toast.error("DOI cannot be empty");
      return;
    }

    setIsUpdatingDOI(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/editor/articles/${id}/doi`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ doi: editedDOI })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update DOI");
      }

      toast.success("DOI updated successfully");
      setIsEditingDOI(false);
      fetchArticle();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUpdatingDOI(false);
    }
  };

  const fetchCurrentUser = async () => {

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
      }
    } catch (e) {
      console.error("Failed to fetch user", e);
    }
  };

  useEffect(() => {
    if (article?.journalId) {
      fetchAllJournals();
      setFilterJournalId(article.journalId);
    }
  }, [article?.journalId]);

  useEffect(() => {
    fetchIssues(filterJournalId);
  }, [filterJournalId]);

  const fetchAllJournals = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/editor/journals', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setAllJournals(data.journals || []);
      }
    } catch (e) { console.error("Failed to fetch journals", e); }
  };

  const fetchIssues = async (journalId?: string) => {
    try {
      const token = localStorage.getItem('token');
      const url = journalId
        ? `/api/editor/issues?journalId=${journalId}&limit=100`
        : `/api/editor/issues?limit=100`;
      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        const issues = data.data?.issues || data.issues || [];
        setAvailableIssues(issues);
        if (article?.issueId) setSelectedIssue(article.issueId);
      }
    } catch (e) {
      console.error("Failed to fetch issues", e);
    }
  };

  const handleAssignIssue = async () => {
    if (!selectedIssue) {
      toast.error("Please select an issue");
      return;
    }
    setIsAssigningIssue(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/editor/articles/${id}/assign-issue`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ issueId: selectedIssue })
      });

      if (!response.ok) throw new Error("Failed to assign issue");

      toast.success("Article assigned to issue successfully");
      fetchArticle();
    } catch (err) {
      toast.error("Failed to assign issue");
    } finally {
      setIsAssigningIssue(false);
    }
  };

  const fetchArticle = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/editor/articles?id=${id}&t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        },
      });

      if (!response.ok) throw new Error('Failed to fetch article');
      const data = await response.json();
      setArticle(data.article);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchJournalEditors = async () => {
    if (!article?.journalId) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/editor/journals/${article.journalId}/editors`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setJournalEditors(data.editors || []);
      }
    } catch (e) {
      console.error("Failed to fetch journal editors", e);
    }
  };

  const fetchReviewers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/editor/reviewers', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch reviewers');
      const data = await response.json();
      setReviewers(data.reviewers || []);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleAutoAssign = async () => {
    setIsAssigning(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/editor/articles/${id}/auto-assign-reviewers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to auto-assign reviewers');
      }

      toast.success('Auto-assignment successful!', {
        description: data.message,
        duration: 4000,
      });
      fetchArticle(); // Refresh article data
    } catch (err: any) {
      toast.error('Auto-assignment failed', {
        description: err.message || 'Failed to auto-assign reviewers',
        duration: 4000,
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAssignReviewers = async () => {
    const currentReviewerCount = article?.reviews?.length || 0;
    const totalAfterAssignment = currentReviewerCount + selectedReviewers.length;

    if (selectedReviewers.length === 0) {
      toast.error('Invalid selection', {
        description: 'Please select at least 1 reviewer',
        duration: 3000,
      });
      return;
    }


    setIsAssigning(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/editor/articles/${id}/assign-reviewers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reviewerIds: selectedReviewers }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign reviewers');
      }

      const assignedCount = selectedReviewers.length;
      toast.success('Reviewers assigned successfully!', {
        description: `${assignedCount} reviewer(s) have been assigned to this article.`,
        duration: 4000,
      });
      fetchArticle(); // Refresh article data
      setSelectedReviewers([]);
    } catch (err: any) {
      toast.error('Assignment failed', {
        description: err.message || 'Failed to assign reviewers',
        duration: 4000,
      });
    } finally {
      setIsAssigning(false);
    }
  };

  /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
  // @ts-ignore
  const openDecisionModal = (type: 'publish' | 'reject' | 'revise' | 'accept' | 'proof_requested') => {
    // @ts-ignore
    setDecisionType(type);
    setDecisionComments('');
    
    if (type === 'revise' && article) {
      const completedReviews = article.reviews.filter(r => r.status === 'completed');
      setSharedReviews(
        completedReviews.map(r => ({
          reviewId: r.id,
          shareComments: !!r.commentsToAuthor, 
          sharedFiles: r.reviewerFiles ? [...r.reviewerFiles] : []
        }))
      );
    } else {
      setSharedReviews([]);
    }
    
    setShowDecisionModal(true);
  };

  const submitDecision = async () => {
    if (!decisionType) return;

    setIsSubmittingDecision(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/editor/articles/${id}/decision`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          decision: decisionType,
          comments: decisionComments,
          ...(decisionType === 'revise' ? { sharedReviews } : {})
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit decision');
      }

      toast.success(`Decision submitted: ${decisionType}`, {
        description: data.message,
        duration: 4000,
      });

      setShowDecisionModal(false);
      fetchArticle(); // Refresh

    } catch (error: any) {
      toast.error('Decision failed', {
        description: error.message,
        duration: 4000
      });
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const handleApproveCertificate = async (reviewId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/editor/reviews/${reviewId}/certify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Failed to grant certificate");
      toast.success("Certificate granted successfully");
      fetchArticle();
    } catch (err: any) {
      toast.error(err.message);
    }
  };


  const formatStatus = (status: string) => {
    if (!status) return status;
    const statusMap: Record<string, string> = {
      submitted: 'Submitted',
      under_review: 'Under Review',
      waiting_for_editor: 'Waiting for Final Decision',
      revision_requested: 'Revision Requested',
      resubmitted: 'Resubmitted',
      accepted: 'Accepted',
      published: 'Published',
      rejected: 'Rejected',
      pending: 'Pending',
      in_progress: 'In Progress',
      completed: 'Completed',
      declined: 'Declined',
      minor_revision: 'Minor Revision',
      major_revision: 'Major Revision',
      no_recommendation: 'No Recommendation',
      proof_requested: 'Final Proofing Requested',
      proof_resubmitted: 'Final Proof Resubmitted'
    };
    return statusMap[status] || status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const isUserEic = journalEditors.some(
    je => je.userId === currentUser?.id && je.role === 'editor_in_chief'
  );
  const canMakeDecision = ['super_admin', 'mother_admin'].includes(currentUser?.role) || isUserEic;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 space-y-4">
          <p className="text-red-600">Article not found</p>
          <Link href="/editor/articles" className="inline-flex items-center px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all active:scale-95 shadow-sm">
            ← Back
          </Link>
        </div>
      </div>
    );
  }

  const hasReviewers = article.reviews && article.reviews.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-3">
            <Link
              href="/editor/articles"
              className="inline-flex items-center px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
            >
              ← Back
            </Link>
            <div className="flex items-center gap-2">
              {(currentUser?.role === 'mother_admin' || (currentUser?.role === 'super_admin' && !article.doi)) && (
                <Link
                  href={`/editor/articles/${article.id}/edit`}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg shadow-sm text-white bg-accent hover:bg-accent-dark focus:outline-none transition-colors shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Edit Article
                </Link>
              )}
              {currentUser?.role === 'mother_admin' && (
                <button
                  onClick={handleDeleteArticle}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none transition-colors shrink-0 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Article
                </button>
              )}
            </div>
          </div>
          {/* Title row */}
          <h1 className="text-2xl lg:text-3xl font-bold text-primary leading-snug">{article.title}</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Article Details & Reviews */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Article Information</h2>
              <div className="space-y-3">

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Status</p>
                    <span className={`mt-1 inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                      article.status === 'published' ? 'bg-green-100 text-green-800' :
                      article.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
                      article.status === 'resubmitted' ? 'bg-purple-100 text-purple-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {formatStatus(article.status)}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Article Type</p>
                    <p className="text-sm font-medium text-gray-800 mt-1">{article.articleType || 'Research Article'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Journal</p>
                  <p className="font-semibold text-gray-800">{article.journal.fullName}</p>
                  <p className="text-xs text-gray-500">{article.journal.code?.toUpperCase()}</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Volume</p>
                    <p className="text-sm font-medium text-gray-800">{article.volume ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Issue</p>
                    <p className="text-sm font-medium text-gray-800">{article.issue ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Open Access</p>
                    <p className="text-sm font-medium text-gray-800">{article.isOpenAccess ? '✓ Yes' : 'No'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Submitted</p>
                    <p className="text-sm text-gray-800">
                      {article.submissionDate ? new Date(article.submissionDate).toLocaleDateString() : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Accepted</p>
                    <p className="text-sm text-gray-800">
                      {article.acceptanceDate ? new Date(article.acceptanceDate).toLocaleDateString() : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Published</p>
                    <p className="text-sm text-gray-800">
                      {article.publicationDate ? new Date(article.publicationDate).toLocaleDateString() : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Language</p>
                    <p className="text-sm text-gray-800">{article.language?.toUpperCase() || 'EN'}</p>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Authors & Sequence</p>
                    {((!article.doi && article.status !== 'published') ||
                      currentUser?.role === 'mother_admin' ||
                      (currentUser?.role === 'super_admin' && !article.doi)) && !isEditingAuthors && (
                      <button
                        onClick={startEditingAuthors}
                        className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2.5 py-1 rounded transition-colors"
                      >
                        Edit Authors
                      </button>
                    )}
                  </div>

                  {isEditingAuthors ? (
                    <div className="space-y-4 mt-2">
                      <AuthorsManager
                        authors={editedAuthors}
                        onChange={setEditedAuthors}
                        validationErrors={authorErrors}
                        isEditing={true}
                      />
                      <div className="flex justify-end gap-2 pt-3 border-t">
                        <button
                          onClick={() => setIsEditingAuthors(false)}
                          disabled={isSavingAuthors}
                          className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveAuthors}
                          disabled={isSavingAuthors}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary/95 rounded transition-colors"
                        >
                          {isSavingAuthors ? 'Saving...' : 'Save Sequence'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {getArticleAuthors({
                        author: article.author as any,
                        coAuthors: article.coAuthors || []
                      }).map((ca, i) => (
                        <div key={i} className="flex items-start gap-2 bg-gray-50/50 p-2 rounded border border-gray-100 hover:bg-gray-50 transition-colors">
                          <span className="text-xs text-gray-400 w-4 mt-0.5 font-semibold">{i + 1}.</span>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">
                              {ca.name}
                              {ca.isMain && <span className="ml-2 text-[10px] bg-green-100 text-green-800 font-bold px-1.5 py-0.5 rounded">Corresponding</span>}
                              {i === 0 && <span className="ml-1.5 text-[10px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded">First / Main</span>}
                            </p>
                            {ca.email && <p className="text-xs text-gray-500">{ca.email}</p>}
                            {ca.affiliation && <p className="text-xs text-gray-400 mt-0.5">{ca.affiliation}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Plagiarism Check */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span>🛡️</span> Academic Integrity
              </h2>
              {article.similarityScore !== undefined ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-1">Similarity Score</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${article.similarityScore < 15 ? 'bg-green-500' :
                              article.similarityScore < 30 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                            style={{ width: `${Math.min(article.similarityScore, 100)}%` }}
                          ></div>
                        </div>
                        <span className={`font-bold text-lg ${article.similarityScore < 15 ? 'text-green-600' :
                          article.similarityScore < 30 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                          {article.similarityScore}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700">
                    {article.similarityScore < 15 ? "This article has a low similarity score. It appears original." :
                      article.similarityScore < 30 ? "Moderate similarity detected. Please review the report carefully." :
                        "High similarity detected. Potential plagiarism concern."}
                  </p>

                  {article.plagiarismReportUrl && (
                    <a
                      href={article.plagiarismReportUrl}
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

            {/* Publication Identifiers */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Publication Identifiers</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3 group relative">
                  <span className="text-sm font-semibold text-gray-500 w-24 shrink-0 pt-0.5">Article ID</span>
                  <div className="flex-1">
                    {isEditingArticleId ? (
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          className="w-full text-sm border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                          value={editedArticleId}
                          onChange={(e) => setEditedArticleId(e.target.value)}
                          placeholder="e.g., jitmb_25003"
                          autoFocus
                        />
                        <p className="text-xs text-gray-400">This will set DOI to: https://doi.org/10.63471/{editedArticleId || '…'}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={handleUpdateArticleId}
                            disabled={isUpdatingArticleId}
                            className="text-xs bg-primary text-white px-3 py-1 rounded hover:bg-primary/90 disabled:opacity-50"
                          >
                            {isUpdatingArticleId ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => setIsEditingArticleId(false)}
                            className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-bold text-gray-900">
                          {article.doi ? article.doi.replace('https://doi.org/10.63471/', '') : '—'}
                        </span>
                        {(currentUser?.role === 'mother_admin' || (currentUser?.role === 'super_admin' && !article.doi)) && (
                          <button
                            onClick={() => {
                              setEditedArticleId(article.doi ? article.doi.replace('https://doi.org/10.63471/', '') : '');
                              setIsEditingArticleId(true);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-primary transition-all rounded"
                            title="Edit Article ID"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3 group relative">
                  <span className="text-sm font-semibold text-gray-500 w-24 shrink-0 pt-0.5">DOI</span>
                  <div className="flex-1">
                    {isEditingDOI ? (
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          className="w-full text-sm border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                          value={editedDOI}
                          onChange={(e) => setEditedDOI(e.target.value)}
                          placeholder="e.g., https://doi.org/10.xxxx/xxxx"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleUpdateDOI}
                            disabled={isUpdatingDOI}
                            className="text-xs bg-primary text-white px-3 py-1 rounded hover:bg-primary/90 disabled:opacity-50"
                          >
                            {isUpdatingDOI ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => setIsEditingDOI(false)}
                            className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {article.doi ? (
                          <a
                            href={article.doi}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline break-all"
                          >
                            {article.doi}
                          </a>
                        ) : (
                          <span className="text-sm text-gray-400">Not assigned</span>
                        )}
                        
                        {(currentUser?.role === 'mother_admin' || (currentUser?.role === 'super_admin' && !article.doi)) && (
                          <button
                            onClick={() => {
                              setEditedDOI(article.doi || '');
                              setIsEditingDOI(true);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-primary transition-all rounded transition-opacity"
                            title="Edit DOI"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Abstract</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{article.abstract}</p>
            </div>

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

            {/* Reviewers List */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Reviews</h2>
              {article.reviews.length > 0 ? (
                <div className="space-y-4">
                  {article.reviews.map((review) => (
                    <div key={review.id} className="border border-green-200 bg-green-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <p className="font-semibold text-gray-800 text-lg">Reviewer #{review.reviewerNumber}</p>
                          <span className={`text-sm px-3 py-1 rounded-full ${review.status === 'completed' ? 'bg-green-200 text-green-800 font-bold' :
                            review.status === 'declined' ? 'bg-red-200 text-red-800' :
                              'bg-yellow-200 text-yellow-800'
                            }`}>
                            {review.status === 'completed' ? (review.decision ? formatStatus(review.decision) : 'Completed') : formatStatus(review.status)}
                          </span>
                        </div>
                        {review.status === 'completed' && (
                          <div className="flex shrink-0 ml-2">
                            {(review as any).isCertified ? (
                              <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                Certificate Granted
                              </span>
                            ) : (
                              <button
                                onClick={() => handleApproveCertificate(review.id)}
                                className="text-xs bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-full font-bold shadow-sm transition-colors"
                              >
                                Approve Certificate
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="mb-4">
                        <p className="text-base text-gray-700 font-medium">{review.reviewer.name}</p>
                        <p className="text-sm text-gray-600">{review.reviewer.email}</p>
                      </div>

                      {review.status === 'completed' && (
                        <div className="mt-4 pt-4 border-t border-green-200 space-y-4">
                          {review.commentsToAuthor && (
                            <div className="bg-white p-4 rounded border border-gray-100 shadow-sm">
                              <p className="text-sm font-bold text-gray-700 uppercase mb-2">Comments to Author</p>
                              <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{review.commentsToAuthor}</div>
                            </div>
                          )}
                          {review.commentsToEditor && (
                            <div className="bg-red-50 p-4 rounded border border-red-100 shadow-sm">
                              <p className="text-sm font-bold text-red-700 uppercase mb-2 flex items-center gap-2">
                                <span>🔒</span> Confidential to Editor
                              </p>
                              <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{review.commentsToEditor}</div>
                            </div>
                          )}

                          {/* File Attachments */}
                          {review.reviewerFiles && review.reviewerFiles.length > 0 && (
                            <div className="bg-gray-50 p-4 rounded border border-gray-200 shadow-sm mt-4">
                              <p className="text-sm font-bold text-gray-700 uppercase mb-2 flex items-center gap-2">
                                <span>📎</span> Uploaded Files
                              </p>
                              <div className="flex flex-col gap-2 mt-2">
                                {review.reviewerFiles.map((fileUrl, index) => {
                                  const fileName = fileUrl.split('/').pop() || `Attachment ${index + 1}`;
                                  return (
                                    <button
                                      key={index}
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
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No reviews submitting yet.</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">

            {/* ── Assign Paper Editors Card (top of sidebar) ── */}
            {(['super_admin', 'mother_admin'].includes(currentUser?.role) || journalEditors.some(je => je.userId === currentUser?.id && je.role === 'editor_in_chief')) && (() => {
              const isSuperOrMother = ['super_admin', 'mother_admin'].includes(currentUser?.role);
              const isJournalEic = journalEditors.some(je => je.userId === currentUser?.id && je.role === 'editor_in_chief');
              const searchTerm = editorSearch.toLowerCase().trim();

              const filteredEditors = journalEditors.filter(je => {
                const matchesSearch = !searchTerm ||
                  (je.user.name || '').toLowerCase().includes(searchTerm) ||
                  (je.user.email || '').toLowerCase().includes(searchTerm);
                if (!matchesSearch) return false;
                if (isSuperOrMother) return true;
                if (isJournalEic) {
                  return je.role === 'assistant_editor' || je.role === 'editorial_board_member';
                }
                return false;
              });

              const eicEditors = journalEditors.filter(je => je.role === 'editor_in_chief');
              
              // Always sort EIC/Editorial Chiefs to the top
              const sortedEditors = [...filteredEditors].sort((a, b) => {
                const aIsEic = a.role === 'editor_in_chief';
                const bIsEic = b.role === 'editor_in_chief';
                if (aIsEic && !bIsEic) return -1;
                if (!aIsEic && bIsEic) return 1;
                return 0;
              });

              // Show only 3 editors when not searching, show all matches when searching
              const displayedEditors = searchTerm === "" ? sortedEditors.slice(0, 3) : sortedEditors;
              const assignedIds = article.editors?.map((e: any) => e.userId) || [];

              const handleSaveEditors = async () => {
                setIsSavingArticleEditors(true);
                try {
                  const token = localStorage.getItem('token');
                  const res = await fetch(`/api/editor/articles/${article.id}/assign-editors`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userIds: pendingEditorIds })
                  });
                  if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
                  toast.success('Editor assignments updated');
                  setPendingEditorIds([]);
                  fetchArticle();
                } catch (err: any) {
                  toast.error(err.message);
                } finally {
                  setIsSavingArticleEditors(false);
                }
              };

              return (
                <>
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-800 text-lg">Assign Paper Editors</h3>
                      {assignedIds.length > 0 && (
                        <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full border border-indigo-200 font-semibold">
                          {assignedIds.length} assigned
                        </span>
                      )}
                    </div>

                    {/* Search */}
                    <div className="relative mb-3">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={editorSearch}
                        onChange={e => setEditorSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent bg-gray-50 placeholder-gray-400"
                      />
                    </div>

                    {/* Editor cards */}
                    <div className="space-y-2 mb-4">
                      {displayedEditors.length === 0 ? (
                        <p className="text-gray-400 text-center py-6 text-sm">No editors found.</p>
                      ) : displayedEditors.map((je) => {
                        const isAlreadyAssigned = assignedIds.includes(je.userId);
                        const isPending = pendingEditorIds.includes(je.userId);
                        // toggle: pending overrides assigned when present
                        const isChecked = isPending ? !isAlreadyAssigned : isAlreadyAssigned;

                        const roleLabel =
                          je.role === 'editor_in_chief' ? 'Editor-in-Chief' :
                          je.role === 'assistant_editor' ? 'Assistant Editor' :
                          'Editorial Board Member';

                        return (
                          <button
                            key={je.id}
                            type="button"
                            onClick={() => {
                              setPendingEditorIds(prev => {
                                if (prev.includes(je.userId)) return prev.filter(id => id !== je.userId);
                                return [...prev, je.userId];
                              });
                            }}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                              isChecked
                                ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                                : 'border-gray-100 bg-gray-50 hover:border-gray-300 hover:bg-white'
                            }`}
                          >
                            {/* Custom Checkbox */}
                            <div className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                              isChecked ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'
                            }`}>
                              {isChecked && (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>

                            {/* Avatar */}
                            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              isChecked ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
                            }`}>
                              {(je.user.name || 'E').charAt(0).toUpperCase()}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold truncate ${isChecked ? 'text-gray-900' : 'text-gray-700'}`}>
                                {je.user.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">{roleLabel}</p>
                            </div>

                            {/* Saved badge */}
                            {isAlreadyAssigned && !isPending && (
                              <span className="text-xs font-semibold text-indigo-500 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded shrink-0">
                                Assigned
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Selection summary */}
                    {pendingEditorIds.length > 0 && (
                      <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2 mb-3">
                        <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-white text-xs font-bold">{pendingEditorIds.length}</span>
                        </div>
                        <p className="text-sm text-indigo-700 font-medium">
                          {pendingEditorIds.length} change{pendingEditorIds.length !== 1 ? 's' : ''} pending
                        </p>
                      </div>
                    )}

                    <button
                      onClick={handleSaveEditors}
                      disabled={pendingEditorIds.length === 0 || isSavingArticleEditors}
                      className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSavingArticleEditors ? 'Saving…' : 'Assign Editors'}
                    </button>
                  </div>

                  {/* Journal Editorial Chief Display */}
                  <div className="bg-[#1e293b] text-white rounded-lg shadow-md p-4 mt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-black uppercase tracking-widest text-[#38bdf8]">Journal Editorial Chief</span>
                    </div>
                    {eicEditors.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No Editorial Chief assigned to this journal.</p>
                    ) : (
                      <div className="space-y-2">
                        {eicEditors.map((eic: any) => (
                          <div key={eic.id} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                              {(eic.user.name || 'E').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-white truncate">{eic.user.name}</p>
                              <p className="text-xs text-slate-400 truncate">{eic.user.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              );
            })()}

            {/* Assign to Issue Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-bold text-gray-800 mb-4 text-lg">Assign to Issue</h3>

              <div className="space-y-3">
                {/* Journal filter */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filter by Journal</label>
                  <select
                    className="w-full border rounded-md p-2 text-sm bg-gray-50"
                    value={filterJournalId}
                    onChange={(e) => { setFilterJournalId(e.target.value); setSelectedIssue(''); }}
                  >
                    <option value="">All Journals</option>
                    {allJournals.map((j: any) => (
                      <option key={j.id} value={j.id}>{j.code?.toUpperCase()} — {j.fullName?.substring(0, 35)}</option>
                    ))}
                  </select>
                </div>

                {/* Issue select */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Select Issue</label>
                  <select
                    className="w-full border rounded-md p-2 text-sm disabled:bg-gray-100"
                    value={selectedIssue}
                    onChange={(e) => setSelectedIssue(e.target.value)}
                  >
                    <option value="">-- Unassigned --</option>
                    {availableIssues.map((issue: any) => (
                      <option key={issue.id} value={issue.id}>
                        {issue.journal ? `[${issue.journal.code?.toUpperCase()}] ` : ''}
                        Vol {issue.volume}, Issue {issue.issue} ({issue.year}){issue.isSpecial ? ' ★' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleAssignIssue}
                  disabled={isAssigningIssue || !selectedIssue}
                  className="w-full bg-[#006d77] text-white py-2 rounded-lg font-semibold hover:bg-[#00555d] disabled:opacity-50 text-sm"
                >
                  {isAssigningIssue ? 'Saving...' : 'Save Assignment'}
                </button>

                {(article as any).issueId && (
                  <p className="text-xs text-green-600 font-medium text-center">
                    ✓ Assigned to Vol {(article as any).volume}, Issue {(article as any).issue}
                  </p>
                )}
                <div className="pt-2 border-t border-gray-100">
                  <button
                    onClick={() => setShowCreateIssueModal(true)}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 w-full justify-center"
                  >
                    + Create New Issue
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 text-lg">Assign Reviewers</h3>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full border border-indigo-200 hover:bg-indigo-100 font-semibold flex items-center gap-1 transition-colors"
                >
                  <span className="text-base leading-none">+</span> Invite New
                </button>
              </div>

                {/* Search Input */}
                <div className="relative mb-3">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={(reviewerSearch as string) || ''}
                    onChange={(e) => setReviewerSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent bg-gray-50 placeholder-gray-400"
                  />
                </div>

                {/* Reviewer List */}
                <div className="space-y-2 mb-4">
                  {(() => {
                    const searchTerm = reviewerSearch.toLowerCase().trim();
                    const available = reviewers.filter((reviewer) => {
                      const matchesSearch =
                        !searchTerm ||
                        (reviewer.name || '').toLowerCase().includes(searchTerm) ||
                        (reviewer.email || '').toLowerCase().includes(searchTerm);
                      return matchesSearch;
                    });

                    if (available.length === 0) {
                      return <p className="text-gray-400 text-center py-6 text-sm">No reviewers found.</p>;
                    }

                    return (
                      <>
                        <div className="space-y-2">
                          {available.map((reviewer) => {
                            // Only prevent assignment if they are currently assigned and the review is incomplete.
                            // If they completed or declined a previous review round, they CAN be assigned again.
                            const isAlreadyAssigned = article.reviews.some(
                              (r) => r.reviewer.email === reviewer.email && r.status !== 'completed' && r.status !== 'declined'
                            );
                            const isSelected = selectedReviewers.includes(reviewer.id);
                            return (
                              <button
                                key={reviewer.id}
                                type="button"
                                disabled={isAlreadyAssigned}
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedReviewers(selectedReviewers.filter(id => id !== reviewer.id));
                                  } else {
                                    setSelectedReviewers([...selectedReviewers, reviewer.id]);
                                  }
                                }}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                                  isAlreadyAssigned
                                    ? 'opacity-60 cursor-not-allowed bg-gray-50 border-gray-200'
                                    : isSelected
                                      ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                                      : 'border-gray-100 bg-gray-50 hover:border-gray-300 hover:bg-white'
                                  }`}
                              >
                                {/* Custom Checkbox */}
                                <div className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                  isAlreadyAssigned
                                    ? 'border-gray-300 bg-gray-200'
                                    : isSelected
                                      ? 'bg-indigo-600 border-indigo-600'
                                      : 'border-gray-300 bg-white'
                                  }`}>
                                  {(isSelected || isAlreadyAssigned) && (
                                    <svg className={`w-3 h-3 ${isAlreadyAssigned ? 'text-gray-400' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>

                                {/* Avatar */}
                                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                  isAlreadyAssigned ? 'bg-gray-300 text-gray-500' :
                                  isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
                                  }`}>
                                  {(reviewer.name || 'R').charAt(0).toUpperCase()}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-semibold truncate ${
                                    isAlreadyAssigned ? 'text-gray-500' : 'text-gray-900'
                                    }`}>
                                    {reviewer.name}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">{reviewer.email}</p>
                                </div>

                                {/* Assigned Badge */}
                                {isAlreadyAssigned && (
                                  <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                    Assigned
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="space-y-3">
                  {selectedReviewers.length > 0 && (
                    <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
                      <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-bold">{selectedReviewers.length}</span>
                      </div>
                      <p className="text-sm text-indigo-700 font-medium">
                        {selectedReviewers.length} reviewer{selectedReviewers.length !== 1 ? 's' : ''} selected
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleAssignReviewers}
                    disabled={selectedReviewers.length === 0 || isAssigning}
                    className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {isAssigning ? 'Inviting...' : `Invite ${selectedReviewers.length > 0 ? selectedReviewers.length : ''} Reviewer${selectedReviewers.length !== 1 ? 's' : ''}`}
                  </button>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-medium">OR</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                  </div>

                  <button
                    onClick={handleAutoAssign}
                    disabled={isAssigning}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2.5 px-4 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    {isAssigning ? 'Auto-Assigning...' : <><span>✨</span> Auto-Assign</>}
                  </button>
                </div>
              </div>

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




            {/* Assign Editors Card moved to top of sidebar ↑ */}

            {/* Editor Evaluation Box */}
            {article.editors?.some((e: any) => e.userId === currentUser?.id) && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-bold text-gray-800 mb-4 text-lg">My Evaluation Comments</h3>
                <div className="space-y-3">
                  <textarea
                    rows={4}
                    placeholder="Enter your internal evaluation comments and notes for this article..."
                    value={evaluationComment}
                    onChange={(e) => setEvaluationComment(e.target.value)}
                    className="w-full border rounded-lg p-2.5 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 placeholder-gray-400"
                  />
                  <button
                    onClick={async () => {
                      setIsSavingComment(true);
                      try {
                        const token = localStorage.getItem('token');
                        const res = await fetch(`/api/editor/articles/${article.id}/comments`, {
                          method: 'PATCH',
                          headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({ comments: evaluationComment })
                        });
                        if (!res.ok) {
                          const errData = await res.json();
                          throw new Error(errData.error || "Failed to save comment");
                        }
                        toast.success("Evaluation comment saved");
                        fetchArticle();
                      } catch (err: any) {
                        toast.error(err.message);
                      } finally {
                        setIsSavingComment(false);
                      }
                    }}
                    disabled={isSavingComment}
                    className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 text-sm"
                  >
                    {isSavingComment ? 'Saving Comment...' : 'Save Evaluation Comment'}
                  </button>
                </div>
              </div>
            )}

            {/* All Editors Comments (Visible to Admin and EIC) */}
            {(['super_admin', 'mother_admin'].includes(currentUser?.role) || journalEditors.some(je => je.userId === currentUser?.id && je.role === 'editor_in_chief')) && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-bold text-gray-800 mb-4 text-lg">Editorial Evaluation Comments</h3>
                <div className="space-y-4">
                  {article.editors && article.editors.filter((e: any) => e.comments).length > 0 ? (
                    article.editors.filter((e: any) => e.comments).map((editorAssignment: any) => (
                      <div key={editorAssignment.id} className="border-b border-gray-100 pb-3 last:border-0">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-semibold text-sm text-gray-900">{editorAssignment.user.name}</p>
                          <span className="text-xs text-gray-400">
                            {new Date(editorAssignment.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">
                          {editorAssignment.comments}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 italic text-center py-2">No evaluation comments submitted by editors yet.</p>
                  )}
                </div>
              </div>
            )}

            {/* Editor Decision */}
            {canMakeDecision && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">Make Decision</h2>
                <div className="space-y-3">

                  {/* Accept Button (Only if not already accepted/published) */}
                  {article.status !== 'accepted' && article.status !== 'published' && (!article.isApcPaid || currentUser?.role === 'mother_admin') && (
                    <button
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-bold hover:bg-green-700 transition"
                      onClick={() => openDecisionModal('accept')}
                    >
                      ✅ Accept Article
                    </button>
                  )}

                  {/* Post-Acceptance Actions */}
                  {(article.status === 'accepted' || article.status === 'proof_requested' || article.status === 'proof_resubmitted') && (
                    <div className="space-y-2">
                      {!article.isApcPaid && !['mother_admin', 'super_admin'].includes(currentUser?.role || '') ? (
                        <div className="bg-yellow-50 p-3 rounded border border-yellow-200 text-sm text-yellow-800 mb-2">
                          ⚠️ Authors must pay APC fee before you can proceed with publication workflow.
                          <br />
                          <span className="font-semibold">Payment Status: Pending</span>
                        </div>
                      ) : (
                        (article as any).isApcPaid && (
                          <div className="bg-green-50 p-2 rounded text-green-700 text-sm mb-2 font-bold">
                            ✓ APC Fee Paid
                          </div>
                        )
                      )}

                      {/* Request Final Proofing - Available when paid */}
                      {((article as any).isApcPaid || ['mother_admin', 'super_admin'].includes(currentUser?.role || '')) && (
                        <button
                          className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-bold hover:bg-purple-700 transition"
                          onClick={() => openDecisionModal('proof_requested')}
                        >
                          📝 Request Final Proofing
                        </button>
                      )}

                      {/* Publish - Super Admin Only */}
                      {['mother_admin', 'super_admin'].includes(currentUser?.role || '') && (
                        <button
                          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => openDecisionModal('publish')}
                        >
                          📢 Publish Article
                          {!article.isApcPaid && " (Admin Bypass)"}
                        </button>
                      )}
                    </div>
                  )}
                  
                  {/* Revise / Reject Buttons */}
                  {article.status !== 'published' && article.status !== 'rejected' && (!article.isApcPaid || currentUser?.role === 'mother_admin') && (
                    <>
                      <button
                        className="w-full bg-yellow-500 text-white py-3 px-4 rounded-lg font-bold hover:bg-yellow-600 transition"
                        onClick={() => openDecisionModal('revise')}
                      >
                        📝 Request Revision
                      </button>
                      <button
                        className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-bold hover:bg-red-700 transition"
                        onClick={() => openDecisionModal('reject')}
                      >
                        ❌ Reject Article
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>


        {
          showDecisionModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className={`bg-white rounded-lg w-full p-6 ${decisionType === 'revise' ? 'max-w-2xl' : 'max-w-md'}`}>
                <h3 className="text-xl font-bold mb-4 capitalize">
                  {decisionType === 'publish' ? 'Confirm Publication' :
                    decisionType === 'accept' ? 'Accept Article' :
                      decisionType === 'proof_requested' ? 'Request Final Proofing' :
                        decisionType === 'revise' ? 'Request Revision' : 'Reject Article'}
                </h3>

                <p className="text-gray-600 mb-4">
                  {decisionType === 'publish' ? 'Are you sure you want to PUBLISH this article? This is final.' :
                    decisionType === 'accept' ? 'Are you sure you want to ACCEPT this article? The author will be notified to pay the APC fee.' :
                      decisionType === 'proof_requested' ? 'Please provide instructions for the author regarding final metadata or content edits (e.g., author details, affiliation).' :
                        decisionType === 'revise' ? 'Please provide instructions for the author regarding required revisions.' :
                          'Please provide a reason for rejection.'}
                </p>

                {(decisionType === 'revise' || decisionType === 'reject' || decisionType === 'proof_requested') && (
                  <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2">Comments / Reason</label>
                    <textarea
                      className="w-full border rounded-lg p-3"
                      rows={4}
                      value={decisionComments}
                      onChange={(e) => setDecisionComments(e.target.value)}
                      placeholder={decisionType === 'proof_requested' ? "Enter proofing instructions..." : decisionType === 'revise' ? "Enter revision details..." : "Enter rejection reason..."}
                    ></textarea>
                  </div>
                )}

                {decisionType === 'revise' && article && article.reviews.some(r => r.status === 'completed') && (
                  <div className="mb-4 bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <h4 className="text-sm font-bold text-gray-800 mb-3 border-b pb-2">Select Feedback to Share with Author</h4>
                    <div className="space-y-4">
                      {article.reviews.filter(r => r.status === 'completed').map(review => {
                        const sharedState = sharedReviews.find(s => s.reviewId === review.id);
                        if (!sharedState) return null;

                        return (
                          <div key={review.id} className="bg-white p-3 rounded border border-gray-200 shadow-sm">
                            <p className="text-sm font-bold text-gray-800 mb-2">{review.reviewer?.name || `Reviewer ${review.reviewerNumber}`}</p>
                            
                            {/* Comments Checkbox */}
                            {review.commentsToAuthor && (
                              <label className="flex items-start gap-2 cursor-pointer mb-2">
                                <input 
                                  type="checkbox" 
                                  className="mt-1"
                                  checked={sharedState.shareComments}
                                  onChange={(e) => {
                                    setSharedReviews(prev => prev.map(s => 
                                      s.reviewId === review.id ? { ...s, shareComments: e.target.checked } : s
                                    ));
                                  }}
                                />
                                <div>
                                  <span className="text-sm font-semibold block text-gray-700">Forward Comments to Author</span>
                                  <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{review.commentsToAuthor}</p>
                                </div>
                              </label>
                            )}

                            {/* Files Checkboxes */}
                            {review.reviewerFiles && review.reviewerFiles.length > 0 && (
                              <div className="ml-1 pl-5 border-l-2 border-indigo-100 mt-2 space-y-2">
                                <p className="text-xs font-semibold text-gray-600 mb-1">Uploaded Files:</p>
                                {review.reviewerFiles.map((fileUrl, idx) => {
                                  const fileName = fileUrl.split('/').pop() || `File ${idx + 1}`;
                                  const isShared = sharedState.sharedFiles.includes(fileUrl);
                                  return (
                                    <label key={idx} className="flex items-center gap-2 cursor-pointer">
                                      <input 
                                        type="checkbox" 
                                        checked={isShared}
                                        onChange={(e) => {
                                          setSharedReviews(prev => prev.map(s => {
                                            if (s.reviewId !== review.id) return s;
                                            const newFiles = e.target.checked 
                                              ? [...s.sharedFiles, fileUrl] 
                                              : s.sharedFiles.filter(f => f !== fileUrl);
                                            return { ...s, sharedFiles: newFiles };
                                          }));
                                        }}
                                      />
                                      <span className="text-xs text-gray-700 truncate">{fileName}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {decisionType === 'publish' && (
                  <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2">Editor Comments (Optional)</label>
                    <textarea
                      className="w-full border rounded-lg p-3"
                      rows={2}
                      value={decisionComments}
                      onChange={(e) => setDecisionComments(e.target.value)}
                      placeholder="Optional comments..."
                    ></textarea>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDecisionModal(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    disabled={isSubmittingDecision}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitDecision}
                    disabled={isSubmittingDecision || ((decisionType === 'revise' || decisionType === 'reject' || decisionType === 'proof_requested') && !decisionComments.trim())}
                    className={`px-4 py-2 text-white rounded-lg font-bold ${decisionType === 'publish' ? 'bg-green-600 hover:bg-green-700' :
                      decisionType === 'revise' || decisionType === 'proof_requested' ? 'bg-yellow-500 hover:bg-yellow-600' :
                        'bg-red-600 hover:bg-red-700'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isSubmittingDecision ? 'Submitting...' : 'Confirm Decision'}
                  </button>
                </div>
              </div>
            </div>
          )
        }

        {
          showCreateIssueModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-md w-full p-6">
                <h2 className="text-xl font-bold mb-4">Create New Issue</h2>
                <form onSubmit={handleCreateIssue} className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Volume</label>
                      <input
                        type="number"
                        min="1"
                        required
                        className="w-full border rounded p-2"
                        value={newIssueData.volume}
                        onChange={(e) => setNewIssueData({ ...newIssueData, volume: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Issue</label>
                      <input
                        type="number"
                        min="1"
                        required
                        className="w-full border rounded p-2"
                        value={newIssueData.issue}
                        onChange={(e) => setNewIssueData({ ...newIssueData, issue: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                      <input
                        type="number"
                        min="2000"
                        required
                        className="w-full border rounded p-2"
                        value={newIssueData.year}
                        onChange={(e) => setNewIssueData({ ...newIssueData, year: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Special Issue on AI"
                      className="w-full border rounded p-2"
                      value={newIssueData.title}
                      onChange={(e) => setNewIssueData({ ...newIssueData, title: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="modalIsSpecial"
                      className="h-4 w-4 text-primary rounded"
                      checked={newIssueData.isSpecial}
                      onChange={(e) => setNewIssueData({ ...newIssueData, isSpecial: e.target.checked })}
                    />
                    <label htmlFor="modalIsSpecial" className="ml-2 text-sm text-gray-700">This is a Special Issue</label>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowCreateIssueModal(false)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createIssueLoading}
                      className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50"
                    >
                      {createIssueLoading ? 'Creating...' : 'Create & Select'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )
        }
        {
          showInviteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-sm w-full p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Invite New Reviewer</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Send an invitation email. If they don't have an account, they'll be asked to register.
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      id="modal-invite-name"
                      className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Dr. Jane Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      id="modal-invite-email"
                      className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="jane.doe@university.edu"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
                    <input
                      type="text"
                      id="modal-invite-password"
                      className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Temporary password (e.g., ChangeMe123!)"
                    />
                    <p className="text-xs text-gray-500 mt-1">If the user does not exist, they will use this to log in and be forced to change it.</p>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      onClick={() => setShowInviteModal(false)}
                      className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        const nameEl = document.getElementById('modal-invite-name') as HTMLInputElement;
                        const emailEl = document.getElementById('modal-invite-email') as HTMLInputElement;
                        const passwordEl = document.getElementById('modal-invite-password') as HTMLInputElement;
                        const name = nameEl.value;
                        const email = emailEl.value;
                        const tempPassword = passwordEl?.value;

                        if (!name || !email) {
                          toast.error("Please enter both name and email");
                          return;
                        }

                        try {
                          const token = localStorage.getItem('token');
                          toast.info("Sending invitation...");
                          const res = await fetch(`/api/editor/articles/${id}/invite`, {
                            method: 'POST',
                            headers: {
                              'Authorization': `Bearer ${token}`,
                              'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ name, email, tempPassword })
                          });

                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error);

                          toast.success(data.message);
                          setShowInviteModal(false);
                          fetchReviewers();
                        } catch (err: any) {
                          toast.error(err.message);
                        }
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm font-semibold"
                    >
                      Send Invitation
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        }
        {
          showEditModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl my-8">
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                  <h3 className="text-xl font-bold text-gray-800">Edit Article Details</h3>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-400 hover:text-gray-600 font-bold text-lg"
                  >
                    ✕
                  </button>
                </div>
                
                <form onSubmit={handleUpdateArticle} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Title</label>
                    <input
                      type="text"
                      required
                      value={editFormData.title}
                      onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Abstract</label>
                    <textarea
                      required
                      rows={5}
                      value={editFormData.abstract}
                      onChange={(e) => setEditFormData({ ...editFormData, abstract: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Keywords (comma separated)</label>
                      <input
                        type="text"
                        required
                        value={editFormData.keywords}
                        onChange={(e) => setEditFormData({ ...editFormData, keywords: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        placeholder="keyword1, keyword2, ..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Article Type</label>
                      <select
                        value={editFormData.articleType}
                        onChange={(e) => setEditFormData({ ...editFormData, articleType: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white"
                      >
                        <option value="Research Article">Research Article</option>
                        <option value="Review Article">Review Article</option>
                        <option value="Case Report">Case Report</option>
                        <option value="Review">Review</option>
                        <option value="Mini Review">Mini Review</option>
                        <option value="Communication">Communication</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Journal</label>
                      <select
                        required
                        value={editFormData.journalId}
                        onChange={(e) => setEditFormData({ ...editFormData, journalId: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white"
                      >
                        <option value="">Select Journal</option>
                        {allJournals.map((j) => (
                          <option key={j.id} value={j.id}>
                            {j.code?.toUpperCase()} — {j.fullName?.substring(0, 20)}...
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Volume</label>
                      <input
                        type="number"
                        value={editFormData.volume}
                        onChange={(e) => setEditFormData({ ...editFormData, volume: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        placeholder="e.g. 1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Issue</label>
                      <input
                        type="number"
                        value={editFormData.issue}
                        onChange={(e) => setEditFormData({ ...editFormData, issue: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        placeholder="e.g. 2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Status</label>
                      <select
                        value={editFormData.status}
                        onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white"
                      >
                        <option value="submitted">Submitted</option>
                        <option value="under_review">Under Review</option>
                        <option value="waiting_for_editor">Waiting for Editor</option>
                        <option value="revision_requested">Revision Requested</option>
                        <option value="accepted">Accepted</option>
                        <option value="published">Published</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Language</label>
                      <input
                        type="text"
                        value={editFormData.language}
                        onChange={(e) => setEditFormData({ ...editFormData, language: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        placeholder="en"
                      />
                    </div>
                    <div className="flex items-center pt-6">
                      <label className="inline-flex items-center cursor-pointer text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={editFormData.isOpenAccess}
                          onChange={(e) => setEditFormData({ ...editFormData, isOpenAccess: e.target.checked })}
                          className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <span className="ml-2 font-semibold select-none">Open Access</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">PDF URL</label>
                    <input
                      type="text"
                      value={editFormData.pdfUrl}
                      onChange={(e) => setEditFormData({ ...editFormData, pdfUrl: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      placeholder="https://..."
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t mt-6">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdatingArticle}
                      className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/95 transition disabled:opacity-50"
                    >
                      {isUpdatingArticle ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )
        }
        <ConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Delete Article"
          message="Are you sure you want to delete this article? This action cannot be undone."
          confirmLabel="Yes, Delete"
          cancelLabel="No"
          isDestructive={true}
        />
      </div >
    </div >
  );
}
