"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

interface Journal {
  id: string;
  fullName: string;
  code: string;
}

interface CoAuthorEntry {
  id?: string;
  name: string;
  email: string;
  university: string;
  isMain: boolean;
  isCorresponding: boolean;
  order: number;
}

interface Article {
  id: string;
  title: string;
  abstract: string;
  keywords: string[];
  articleType: string;
  journalId: string;
  volume: number | null;
  issue: number | null;
  pageStart: number | null;
  pageEnd: number | null;
  status: string;
  language: string;
  isOpenAccess: boolean;
  isBestPaper: boolean;
  pdfUrl: string | null;
  doi: string | null;
  submissionDate: string | null;
  acceptanceDate: string | null;
  publicationDate: string | null;
  journal: Journal;
  author: {
    id: string;
    name: string;
    email: string;
    university: string | null;
    affiliation: string | null;
  };
  coAuthors: CoAuthorEntry[];
}

const STATUS_OPTIONS = [
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "waiting_for_editor", label: "Waiting for Editor" },
  { value: "revision_requested", label: "Revision Requested" },
  { value: "accepted", label: "Accepted" },
  { value: "published", label: "Published" },
  { value: "rejected", label: "Rejected" },
];

const ARTICLE_TYPES = [
  "Research Article",
  "Review Article",
  "Case Report",
  "Review",
  "Mini Review",
  "Communication",
  "Letter",
  "Editorial",
  "Short Communication",
];

function toDateInputValue(val: string | null | undefined): string {
  if (!val) return "";
  try {
    return new Date(val).toISOString().split("T")[0];
  } catch {
    return "";
  }
}

