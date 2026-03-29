"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

interface CoAuthor {
  name: string;
  email: string;
  university: string;
}

export default function FinalProofPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [mainAuthorUniversity, setMainAuthorUniversity] = useState("");
  const [coAuthors, setCoAuthors] = useState<CoAuthor[]>([]);
  
  // File placeholders (Simulated for MVP: user can upload replacement files, but we are keeping it simple text-based here, or relying on standard S3 uploads if fully integrated)
  // To keep this minimal, we will just allow metadata edits. Most "final proofs" are metadata fixes before we typeset.

  const [editorComments, setEditorComments] = useState("");

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`/api/articles/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("Failed to load article");

        const data = await response.json();
        const article = data.article;

        if (article.status !== "proof_requested") {
          setError("This article is not pending final proofing.");
          setIsLoading(false);
          return;
        }

        setTitle(article.title);
        setAbstract(article.abstract);
        setKeywords(article.keywords || []);
        setMainAuthorUniversity(article.author.university || "");
        setCoAuthors(article.coAuthors || []);
        setEditorComments(article.editorComments || "");
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchArticle();
  }, [id]);

  const handleAddKeyword = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && e.currentTarget.value.trim() !== "") {
      e.preventDefault();
      const val = e.currentTarget.value.trim();
      if (!keywords.includes(val)) {
        setKeywords([...keywords, val]);
      }
      e.currentTarget.value = "";
    }
  };

  const removeKeyword = (kw: string) => {
    setKeywords(keywords.filter(k => k !== kw));
  };

  const handleAddCoAuthor = () => {
    setCoAuthors([...coAuthors, { name: "", email: "", university: "" }]);
  };

  const handleRemoveCoAuthor = (index: number) => {
    setCoAuthors(coAuthors.filter((_, i) => i !== index));
  };

  const handleCoAuthorChange = (index: number, field: keyof CoAuthor, value: string) => {
    const updated = [...coAuthors];
    updated[index][field] = value;
    setCoAuthors(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("title", title);
      formData.append("abstract", abstract);
      formData.append("keywords", JSON.stringify(keywords));
      formData.append("coAuthors", JSON.stringify(coAuthors.filter(c => c.name.trim() !== "")));
      formData.append("mainAuthorUniversity", mainAuthorUniversity);

      const response = await fetch(`/api/articles/${id}/proof`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to submit proof");

      toast.success("Final proof submitted successfully");
      router.push(`/dashboard/submissions/${id}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow text-center">
          <p className="text-red-500 font-bold mb-4">{error}</p>
          <Link href={`/dashboard/submissions/${id}`} className="text-purple-600 hover:underline">Return to Submission</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href={`/dashboard/submissions/${id}`} className="text-purple-600 hover:text-purple-800 font-semibold mb-2 block">
              ← Back to Submission
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Final Proofing</h1>
            <p className="text-gray-600 mt-1">Please review your manuscript metadata and ensure all author details are correct before final publication.</p>
          </div>
        </div>

        {editorComments && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-5 mb-8">
            <h3 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
              <span>📝</span> Editor Instructions
            </h3>
            <p className="text-purple-800 text-sm whitespace-pre-wrap">{editorComments}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          
          {/* Article Info Section */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Article Metadata</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  required
                  className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Abstract</label>
                <textarea 
                  value={abstract} 
                  onChange={(e) => setAbstract(e.target.value)} 
                  required
                  rows={6}
                  className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Keywords</label>
                <div className="flex flex-wrap gap-2 mb-2 p-3 border border-gray-300 rounded-lg min-h-[50px]">
                  {keywords.map(kw => (
                    <span key={kw} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                      {kw}
                      <button type="button" onClick={() => removeKeyword(kw)} className="hover:text-red-500 ml-1 font-bold">×</button>
                    </span>
                  ))}
                  <input
                    type="text"
                    onKeyDown={handleAddKeyword}
                    placeholder="Type keyword and press Enter..."
                    className="flex-1 min-w-[150px] outline-none border-none text-sm bg-transparent"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Authors Section */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2 flex justify-between items-center">
              Author Information
              <button 
                type="button" 
                onClick={handleAddCoAuthor} 
                className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-3 py-1.5 rounded"
              >
                + Add Co-Author
              </button>
            </h2>

            <div className="space-y-6">
              {/* Main Author (You) */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-bold text-gray-700 mb-3 text-sm flex items-center gap-2">
                  <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded">Main Author</span>
                  (Your Profile)
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">University / Affiliation</label>
                    <input 
                      type="text" 
                      value={mainAuthorUniversity}
                      onChange={(e) => setMainAuthorUniversity(e.target.value)}
                      className="w-full border border-gray-300 rounded p-2 text-sm bg-white"
                      placeholder="Update your university name"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Note: Name and Email are tied to your primary account settings.</p>
              </div>

              {/* Co-Authors */}
              {coAuthors.map((author, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm relative">
                  <button 
                    type="button" 
                    onClick={() => handleRemoveCoAuthor(index)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-red-500 font-bold"
                    aria-label="Remove author"
                  >
                    ×
                  </button>
                  <h3 className="font-bold text-gray-700 mb-3 text-sm">Co-Author {index + 1}</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name *</label>
                      <input 
                        type="text" 
                        value={author.name}
                        onChange={(e) => handleCoAuthorChange(index, "name", e.target.value)}
                        required
                        className="w-full border border-gray-300 rounded p-2 text-sm"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
                      <input 
                        type="email" 
                        value={author.email}
                        onChange={(e) => handleCoAuthorChange(index, "email", e.target.value)}
                        className="w-full border border-gray-300 rounded p-2 text-sm"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">University</label>
                      <input 
                        type="text" 
                        value={author.university}
                        onChange={(e) => handleCoAuthorChange(index, "university", e.target.value)}
                        className="w-full border border-gray-300 rounded p-2 text-sm"
                        placeholder="University of Science"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="pt-4 border-t flex justify-end gap-4">
            <Link 
              href={`/dashboard/submissions/${id}`} 
              className="px-6 py-3 font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              Cancel
            </Link>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-purple-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-purple-700 transition shadow disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? "Submitting..." : "Submit Final Proof"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
