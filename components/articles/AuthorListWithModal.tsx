"use client";

import { useState } from "react";
import Link from "next/link";

interface Author {
    id: string | null;
    name: string;
    affiliation: string | null;
    email: string | null;
    isMain: boolean;
}

interface AuthorListWithModalProps {
    authors: Author[];
}

export default function AuthorListWithModal({ authors }: AuthorListWithModalProps) {
    const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);

    return (
        <div>
            <div className="flex flex-wrap gap-x-1 gap-y-1 text-[15px] leading-relaxed">
                {authors.map((author, idx) => (
                    <span key={idx} className="inline-flex items-center">
                        {author.id ? (
                            <Link 
                                href={`/author/${author.id}`}
                                className="text-[#007398] hover:underline cursor-pointer decoration-1 underline-offset-2"
                            >
                                {author.name}
                                {author.isMain && <span className="ml-1 text-[10px] align-top text-blue-600 font-bold">*</span>}
                            </Link>
                        ) : (
                            <span 
                                className="text-[#007398] hover:underline cursor-pointer decoration-1 underline-offset-2"
                                onClick={() => setSelectedAuthor(author)}
                            >
                                {author.name}
                            </span>
                        )}
                        {idx < authors.length - 1 && <span className="text-gray-400 mr-1">,</span>}
                    </span>
                ))}
            </div>

            {selectedAuthor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedAuthor(null)}>
                    <div 
                        className="bg-white rounded-lg shadow-xl max-w-md w-full relative overflow-hidden animate-in fade-in zoom-in-95 duration-200" 
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/80">
                            <h3 className="font-semibold text-gray-900">Author Information</h3>
                            <button 
                                onClick={() => setSelectedAuthor(null)}
                                className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 hover:bg-gray-200"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="text-xl font-bold font-serif text-gray-900 mb-1">{selectedAuthor.name}</div>
                            {selectedAuthor.isMain && (
                                <div className="text-xs font-medium text-blue-600 bg-blue-50 inline-block px-2 py-0.5 rounded mb-4">Corresponding Author</div>
                            )}
                            
                            <div className="mt-4 space-y-4">
                                {selectedAuthor.affiliation && (
                                    <div>
                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Affiliation</div>
                                        <div className="text-sm text-gray-800 leading-relaxed">{selectedAuthor.affiliation}</div>
                                    </div>
                                )}
                                
                                {selectedAuthor.email && (
                                    <div>
                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Contact</div>
                                        <a href={`mailto:${selectedAuthor.email}`} className="text-sm text-[#007398] hover:underline">
                                            {selectedAuthor.email}
                                        </a>
                                    </div>
                                )}

                                {!selectedAuthor.affiliation && !selectedAuthor.email && (
                                    <div className="text-sm text-gray-500 italic">No additional information provided.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
