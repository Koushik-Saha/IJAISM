"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import AuthorsManager from "@/components/articles/AuthorsManager";

interface Journal {
  id: string;
  code: string;
  fullName: string;
}

export default function NewDissertationSubmissionPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<{
    title: string;
    abstract: string;
    keywords: string;
    manuscript: File | null;
    coverLetter: File | null;
    supplementaryFiles: File[];
    coAuthors: { name: string; email: string; university: string; isMain: boolean; isCorresponding: boolean }[];
  }>({
    title: "",
    abstract: "",
    keywords: "",
    manuscript: null,
    coverLetter: null,
    supplementaryFiles: [],
    coAuthors: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [journals, setJournals] = useState<Journal[]>([]);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    try {
      const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (['super_admin', 'mother_admin'].includes(data.user?.role)) {
        setIsAuthorized(true);
        fetchJournals();
      } else {
        router.push('/editor');
      }
    } catch (e) { router.push('/login'); }
  };

  const fetchJournals = async () => {
    try {
      const res = await fetch('/api/journals');
      const data = await res.json();
      if (data.success) {
        setJournals(data.journals || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.abstract.trim()) errors.abstract = 'Abstract is required';
    if (!formData.keywords.trim()) {
      errors.keywords = 'Keywords are required';
    } else {
      const count = formData.keywords.split(',').filter(k => k.trim()).length;
      if (count < 4 || count > 7) {
        errors.keywords = `Must provide between 4 and 7 keywords (currently ${count})`;
      }
    }
    if (!formData.manuscript) errors.manuscript = 'Manuscript file is required';
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error("Unauthorized");

      // 1. Upload files
      let manuscriptUrl = null;
      let coverLetterUrl = null;
      let supplementaryFileUrls: string[] = [];

      if (formData.manuscript) {
        const fileData = new FormData();
        fileData.append('file', formData.manuscript);
        fileData.append('fileType', 'manuscript');
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: fileData,
        });
        if (!res.ok) throw new Error("Failed to upload manuscript");
        const data = await res.json();
        manuscriptUrl = data.data.url;
      }

      if (formData.coverLetter) {
        const fileData = new FormData();
        fileData.append('file', formData.coverLetter);
        fileData.append('fileType', 'coverLetter');
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: fileData,
        });
        if (res.ok) {
          const data = await res.json();
          coverLetterUrl = data.data.url;
        }
      }

      if (formData.supplementaryFiles.length > 0) {
        for (const file of formData.supplementaryFiles) {
          const fileData = new FormData();
          fileData.append('file', file);
          fileData.append('fileType', 'supplementaryFile');
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: fileData,
          });
          if (res.ok) {
            const data = await res.json();
            supplementaryFileUrls.push(data.data.url);
          }
        }
      }

      const journalCode = journals[0]?.code || "default";

      // 2. Submit dissertation submission
      const submissionData = {
        submissionType: "dissertation",
        journal: journalCode,
        title: formData.title,
        abstract: formData.abstract,
        keywords: formData.keywords,
        manuscriptUrl,
        coverLetterUrl,
        supplementaryFiles: supplementaryFileUrls,
        coAuthors: formData.coAuthors,
      };

      const res = await fetch('/api/articles/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submissionData),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Dissertation submitted successfully!");
        router.push('/editor/dissertations');
      } else {
        throw new Error(data.error?.message || data.error || "Submission failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to submit");
      setError(err.message || "Failed to submit");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthorized) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Thesis/Dissertation Submission</h1>
            <p className="text-sm text-gray-500 mt-1">Submit a new thesis/dissertation to the submissions pipeline.</p>
          </div>
          <Link href="/editor/dissertations" className="inline-flex items-center px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all active:scale-95 shadow-sm">
            ← Back
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                placeholder="Enter title"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
              {validationErrors.title && <p className="text-xs text-red-600 mt-1">{validationErrors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Abstract <span className="text-red-500">*</span></label>
              <textarea
                required
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                placeholder="Enter abstract"
                value={formData.abstract}
                onChange={e => setFormData({ ...formData, abstract: e.target.value })}
              />
              {validationErrors.abstract && <p className="text-xs text-red-600 mt-1">{validationErrors.abstract}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Keywords <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                placeholder="Keywords separated by commas"
                value={formData.keywords}
                onChange={e => setFormData({ ...formData, keywords: e.target.value })}
              />
              {validationErrors.keywords && <p className="text-xs text-red-600 mt-1">{validationErrors.keywords}</p>}
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4 text-base">Co-Authors</h3>
              <AuthorsManager
                authors={formData.coAuthors}
                onChange={newAuthors => setFormData({ ...formData, coAuthors: newAuthors })}
                validationErrors={validationErrors}
                isEditing={true}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Manuscript File (PDF) <span className="text-red-500">*</span></label>
              <input
                type="file"
                required
                accept=".pdf"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                onChange={e => setFormData({ ...formData, manuscript: e.target.files?.[0] || null })}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Cover Letter (Optional)</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                onChange={e => setFormData({ ...formData, coverLetter: e.target.files?.[0] || null })}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Supplementary Files (Optional)</label>
              <input
                type="file"
                multiple
                accept=".zip,.rar,.pdf,.doc,.docx,.xls,.xlsx"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                onChange={e => setFormData({ ...formData, supplementaryFiles: e.target.files ? Array.from(e.target.files) : [] })}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 rounded-xl font-bold text-white transition-all active:scale-95 ${
                isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-primary hover:bg-primary/95 shadow-md"
              }`}
            >
              {isSubmitting ? "Submitting..." : "Submit Dissertation"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
