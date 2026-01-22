"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

interface MembershipStatus {
  tier: string;
  tierName: string;
  submissions: {
    limit: number;
    used: number;
    remaining: number;
    isUnlimited: boolean;
    canSubmit: boolean;
  };
}

interface Journal {
  id: string;
  code: string;
  fullName: string;
  description: string | null;
  issn: string | null;
  impactFactor: number | null;
  coverImageUrl: string | null;
}

function SubmitFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resubmitId = searchParams.get('resubmit');

  const [agreementChecked, setAgreementChecked] = useState(false);

  const [isResubmission, setIsResubmission] = useState(false);
  const [originalArticle, setOriginalArticle] = useState<any>(null);

  const [formData, setFormData] = useState<{
    submissionType: string;
    journal: string;
    title: string;
    abstract: string;
    keywords: string;
    manuscript: File | null;
    coverLetter: File | null;
    coAuthors: { name: string; email: string; university: string }[];
  }>({
    submissionType: "article",
    journal: "",
    title: "",
    abstract: "",
    keywords: "",
    manuscript: null,
    coverLetter: null,
    coAuthors: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus | null>(null);
  const [loadingMembership, setLoadingMembership] = useState(true);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loadingJournals, setLoadingJournals] = useState(true);

  // Fetch Resubmission Data
  useEffect(() => {
    if (resubmitId) {
      const fetchOriginalArticle = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`/api/articles/${resubmitId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();

          if (data.success) {
            const article = data.article;
            setOriginalArticle(article);
            setIsResubmission(true);

            // Pre-fill form
            setFormData(prev => ({
              ...prev,
              submissionType: article.articleType || 'article',
              journal: article.journal.code,
              title: article.title,
              abstract: article.abstract,
              keywords: Array.isArray(article.keywords) ? article.keywords.join(', ') : article.keywords,
              coAuthors: article.coAuthors ? article.coAuthors.map((ca: any) => ({
                name: ca.name,
                email: ca.email || '',
                university: ca.university
              })) : [],
            }));

            toast.info("Resubmission Mode", {
              description: "Loaded data from your previous submission. Please upload your revised manuscript."
            });
          }
        } catch (err) {
          console.error("Failed to load resubmission data", err);
          toast.error("Failed to load original article");
        }
      };
      fetchOriginalArticle();
    }
  }, [resubmitId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login?redirect=/submit');
          return;
        }

        // Fetch Journals
        setLoadingJournals(true);
        try {
          const journalsRes = await fetch('/api/journals');
          const journalsData = await journalsRes.json();
          if (journalsData.success) {
            setJournals(journalsData.journals);
          } else {
            console.error('Failed to load journals:', journalsData.error);
            toast.error('Failed to load journals');
          }
        } catch (error) {
          console.error('Failed to fetch journals:', error);
          toast.error('Failed to load journals');
        } finally {
          setLoadingJournals(false);
        }

        // Fetch Membership Status
        setLoadingMembership(true);
        try {
          const membershipRes = await fetch('/api/membership/status', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (membershipRes.status === 401) {
            router.push('/login?redirect=/submit');
            return;
          }

          const membershipData = await membershipRes.json();
          if (membershipData.success) {
            setMembershipStatus(membershipData.status);
          }
        } catch (error) {
          console.error('Failed to fetch membership:', error);
        } finally {
          setLoadingMembership(false);
        }

      } catch (error) {
        console.error('Error initializing submit page:', error);
      }
    };

    fetchData();
  }, [router]);

  const addCoAuthor = () => {
    setFormData({
      ...formData,
      coAuthors: [...formData.coAuthors, { name: '', email: '', university: '' }]
    });
  };

  const removeCoAuthor = (index: number) => {
    const newCoAuthors = [...formData.coAuthors];
    newCoAuthors.splice(index, 1);
    setFormData({ ...formData, coAuthors: newCoAuthors });
  };

  const updateCoAuthor = (index: number, field: string, value: string) => {
    const newCoAuthors = [...formData.coAuthors];
    // @ts-ignore
    newCoAuthors[index][field] = value;
    setFormData({ ...formData, coAuthors: newCoAuthors });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.journal) {
      errors.journal = 'Please select a journal';
    }

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }

    if (!formData.abstract.trim()) {
      errors.abstract = 'Abstract is required';
    } else {
      const wordCount = formData.abstract.trim().split(/\s+/).filter(Boolean).length;
      if (wordCount < 150) {
        errors.abstract = `Abstract is too short (${wordCount} words). Minimum 150 words required.`;
      } else if (wordCount > 300) {
        errors.abstract = `Abstract is too long (${wordCount} words). Maximum 300 words allowed.`;
      }
    }

    if (!formData.keywords.trim()) {
      errors.keywords = 'Keywords are required';
    } else {
      const keywordCount = formData.keywords.split(',').filter(k => k.trim()).length;
      if (keywordCount < 4) {
        errors.keywords = `At least 4 keywords required (currently ${keywordCount})`;
      } else if (keywordCount > 7) {
        errors.keywords = `Maximum 7 keywords allowed (currently ${keywordCount})`;
      }
    }

    // validate co-authors
    formData.coAuthors.forEach((author, index) => {
      if (!author.name) errors[`coAuthor_${index}_name`] = 'Name is required';
      if (!author.university) errors[`coAuthor_${index}_university`] = 'University is required';
      if (author.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(author.email)) {
        errors[`coAuthor_${index}_email`] = 'Invalid email';
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);
    setValidationErrors({});

    // Validate form
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login?redirect=/submit');
        return;
      }

      // Upload files if provided
      let manuscriptUrl = null;
      let coverLetterUrl = null;

      if (formData.manuscript) {
        const manuscriptFormData = new FormData();
        manuscriptFormData.append('file', formData.manuscript);
        manuscriptFormData.append('fileType', 'manuscript');

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: manuscriptFormData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          manuscriptUrl = uploadData.url;
        } else {
          throw new Error('Failed to upload manuscript');
        }
      }

      if (formData.coverLetter) {
        const coverLetterFormData = new FormData();
        coverLetterFormData.append('file', formData.coverLetter);
        coverLetterFormData.append('fileType', 'coverLetter');

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: coverLetterFormData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          coverLetterUrl = uploadData.url;
        } else {
          throw new Error('Failed to upload cover letter');
        }
      }

      // Prepare submission data
      const submissionData = {
        submissionType: formData.submissionType,
        journal: formData.journal,
        title: formData.title,
        abstract: formData.abstract,
        keywords: formData.keywords,
        manuscriptUrl,
        coverLetterUrl,
        coAuthors: formData.coAuthors,
        ...(isResubmission && { resubmissionId: resubmitId }),
      };

      // Submit to API
      const response = await fetch('/api/articles/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(submissionData),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if it's a membership limit error
        if (response.status === 403 && data.upgradeRequired) {
          toast.error('Membership limit reached', {
            description: `${data.error}. You are currently on the ${data.currentTier} tier.`,
            duration: 5000,
            action: {
              label: 'Upgrade Now',
              onClick: () => router.push('/membership'),
            },
          });
          throw new Error(data.error);
        }

        throw new Error(data.error || 'Submission failed');
      }

      // Success - show toast and redirect to dashboard
      toast.success('Article submitted successfully!', {
        description: `"${data.article.title}" has been submitted to ${data.article.journal.name}. Submission ID: ${data.article.id}`,
        duration: 5000,
      });

      // Redirect after a short delay to show the toast
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);

    } catch (error: any) {
      console.error('Submission error:', error);
      const errorMessage = error.message || 'Failed to submit article. Please try again.';
      setError(errorMessage);

      // Show error toast
      toast.error('Submission failed', {
        description: errorMessage,
        duration: 4000,
      });

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Submit Your Research</h1>
          <p className="text-xl md:text-2xl text-gray-100 max-w-3xl">
            Share your groundbreaking research with the global academic community
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Info Section */}
        <div className="bg-blue-50 border-l-4 border-accent rounded-lg p-6 mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-accent"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-bold text-primary mb-2">
                Rigorous Peer Review Process
              </h3>
              <p className="text-gray-700">
                Our comprehensive review process ensures high-quality publications. Your paper will be evaluated by expert reviewers and our editorial board.
              </p>
            </div>
          </div>
        </div>

        {/* Membership Status (keep existing) */}
        {!loadingMembership && membershipStatus && (
          <div className={`rounded-lg p-6 mb-8 border-l-4 ${membershipStatus.submissions.canSubmit
            ? 'bg-green-50 border-green-500'
            : 'bg-red-50 border-red-500'
            }`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className={`text-lg font-bold ${membershipStatus.submissions.canSubmit ? 'text-green-900' : 'text-red-900'
                    }`}>
                    {membershipStatus.tierName} Membership
                  </h3>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${membershipStatus.tier === 'free'
                    ? 'bg-gray-200 text-gray-800'
                    : membershipStatus.tier === 'basic'
                      ? 'bg-blue-200 text-blue-800'
                      : membershipStatus.tier === 'premium'
                        ? 'bg-purple-200 text-purple-800'
                        : 'bg-amber-200 text-amber-800'
                    }`}>
                    {membershipStatus.tier.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-2">
                  {membershipStatus.submissions.isUnlimited ? (
                    <p className="text-green-800 font-semibold">
                      ✓ Unlimited submissions this year
                    </p>
                  ) : (
                    <>
                      <p className={membershipStatus.submissions.canSubmit ? 'text-green-800' : 'text-red-800'}>
                        <strong>Submissions this year:</strong> {membershipStatus.submissions.used} / {membershipStatus.submissions.limit}
                        {membershipStatus.submissions.canSubmit && (
                          <span className="ml-2">
                            ({membershipStatus.submissions.remaining} remaining)
                          </span>
                        )}
                      </p>

                      {!membershipStatus.submissions.canSubmit && (
                        <p className="text-red-800 font-semibold">
                          {membershipStatus.tier === 'free'
                            ? '⚠️ Free tier does not include article submissions. Please upgrade to submit.'
                            : `⚠️ You have reached your annual limit of ${membershipStatus.submissions.limit} submissions.`}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {!membershipStatus.submissions.canSubmit && (
                <div className="ml-4">
                  <Link
                    href="/membership"
                    className="inline-block bg-accent text-white px-6 py-2 rounded-lg font-bold hover:bg-accent-dark transition-colors whitespace-nowrap"
                  >
                    {membershipStatus.tier === 'free' ? 'Get Membership' : 'Upgrade Plan'}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Links (keep existing) */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {/* ... (keep same links) ... */}
          <Link
            href="/author-guidelines"
            className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow text-center"
          >
            <div className="text-3xl mb-2">📖</div>
            <h3 className="font-bold text-primary">Author Guidelines</h3>
          </Link>
          <Link
            href="/paper-format"
            className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow text-center"
          >
            <div className="text-3xl mb-2">📄</div>
            <h3 className="font-bold text-primary">Paper Format</h3>
          </Link>
          <Link
            href="/journals"
            className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow text-center"
          >
            <div className="text-3xl mb-2">📚</div>
            <h3 className="font-bold text-primary">Browse Journals</h3>
          </Link>
        </div>

        {/* Submission Form */}
        <div className="bg-white rounded-lg shadow-md p-8 md:p-12">
          <h2 className="text-3xl font-bold text-primary mb-6">Submission Form</h2>
          {/* ... (keep error boxes) ... */}
          <p className="text-gray-700 mb-8">
            Please complete all required fields below. Make sure you have read our{" "}
            <Link href="/author-guidelines" className="text-accent hover:underline font-semibold">
              author guidelines
            </Link>{" "}
            before submitting.
          </p>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-bold text-red-800">Submission Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {isResubmission && (
            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 10.172V13h2v1.243z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-bold text-blue-800">Resubmission Mode</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    You are updating your submission for "<strong>{originalArticle?.title}</strong>".
                    Please ensure you upload the revised manuscript.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* ... (Submission Type, Journal, Title, Abstract, Keywords - Keep existing) ... */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Submission Type <span className="text-red-500">*</span>
              </label>
              <select
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                value={formData.submissionType}
                onChange={(e) =>
                  setFormData({ ...formData, submissionType: e.target.value })
                }
              >
                <option value="article">Research Article</option>
                <option value="review">Review Paper</option>
                <option value="case-study">Case Study</option>
                <option value="technical-note">Technical Note</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Select Journal <span className="text-red-500">*</span>
              </label>
              <select
                required
                disabled={loadingJournals}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent ${validationErrors.journal ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  } ${loadingJournals ? 'opacity-50 cursor-not-allowed' : ''}`}
                value={formData.journal}
                onChange={(e) => setFormData({ ...formData, journal: e.target.value })}
              >
                <option value="">{loadingJournals ? 'Loading journals...' : '-- Choose a journal --'}</option>
                {journals.map((journal) => (
                  <option key={journal.id} value={journal.code}>
                    {journal.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Paper Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent ${validationErrors.title ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                placeholder="Enter your paper title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Abstract <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={8}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent ${validationErrors.abstract ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                placeholder="Enter your abstract (150-300 words)"
                value={formData.abstract}
                onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
              />
              <div className="flex justify-between items-center mt-1">
                <p className={`text-sm ${validationErrors.abstract ? 'text-red-600 font-semibold' : 'text-gray-600'
                  }`}>
                  Word count: {formData.abstract.split(/\s+/).filter(Boolean).length} / 150-300 words
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Keywords <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent ${validationErrors.keywords ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                placeholder="Enter 4-7 keywords, separated by commas"
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              />
            </div>

            {/* Co-Authors Section */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-700">Co-Authors</h3>
                <button
                  type="button"
                  onClick={addCoAuthor}
                  className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
                >
                  + Add Co-Author
                </button>
              </div>

              <p className="text-sm text-gray-500 mb-4">
                Note: You (the submitter) are automatically listed as the 1st / Main Author. Add additional authors here.
              </p>

              {formData.coAuthors.map((author, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-200 last:border-0 relative">
                  <button
                    type="button"
                    onClick={() => removeCoAuthor(index)}
                    className="absolute top-0 right-0 text-red-500 hover:text-red-700 text-xs"
                  >
                    Remove
                  </button>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Name</label>
                    <input
                      type="text"
                      value={author.name}
                      onChange={(e) => updateCoAuthor(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      placeholder="Full Name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                    <input
                      type="email"
                      value={author.email}
                      onChange={(e) => updateCoAuthor(index, 'email', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      placeholder="Email"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">University/Affiliation</label>
                    <input
                      type="text"
                      value={author.university}
                      onChange={(e) => updateCoAuthor(index, 'university', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      placeholder="University"
                      required
                    />
                  </div>
                  {validationErrors[`coAuthor_${index}_email`] && (
                    <p className="text-red-500 text-xs col-span-3">{validationErrors[`coAuthor_${index}_email`]}</p>
                  )}
                </div>
              ))}

              {formData.coAuthors.length === 0 && (
                <div className="text-center text-gray-400 text-sm py-4">No co-authors added</div>
              )}
            </div>

            {/* Manuscript Upload */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Upload Manuscript <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                required
                accept=".pdf,.doc,.docx"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                onChange={(e) =>
                  setFormData({ ...formData, manuscript: e.target.files?.[0] || null })
                }
              />
            </div>

            {/* Cover Letter */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Cover Letter (Optional)
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                onChange={(e) =>
                  setFormData({ ...formData, coverLetter: e.target.files?.[0] || null })
                }
              />
            </div>



            {/* Agreement */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={agreementChecked}
                  onChange={(e) => setAgreementChecked(e.target.checked)}
                  className="mt-1 mr-3 h-5 w-5 text-accent focus:ring-accent border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700 select-none">
                  I confirm that this manuscript is original work... (keep existing text)
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting || !agreementChecked}
                className={`flex-1 px-8 py-4 rounded-lg font-bold text-lg transition-colors ${isSubmitting || !agreementChecked
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-accent hover:bg-accent-dark text-white'
                  }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    Submitting...
                  </span>
                ) : (
                  'Submit Manuscript'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* What Happens Next - Updated */}
        <div className="bg-white rounded-lg shadow-md p-8 mt-8">
          <h2 className="text-2xl font-bold text-primary mb-6">What Happens Next?</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center font-bold mr-4">
                1
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Confirmation Email</h3>
                <p className="text-gray-700">
                  You'll receive a confirmation email with your submission ID within 24 hours.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center font-bold mr-4">
                2
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Reviewer Assignment</h3>
                <p className="text-gray-700">
                  Expert reviewers will be assigned to evaluate your manuscript.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center font-bold mr-4">
                3
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Decision</h3>
                <p className="text-gray-700">
                  The editorial board will make a decision based on peer reviews. You may be asked to revise your manuscript.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SubmitPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SubmitFormContent />
    </Suspense>
  );
}
