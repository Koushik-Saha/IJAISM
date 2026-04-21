"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Search, Upload, FileText, ArrowRight, CheckCircle2, RotateCcw, HelpCircle } from "lucide-react";

export default function DirectPdfUpdatePage() {
    const [articleId, setArticleId] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [foundArticle, setFoundArticle] = useState<any>(null);
    
    const [file, setFile] = useState<File | null>(null);
    const [docxFile, setDocxFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<any>(null);

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
            toast.success("Article found! Please verify the details below.");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            toast.error("Please select a new PDF file to upload.");
            return;
        }

        setIsSubmitting(true);

        try {
            const token = localStorage.getItem("token");
            const formData = new FormData();
            formData.append("articleId", foundArticle.id);
            formData.append("file", file);
            if (docxFile) {
                formData.append("docxFile", docxFile);
            }

            const response = await fetch("/api/editor/direct-pdf-update", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to update article");
            }

            toast.success("Article synchronized successfully! PDF replaced and HTML recreated from DOCX.");
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
    };

    return (
        <div className="min-h-screen bg-slate-50 py-16 px-4 font-sans text-slate-900">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
                    
                    {/* Header */}
                    <div className="bg-slate-900 p-8 text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary p-2.5 rounded-xl shadow-lg shadow-primary/20">
                                    <Upload className="h-6 w-6" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight">PDF Synchronizer</h1>
                                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mt-0.5">Mother Admin Mode</p>
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
                            /* Step 2: VERIFY & UPLOAD */
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                
                                {/* Article Details Card */}
                                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4">
                                        <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Target Article</span>
                                            <h3 className="font-bold text-slate-900 text-lg leading-tight line-clamp-2">{foundArticle.title}</h3>
                                        </div>
                                        <div className="flex flex-wrap gap-4 text-sm">
                                            <div>
                                                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-tighter">Author</span>
                                                <span className="text-slate-700 font-medium">{foundArticle.author?.name || "Unknown"}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-tighter">Journal</span>
                                                <span className="text-slate-700 font-medium">{foundArticle.journal?.fullName || "N/A"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-slate-400" />
                                                Step 2: Upload New PDF
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
                                                Step 3: Upload Manuscript (DOCX)
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

                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !file}
                                        className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 active:scale-[0.98] disabled:bg-slate-200 disabled:shadow-none"
                                    >
                                        {isSubmitting ? (
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
                                        ) : (
                                            <>
                                                Confirm & Synchronize
                                                <ArrowRight className="h-5 w-5" />
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
                                        <h4 className="font-bold text-emerald-900 leading-none mb-2 text-lg">System Synchronized</h4>
                                        <p className="text-emerald-700 text-sm mb-4">The PDF has been replaced and the HTML page has been recreated at the new endpoint.</p>
                                        <a 
                                            href={`/articles/${foundArticle.id}/html`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 py-2 px-4 bg-white border border-emerald-200 rounded-xl text-emerald-700 font-bold text-sm hover:bg-emerald-50 transition-colors"
                                        >
                                            View Full HTML View
                                            <ArrowRight className="h-4 w-4" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold">
                        Internal Platform Tool • Strictly Restricted Access
                    </p>
                </div>
            </div>
        </div>
    );
}
