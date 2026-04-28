"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Search, Upload, FileText, ArrowRight, CheckCircle2, RotateCcw, HelpCircle, Lock, Save } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DirectPdfUpdatePage() {
    const router = useRouter();
    const [isCheckingRole, setIsCheckingRole] = useState(true);
    const [isMotherAdmin, setIsMotherAdmin] = useState(false);

    const [articleId, setArticleId] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [foundArticle, setFoundArticle] = useState<any>(null);
    
    // Form States
    const [formData, setFormData] = useState<any>({});
    const [file, setFile] = useState<File | null>(null);
    const [docxFile, setDocxFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        const checkRole = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    setIsCheckingRole(false);
                    return;
                }
                const res = await fetch("/api/auth/me", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.user?.role === "mother_admin") {
                        setIsMotherAdmin(true);
                    }
                }
            } catch (err) {
                console.error("Auth check failed", err);
            } finally {
                setIsCheckingRole(false);
            }
        };
        checkRole();
    }, []);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!articleId.trim()) {
            toast.error("Please enter an Article UUID to search.");
            return;
        }

        setIsSearching(true);
        setFoundArticle(null);
        setResult(null);

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`/api/editor/articles?id=${articleId.trim()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Article not found");
            }

            setFoundArticle(data.article);
            
            // Populate form data
            setFormData({
                title: data.article.title || "",
                abstract: data.article.abstract || "",
                keywords: data.article.keywords?.join(", ") || "",
                articleType: data.article.articleType || "",
                doi: data.article.doi || "",
                volume: data.article.volume || "",
                issue: data.article.issue || "",
                pageStart: data.article.pageStart || "",
                pageEnd: data.article.pageEnd || "",
                language: data.article.language || "en",
                status: data.article.status || "draft",
                isBestPaper: data.article.isBestPaper || false,
                isOpenAccess: data.article.isOpenAccess || true,
                publicationDate: data.article.publicationDate ? new Date(data.article.publicationDate).toISOString().split('T')[0] : "",
                submissionDate: data.article.submissionDate ? new Date(data.article.submissionDate).toISOString().split('T')[0] : "",
                acceptanceDate: data.article.acceptanceDate ? new Date(data.article.acceptanceDate).toISOString().split('T')[0] : "",
            });

            toast.success("Article found! You can now edit its properties.");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSearching(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const token = localStorage.getItem("token");
            const submitData = new FormData();
            
            submitData.append("articleId", foundArticle.id);
            
            // Append all form data
            Object.keys(formData).forEach(key => {
                if (formData[key] !== "" && formData[key] !== null && formData[key] !== undefined) {
                    submitData.append(key, formData[key].toString());
                }
            });

            // Append files if they exist
            if (file) submitData.append("file", file);
            if (docxFile) submitData.append("docxFile", docxFile);

            const response = await fetch("/api/editor/direct-pdf-update", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: submitData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to update article");
            }

            toast.success("Article updated successfully!");
            setResult(data.data);
            setFile(null);
            setDocxFile(null);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const reset = () => {
        setFoundArticle(null);
        setArticleId("");
        setFile(null);
        setDocxFile(null);
        setResult(null);
        setFormData({});
    };

    if (isCheckingRole) {
        return <div className="min-h-screen flex items-center justify-center text-slate-500">Verifying access...</div>;
    }

    if (!isMotherAdmin) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-red-100">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
                    <p className="text-slate-500 mb-8">You do not have the required permissions to access the Super Admin Article Editor. This tool is strictly restricted to Mother Admins.</p>
                    <button onClick={() => router.push('/editor/dashboard')} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-colors">
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-16 px-4 font-sans text-slate-900">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
                    
                    {/* Header */}
                    <div className="bg-slate-900 p-8 text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary p-2.5 rounded-xl shadow-lg shadow-primary/20">
                                    <FileText className="h-6 w-6" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight">Super Admin Article Editor</h1>
                                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mt-0.5">Mother Admin Exclusive Access</p>
                                </div>
                            </div>
                            {foundArticle && (
                                <button 
                                    onClick={reset}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors group"
                                    title="Search New Article"
                                >
                                    <RotateCcw className="h-5 w-5 text-slate-400 group-hover:text-white" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="p-8">
                        {!foundArticle ? (
                            /* Step 1: SEARCH */
                            <form onSubmit={handleSearch} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <Search className="h-4 w-4 text-slate-400" />
                                        Step 1: Locate Article
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={articleId}
                                            onChange={(e) => setArticleId(e.target.value)}
                                            placeholder="Paste Article UUID here..."
                                            className="block w-full pl-4 pr-12 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none text-lg bg-slate-50/50"
                                            required
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                                            <HelpCircle className="h-5 w-5" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 pl-1">Enter the 36-character ID found in the database or admin table.</p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSearching}
                                    className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-slate-900 text-white font-bold hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-[0.98] disabled:bg-slate-300"
                                >
                                    {isSearching ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
                                    ) : (
                                        <>
                                            Find Article
                                            <ArrowRight className="h-5 w-5" />
                                        </>
                                    )}
                                </button>
                            </form>
                        ) : (
                            /* Step 2: VERIFY & UPDATE */
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                
                                {/* Article Details Card */}
                                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4">
                                        <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Target Article ID</span>
                                            <h3 className="font-mono text-slate-700 text-sm">{foundArticle.id}</h3>
                                        </div>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-8">
                                    
                                    {/* SECTION: BASIC INFO */}
                                    <div className="space-y-4 bg-white p-6 rounded-2xl border border-slate-200">
                                        <h3 className="text-lg font-bold text-slate-900 border-b pb-2 mb-4">Basic Information</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1">Title</label>
                                                <input type="text" name="title" value={formData.title} onChange={handleInputChange} className="w-full p-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" required />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1">Abstract</label>
                                                <textarea name="abstract" value={formData.abstract} onChange={handleInputChange} rows={6} className="w-full p-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" required />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1">Keywords (Comma separated)</label>
                                                <input type="text" name="keywords" value={formData.keywords} onChange={handleInputChange} className="w-full p-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* SECTION: METADATA */}
                                    <div className="space-y-4 bg-white p-6 rounded-2xl border border-slate-200">
                                        <h3 className="text-lg font-bold text-slate-900 border-b pb-2 mb-4">Publication Details</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1">DOI</label>
                                                <input type="text" name="doi" value={formData.doi} onChange={handleInputChange} className="w-full p-3 rounded-xl border border-slate-200 focus:border-primary outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1">Article Type</label>
                                                <input type="text" name="articleType" value={formData.articleType} onChange={handleInputChange} className="w-full p-3 rounded-xl border border-slate-200 focus:border-primary outline-none" required />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1">Volume</label>
                                                <input type="number" name="volume" value={formData.volume} onChange={handleInputChange} className="w-full p-3 rounded-xl border border-slate-200 focus:border-primary outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1">Issue</label>
                                                <input type="number" name="issue" value={formData.issue} onChange={handleInputChange} className="w-full p-3 rounded-xl border border-slate-200 focus:border-primary outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1">Page Start</label>
                                                <input type="number" name="pageStart" value={formData.pageStart} onChange={handleInputChange} className="w-full p-3 rounded-xl border border-slate-200 focus:border-primary outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1">Page End</label>
                                                <input type="number" name="pageEnd" value={formData.pageEnd} onChange={handleInputChange} className="w-full p-3 rounded-xl border border-slate-200 focus:border-primary outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1">Language</label>
                                                <input type="text" name="language" value={formData.language} onChange={handleInputChange} className="w-full p-3 rounded-xl border border-slate-200 focus:border-primary outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                                                <select name="status" value={formData.status} onChange={handleInputChange} className="w-full p-3 rounded-xl border border-slate-200 focus:border-primary outline-none bg-white">
                                                    <option value="draft">Draft</option>
                                                    <option value="under_review">Under Review</option>
                                                    <option value="accepted">Accepted</option>
                                                    <option value="published">Published</option>
                                                    <option value="rejected">Rejected</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* SECTION: DATES & TOGGLES */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4 bg-white p-6 rounded-2xl border border-slate-200">
                                            <h3 className="text-lg font-bold text-slate-900 border-b pb-2 mb-4">Dates</h3>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1">Submission Date</label>
                                                <input type="date" name="submissionDate" value={formData.submissionDate} onChange={handleInputChange} className="w-full p-3 rounded-xl border border-slate-200 focus:border-primary outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1">Acceptance Date</label>
                                                <input type="date" name="acceptanceDate" value={formData.acceptanceDate} onChange={handleInputChange} className="w-full p-3 rounded-xl border border-slate-200 focus:border-primary outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1">Publication Date</label>
                                                <input type="date" name="publicationDate" value={formData.publicationDate} onChange={handleInputChange} className="w-full p-3 rounded-xl border border-slate-200 focus:border-primary outline-none" />
                                            </div>
                                        </div>

                                        <div className="space-y-4 bg-white p-6 rounded-2xl border border-slate-200">
                                            <h3 className="text-lg font-bold text-slate-900 border-b pb-2 mb-4">Flags</h3>
                                            <label className="flex items-center gap-3 p-3 border rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                                                <input type="checkbox" name="isBestPaper" checked={formData.isBestPaper} onChange={handleInputChange} className="w-5 h-5 text-primary rounded focus:ring-primary" />
                                                <span className="font-semibold text-slate-700">Is Best Paper</span>
                                            </label>
                                            <label className="flex items-center gap-3 p-3 border rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                                                <input type="checkbox" name="isOpenAccess" checked={formData.isOpenAccess} onChange={handleInputChange} className="w-5 h-5 text-primary rounded focus:ring-primary" />
                                                <span className="font-semibold text-slate-700">Is Open Access</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* SECTION: FILES (OPTIONAL) */}
                                    <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                        <div className="flex items-center justify-between border-b pb-2 mb-4">
                                            <h3 className="text-lg font-bold text-slate-900">Files (Optional)</h3>
                                            {foundArticle.pdfUrl && (
                                                <a href={foundArticle.pdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors bg-primary/10 px-3 py-1.5 rounded-lg">
                                                    <FileText className="w-4 h-4" />
                                                    View Current PDF
                                                </a>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500 mb-4">Upload a new PDF or DOCX to replace the existing ones. Leave blank to keep current files.</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-slate-400" />
                                                    New PDF File
                                                </label>
                                                <div 
                                                    className={`relative group cursor-pointer border-2 border-dashed rounded-2xl p-6 transition-all text-center ${
                                                        file ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300 bg-white'
                                                    }`}
                                                >
                                                    <input
                                                        type="file"
                                                        accept=".pdf"
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                        onChange={(e) => {
                                                            setFile(e.target.files?.[0] || null);
                                                            setResult(null);
                                                        }}
                                                    />
                                                    <div className="space-y-2">
                                                        <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center transition-colors ${file ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                                                            <FileText className="h-6 w-6" />
                                                        </div>
                                                        <div className="text-sm font-bold text-slate-900 truncate px-2">
                                                            {file ? file.name : "Choose PDF"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                    <Upload className="h-4 w-4 text-emerald-400" />
                                                    New Manuscript (DOCX)
                                                </label>
                                                <div 
                                                    className={`relative group cursor-pointer border-2 border-dashed rounded-2xl p-6 transition-all text-center ${
                                                        docxFile ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300 bg-white'
                                                    }`}
                                                >
                                                    <input
                                                        type="file"
                                                        accept=".docx,.doc"
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                        onChange={(e) => {
                                                            setDocxFile(e.target.files?.[0] || null);
                                                            setResult(null);
                                                        }}
                                                    />
                                                    <div className="space-y-2">
                                                        <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center transition-colors ${docxFile ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                                                            <Upload className="h-6 w-6" />
                                                        </div>
                                                        <div className="text-sm font-bold text-slate-900 truncate px-2">
                                                            {docxFile ? docxFile.name : "Choose Word Doc"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 active:scale-[0.98] disabled:bg-slate-200 disabled:shadow-none text-lg mt-8"
                                    >
                                        {isSubmitting ? (
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
                                        ) : (
                                            <>
                                                <Save className="h-5 w-5" />
                                                Save All Changes
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        )}

                        {result && (
                            <div className="mt-8 bg-emerald-50 rounded-2xl p-6 border border-emerald-100 animate-in zoom-in-95 duration-300">
                                <div className="flex items-start gap-4">
                                    <div className="bg-emerald-500 text-white p-2 rounded-xl">
                                        <CheckCircle2 className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-emerald-900 leading-none mb-2 text-lg">Update Successful</h4>
                                        <p className="text-emerald-700 text-sm mb-4">The article details have been successfully saved.</p>
                                        <a 
                                            href={`/articles/${foundArticle.id}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 py-2 px-4 bg-white border border-emerald-200 rounded-xl text-emerald-700 font-bold text-sm hover:bg-emerald-50 transition-colors"
                                        >
                                            View Public Article Page
                                            <ArrowRight className="h-4 w-4" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold flex items-center justify-center gap-2">
                        <Lock className="w-3 h-3" />
                        Internal Platform Tool • Strictly Restricted Access
                    </p>
                </div>
            </div>
        </div>
    );
}