export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [article, setArticle] = useState<Article | null>(null);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Basic info
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [keywords, setKeywords] = useState("");
  const [articleType, setArticleType] = useState("Research Article");

  // Publication details
  const [journalId, setJournalId] = useState("");
  const [volume, setVolume] = useState("");
  const [issue, setIssue] = useState("");
  const [pageStart, setPageStart] = useState("");
  const [pageEnd, setPageEnd] = useState("");
  const [status, setStatus] = useState("submitted");
  const [language, setLanguage] = useState("en");
  const [doi, setDoi] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");

  // Dates
  const [submissionDate, setSubmissionDate] = useState("");
  const [acceptanceDate, setAcceptanceDate] = useState("");
  const [publicationDate, setPublicationDate] = useState("");

  // Flags
  const [isOpenAccess, setIsOpenAccess] = useState(true);
  const [isBestPaper, setIsBestPaper] = useState(false);

  // Authors
  const [authors, setAuthors] = useState<CoAuthorEntry[]>([]);

  // Files
  const [newPdfFile, setNewPdfFile] = useState<File | null>(null);
  const [newDocxFile, setNewDocxFile] = useState<File | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const docxInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login?redirect=/editor/articles");
      return;
    }

    Promise.all([
      fetch(`/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } }).then((r) =>
        r.ok ? r.json() : null
      ),
      fetch(`/api/editor/articles?id=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/editor/journals`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([meData, articleData, journalsData]) => {
        if (!meData?.user) {
          router.push("/login");
          return;
        }
        const user = meData.user;
        setCurrentUser(user);

        if (!["mother_admin", "super_admin"].includes(user.role)) {
          toast.error("You do not have permission to edit articles.");
          router.push(`/editor/articles/${id}`);
          return;
        }

        const art: Article = articleData?.article;
        if (!art) {
          toast.error("Article not found.");
          router.push("/editor/articles");
          return;
        }

        if (user.role === "super_admin" && art.doi) {
          toast.error("This article has a DOI assigned. Only Mother Admin can edit it.");
          router.push(`/editor/articles/${id}`);
          return;
        }

        setArticle(art);
        setTitle(art.title || "");
        setAbstract(art.abstract || "");
        setKeywords(Array.isArray(art.keywords) ? art.keywords.join(", ") : "");
        setArticleType(art.articleType || "Research Article");
        setJournalId(art.journal?.id || art.journalId || "");
        setVolume(art.volume != null ? String(art.volume) : "");
        setIssue(art.issue != null ? String(art.issue) : "");
        setPageStart(art.pageStart != null ? String(art.pageStart) : "");
        setPageEnd(art.pageEnd != null ? String(art.pageEnd) : "");
        setStatus(art.status || "submitted");
        setLanguage(art.language || "en");
        setIsOpenAccess(art.isOpenAccess ?? true);
        setIsBestPaper(art.isBestPaper ?? false);
        setPdfUrl(art.pdfUrl || "");
        setDoi(art.doi || "");
        setSubmissionDate(toDateInputValue(art.submissionDate));
        setAcceptanceDate(toDateInputValue(art.acceptanceDate));
        setPublicationDate(toDateInputValue(art.publicationDate));

        // Build authors array: main author first, then co-authors
        const mainAuthor: CoAuthorEntry = {
          name: art.author?.name || "",
          email: art.author?.email || "",
          university: art.author?.university || art.author?.affiliation || "",
          isMain: true,
          isCorresponding: true,
          order: 0,
        };

        const existingCoAuthors: CoAuthorEntry[] = (art.coAuthors || [])
          .filter((ca: any) => !ca.isMain)
          .sort((a: any, b: any) => a.order - b.order)
          .map((ca: any, idx: number) => ({
            id: ca.id,
            name: ca.name || "",
            email: ca.email || "",
            university: ca.university || "",
            isMain: false,
            isCorresponding: ca.isCorresponding ?? false,
            order: ca.order ?? idx + 1,
          }));

        setAuthors([mainAuthor, ...existingCoAuthors]);

        if (journalsData?.journals) setJournals(journalsData.journals);
      })
      .catch(() => {
        toast.error("Failed to load article data.");
        router.push("/editor/articles");
      })
      .finally(() => setIsLoading(false));
  }, [id, router]);

  const handleAddAuthor = () => {
    setAuthors((prev) => [
      ...prev,
      {
        name: "",
        email: "",
        university: "",
        isMain: false,
        isCorresponding: false,
        order: prev.length,
      },
    ]);
  };

  const handleRemoveAuthor = (index: number) => {
    setAuthors((prev) => {
      const next = prev.filter((_, i) => i !== index);
      // If we removed the main author, promote the new first author
      if (prev[index].isMain && next.length > 0) {
        next[0] = { ...next[0], isMain: true };
      }
      return next;
    });
  };

  const handleAuthorChange = (
    index: number,
    field: keyof CoAuthorEntry,
    value: string | boolean
  ) => {
    setAuthors((prev) =>
      prev.map((a, i) => (i === index ? { ...a, [field]: value } : a))
    );
  };

  const handleSetMainAuthor = (index: number) => {
    setAuthors((prev) =>
      prev.map((a, i) => ({ ...a, isMain: i === index }))
    );
  };

  const handleMoveAuthor = (index: number, direction: "up" | "down") => {
    setAuthors((prev) => {
      const next = [...prev];
      const swapWith = direction === "up" ? index - 1 : index + 1;
      if (swapWith < 0 || swapWith >= next.length) return prev;
      [next[index], next[swapWith]] = [next[swapWith], next[index]];
      return next;
    });
  };

  const uploadFile = async (file: File, fileType: string): Promise<string | null> => {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileType", fileType);

    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data.data?.url || data.url || null;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!article) return;

    setIsSaving(true);
    setIsUploadingFile(false);

    try {
      const token = localStorage.getItem("token");
      let finalPdfUrl = pdfUrl;

      // Upload new PDF if selected
      if (newPdfFile) {
        setIsUploadingFile(true);
        const uploaded = await uploadFile(newPdfFile, "article");
        if (uploaded) finalPdfUrl = uploaded;
        setIsUploadingFile(false);
      }

      // Upload new DOCX if selected (update manuscriptUrl — stored as pdfUrl for now or separate field)
      // If needed in the future, store manuscriptUrl separately
      if (newDocxFile) {
        setIsUploadingFile(true);
        await uploadFile(newDocxFile, "article"); // stored separately if needed
        setIsUploadingFile(false);
      }

      const keywordsArray = keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);

      // Send all authors in their current order, preserving isMain designation
      const coAuthorsPayload = authors.map((a, idx) => ({
        id: a.id,
        name: a.name,
        email: a.email,
        university: a.university,
        isMain: a.isMain,
        isCorresponding: a.isCorresponding,
        order: idx,
      }));

      const res = await fetch(`/api/editor/articles/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          abstract: abstract.trim(),
          keywords: keywordsArray,
          articleType,
          journalId,
          volume: volume.trim() || null,
          issue: issue.trim() || null,
          pageStart: pageStart.trim() || null,
          pageEnd: pageEnd.trim() || null,
          status,
          language,
          isOpenAccess,
          isBestPaper,
          pdfUrl: finalPdfUrl || null,
          submissionDate: submissionDate || null,
          acceptanceDate: acceptanceDate || null,
          publicationDate: publicationDate || null,
          coAuthors: coAuthorsPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save changes.");

      toast.success("Article updated successfully!");
      router.push(`/editor/articles/${id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to save changes.");
    } finally {
      setIsSaving(false);
      setIsUploadingFile(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!article) return null;

  const isMotherAdmin = currentUser?.role === "mother_admin";

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <Link
            href={`/editor/articles/${id}`}
            className="inline-flex items-center px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
          >
            ← Back
          </Link>
        </div>

        {/* ── Dark Super Admin Header Card ─────────────────────── */}
        <div className="rounded-2xl overflow-hidden shadow-xl mb-6">
          <div className="bg-[#1a1f35] px-6 py-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-white font-bold text-lg leading-tight">
                    Super Admin Article Editor
                  </h1>
                  <p className="text-[#64ffda] text-xs font-semibold tracking-widest uppercase mt-0.5">
                    {isMotherAdmin ? "Mother Admin Exclusive Access" : "Admin Access"}
                  </p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            </div>

            {/* Article ID Row */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold mb-1">
                Target Article ID
              </p>
              <p className="text-white/80 text-sm font-mono">{article.id}</p>
            </div>
          </div>

          {/* DOI notice if present */}
          {article.doi && isMotherAdmin && (
            <div className="bg-amber-50 border-b border-amber-200 px-5 py-3 flex items-start gap-2 text-sm text-amber-800">
              <span className="mt-0.5">⚠️</span>
              <span>
                This article has DOI <strong>{article.doi}</strong> assigned. You are editing as Mother
                Admin — changes will be reflected immediately.
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* ── Basic Information ───────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">
              Basic Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Abstract</label>
                <textarea
                  required
                  rows={7}
                  value={abstract}
                  onChange={(e) => setAbstract(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition resize-y"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Keywords{" "}
                  <span className="text-gray-400 font-normal">(Comma separated)</span>
                </label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition"
                  placeholder="keyword1, keyword2, ..."
                />
              </div>
            </div>
          </div>

          {/* ── Authors & Affiliations ──────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Authors & Affiliations
                </h2>
              </div>
              <button
                type="button"
                onClick={handleAddAuthor}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/5 transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Author
              </button>
            </div>

            <div className="space-y-5">
              {authors.map((author, idx) => (
                <div key={idx} className={`border rounded-xl p-4 transition ${author.isMain ? "border-blue-200 bg-blue-50/30" : "border-gray-100 bg-gray-50/50"}`}>
                  {/* Author header row */}
                  <div className="flex items-center justify-between mb-3">
                    {/* Left: number + badge + set-as-main */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        Author {idx + 1}
                      </span>
                      {author.isMain ? (
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-wide">
                          Main Author
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetMainAuthor(idx)}
                          title="Set as main author"
                          className="text-[10px] font-semibold text-gray-400 border border-gray-200 px-2 py-0.5 rounded-full uppercase tracking-wide hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition"
                        >
                          Set as Main
                        </button>
                      )}
                    </div>

                    {/* Right: reorder + corresponding + delete */}
                    <div className="flex items-center gap-2">
                      {/* Up / Down arrows */}
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleMoveAuthor(idx, "up")}
                          disabled={idx === 0}
                          title="Move up"
                          className="h-4 w-5 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed transition"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveAuthor(idx, "down")}
                          disabled={idx === authors.length - 1}
                          title="Move down"
                          className="h-4 w-5 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed transition"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      <div className="w-px h-5 bg-gray-200" />

                      <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs font-medium text-gray-600">
                        <input
                          type="checkbox"
                          checked={author.isCorresponding}
                          onChange={(e) =>
                            handleAuthorChange(idx, "isCorresponding", e.target.checked)
                          }
                          className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        Corresponding Author
                      </label>

                      <div className="w-px h-5 bg-gray-200" />

                      <button
                        type="button"
                        onClick={() => handleRemoveAuthor(idx)}
                        className="text-red-400 hover:text-red-600 transition"
                        title="Remove author"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">
                        Full Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={author.name}
                        readOnly={author.isMain}
                        onChange={(e) => handleAuthorChange(idx, "name", e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition ${
                          author.isMain
                            ? "bg-gray-100 border-gray-200 text-gray-500 cursor-default"
                            : "border-gray-200 focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        }`}
                        placeholder="Full name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
                      <input
                        type="email"
                        value={author.email}
                        readOnly={author.isMain}
                        onChange={(e) => handleAuthorChange(idx, "email", e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition ${
                          author.isMain
                            ? "bg-gray-100 border-gray-200 text-gray-500 cursor-default"
                            : "border-gray-200 focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        }`}
                        placeholder="author@university.edu"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      Affiliation / University
                    </label>
                    <input
                      type="text"
                      value={author.university}
                      readOnly={author.isMain}
                      onChange={(e) => handleAuthorChange(idx, "university", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition ${
                        author.isMain
                          ? "bg-gray-100 border-gray-200 text-gray-500 cursor-default"
                          : "border-gray-200 focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      }`}
                      placeholder="e.g. Department of Computer Science, MIT, Cambridge, MA, USA"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Publication Details ─────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">
              Publication Details
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">DOI</label>
                  <input
                    type="text"
                    value={doi}
                    readOnly
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-default"
                    placeholder="Not assigned"
                  />
                  <p className="text-xs text-gray-400 mt-1">Use the inline pencil on the detail page to edit.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Article Type</label>
                  <select
                    value={articleType}
                    onChange={(e) => setArticleType(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none bg-white transition"
                  >
                    {ARTICLE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Volume</label>
                  <input
                    type="number"
                    min="1"
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition"
                    placeholder="e.g. 1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Issue</label>
                  <input
                    type="number"
                    min="1"
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition"
                    placeholder="e.g. 2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Page Start</label>
                  <input
                    type="number"
                    min="1"
                    value={pageStart}
                    onChange={(e) => setPageStart(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition"
                    placeholder="e.g. 1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Page End</label>
                  <input
                    type="number"
                    min="1"
                    value={pageEnd}
                    onChange={(e) => setPageEnd(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition"
                    placeholder="e.g. 12"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Language</label>
                  <input
                    type="text"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition"
                    placeholder="en"
                    maxLength={10}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none bg-white transition"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ── Dates + Flags ───────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">
            {/* Dates */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Dates</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Submission Date
                  </label>
                  <input
                    type="date"
                    value={submissionDate}
                    onChange={(e) => setSubmissionDate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Acceptance Date
                  </label>
                  <input
                    type="date"
                    value={acceptanceDate}
                    onChange={(e) => setAcceptanceDate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Publication Date
                  </label>
                  <input
                    type="date"
                    value={publicationDate}
                    onChange={(e) => setPublicationDate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* Flags */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Flags</h2>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer select-none group">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${isBestPaper ? "bg-primary border-primary" : "border-gray-300 group-hover:border-primary/50"}`}>
                    {isBestPaper && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <input
                    type="checkbox"
                    checked={isBestPaper}
                    onChange={(e) => setIsBestPaper(e.target.checked)}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium text-gray-700">Is Best Paper</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer select-none group">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${isOpenAccess ? "bg-primary border-primary" : "border-gray-300 group-hover:border-primary/50"}`}>
                    {isOpenAccess && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <input
                    type="checkbox"
                    checked={isOpenAccess}
                    onChange={(e) => setIsOpenAccess(e.target.checked)}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium text-gray-700">Is Open Access</span>
                </label>
              </div>
            </div>
          </div>

          {/* ── Files ──────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Files (Optional)
              </h2>
              {pdfUrl && (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/5 transition"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View Current PDF
                </a>
              )}
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Upload a new PDF or DOCX to replace the existing ones. Leave blank to keep current files.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {/* PDF Upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">
                  New PDF File
                </label>
                <div
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition ${
                    newPdfFile ? "border-primary bg-primary/5" : "border-gray-200 hover:border-primary/40"
                  }`}
                  onClick={() => pdfInputRef.current?.click()}
                >
                  <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  {newPdfFile ? (
                    <p className="text-xs text-primary font-medium truncate px-2">{newPdfFile.name}</p>
                  ) : (
                    <p className="text-xs text-gray-400">Choose PDF</p>
                  )}
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={(e) => setNewPdfFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              {/* DOCX Upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">
                  New Manuscript (DOCX)
                </label>
                <div
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition ${
                    newDocxFile ? "border-primary bg-primary/5" : "border-gray-200 hover:border-primary/40"
                  }`}
                  onClick={() => docxInputRef.current?.click()}
                >
                  <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {newDocxFile ? (
                    <p className="text-xs text-primary font-medium truncate px-2">{newDocxFile.name}</p>
                  ) : (
                    <p className="text-xs text-gray-400">Choose Word Doc</p>
                  )}
                  <input
                    ref={docxInputRef}
                    type="file"
                    accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={(e) => setNewDocxFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Save Button ─────────────────────────────────────── */}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-4 bg-[#2a7a4b] hover:bg-[#235f3a] text-white rounded-2xl font-bold text-base shadow-lg transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                {isUploadingFile ? "Uploading files…" : "Saving…"}
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save All Changes
              </>
            )}
          </button>

          {/* Footer note */}
          <p className="text-center text-[10px] text-gray-400 uppercase tracking-widest pb-4">
            © Internal Platform Tool — Strictly Restricted Access
          </p>
        </form>
      </div>
    </div>
  );
}
