"use client";

import { useState } from "react";
import Link from "next/link";

export default function SubmitPage() {
  const [formData, setFormData] = useState<{
    submissionType: string;
    journal: string;
    title: string;
    abstract: string;
    keywords: string;
    manuscript: File | null;
    coverLetter: File | null;
  }>({
    submissionType: "article",
    journal: "",
    title: "",
    abstract: "",
    keywords: "",
    manuscript: null,
    coverLetter: null,
  });

  const journals = [
    "Journal of Information Technology and Management in Business (JITMB)",
    "Journal of Software and Applications Engineering (JSAE)",
    "Advances in Machine Learning and Intelligent Data (AMLID)",
    "Open Journal of Business and Economic Management (OJBEM)",
    "Perspectives on Research in Artificial Intelligence and Healthcare Informatics (PRAIHI)",
    "Journal of Business Value and Data Analytics (JBVADA)",
    "Journal of Advances in Management Sciences and Artificial Intelligence (JAMSAI)",
    "Advances in Engineering and Systems Innovation (AESI)",
    "International Law, Policy, and Regulatory Management (ILPROM)",
    "Trends in Blockchain, Fintech, and Legal Innovations (TBFLI)",
    "Public Management and Social Responsibility Insights (PMSRI)",
    "Digital Rights, Security, and Data Regulations (DRSDR)",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Form submitted:", formData);
    alert("Your submission has been received! You will receive a confirmation email shortly.");
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
                Fast 4-Reviewer Publication System
              </h3>
              <p className="text-gray-700">
                Our innovative 4-reviewer system ensures rapid publication. If all four reviewers
                accept your paper, it will be <strong>automatically published</strong>. Review
                process typically completes within 4-6 weeks.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
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
          <p className="text-gray-700 mb-8">
            Please complete all required fields below. Make sure you have read our{" "}
            <Link href="/author-guidelines" className="text-accent hover:underline font-semibold">
              author guidelines
            </Link>{" "}
            before submitting.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Submission Type */}
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

            {/* Journal Selection */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Select Journal <span className="text-red-500">*</span>
              </label>
              <select
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                value={formData.journal}
                onChange={(e) => setFormData({ ...formData, journal: e.target.value })}
              >
                <option value="">-- Choose a journal --</option>
                {journals.map((journal) => (
                  <option key={journal} value={journal}>
                    {journal}
                  </option>
                ))}
              </select>
            </div>

            {/* Paper Title */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Paper Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="Enter your paper title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            {/* Abstract */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Abstract <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="Enter your abstract (150-250 words)"
                value={formData.abstract}
                onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
              />
              <p className="text-sm text-gray-600 mt-1">
                Word count: {formData.abstract.split(/\s+/).filter(Boolean).length}
              </p>
            </div>

            {/* Keywords */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Keywords <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="Enter 4-6 keywords, separated by commas"
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              />
              <p className="text-sm text-gray-600 mt-1">
                Example: machine learning, neural networks, deep learning, AI
              </p>
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
              <p className="text-sm text-gray-600 mt-1">
                Accepted formats: PDF, DOC, DOCX (Max 20MB)
              </p>
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
              <p className="text-sm text-gray-600 mt-1">
                Optional but recommended. Explain the significance of your work.
              </p>
            </div>

            {/* Agreement */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="flex items-start">
                <input
                  type="checkbox"
                  required
                  className="mt-1 mr-3 h-5 w-5 text-accent focus:ring-accent border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  I confirm that this manuscript is original work, has not been published elsewhere,
                  and is not under consideration by another journal. I have read and agree to the{" "}
                  <Link href="/author-guidelines" className="text-accent hover:underline font-semibold">
                    author guidelines
                  </Link>{" "}
                  and{" "}
                  <Link href="/terms" className="text-accent hover:underline font-semibold">
                    terms of service
                  </Link>
                  .
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 bg-accent hover:bg-accent-dark text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors"
              >
                Submit Manuscript
              </button>
              <button
                type="button"
                className="px-8 py-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Save Draft
              </button>
            </div>
          </form>
        </div>

        {/* What Happens Next */}
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
                  Four expert reviewers will be assigned to evaluate your manuscript (within 7 days).
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center font-bold mr-4">
                3
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Review Process</h3>
                <p className="text-gray-700">
                  Reviewers assess your work for quality, originality, and significance (4-6 weeks).
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center font-bold mr-4">
                4
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Decision & Publication</h3>
                <p className="text-gray-700">
                  If all 4 reviewers accept, your paper is <strong>automatically published!</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
