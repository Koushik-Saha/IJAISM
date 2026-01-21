"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface BookClientProps {
    book: {
        id: string;
        title: string;
        authors: string[];
        year: number;
        isbn: string;
        pages: number;
        field: string;
        description: string;
        fullDescription: string;
        price: string;
        publisher: string;
        language: string;
        edition: string;
        format: string;
        coverImageUrl?: string | null;
        tableOfContents: any[];
        previewPages: any[];
        reviews: any[];
        relatedTopics: string[];
    };
}

export default function BookClient({ book }: BookClientProps) {
    const router = useRouter();
    const [showPreview, setShowPreview] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Breadcrumb */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center text-sm text-gray-600">
                        <Link href="/" className="hover:text-primary">Home</Link>
                        <span className="mx-2">/</span>
                        <Link href="/books" className="hover:text-primary">Books</Link>
                        <span className="mx-2">/</span>
                        <span className="text-gray-900 truncate">{book.title}</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Book Cover and Details */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                            {/* Book Cover */}
                            {book.coverImageUrl ? (
                                <img
                                    src={book.coverImageUrl}
                                    alt={book.title}
                                    className="w-full aspect-[2/3] object-cover rounded-lg mb-6 shadow-sm"
                                />
                            ) : (
                                <div className="w-full aspect-[2/3] bg-gradient-to-br from-primary to-blue-800 rounded-lg mb-6 flex items-center justify-center text-white font-bold text-center p-6 shadow-sm">
                                    <div className="text-sm leading-tight">{book.title}</div>
                                </div>
                            )}

                            {/* Price */}
                            <div className="text-center mb-6">
                                <p className="text-4xl font-bold text-accent mb-2">{book.price}</p>
                                <p className="text-sm text-gray-600">{book.format}</p>
                            </div>

                            {/* Actions */}
                            <div className="space-y-3 mb-6">
                                <button
                                    onClick={() => alert("In production, this would add the book to cart and proceed to checkout.")}
                                    className="w-full bg-accent hover:bg-accent-dark text-white px-6 py-3 rounded-lg font-bold transition-colors"
                                >
                                    Purchase Book
                                </button>

                                <button
                                    onClick={() => setShowPreview(true)}
                                    className="w-full border-2 border-primary text-primary hover:bg-primary/10 px-6 py-3 rounded-lg font-bold transition-colors"
                                >
                                    Preview
                                </button>

                                <button
                                    onClick={() => alert("In production, this would add the book to your wishlist.")}
                                    className="w-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg font-bold transition-colors"
                                >
                                    Add to Wishlist
                                </button>
                            </div>

                            {/* Book Details */}
                            <div className="border-t border-gray-200 pt-6 space-y-3">
                                <div>
                                    <p className="text-sm text-gray-600">ISBN</p>
                                    <p className="font-semibold text-gray-800">{book.isbn}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Publisher</p>
                                    <p className="font-semibold text-gray-800">{book.publisher}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Year</p>
                                    <p className="font-semibold text-gray-800">{book.year}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Pages</p>
                                    <p className="font-semibold text-gray-800">{book.pages} pages</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Language</p>
                                    <p className="font-semibold text-gray-800">{book.language}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Edition</p>
                                    <p className="font-semibold text-gray-800">{book.edition}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Column */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-md p-8">
                            {/* Title and Authors */}
                            <div className="mb-6">
                                <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-4">
                                    {book.field}
                                </span>
                                <h1 className="text-4xl font-bold text-primary mb-4">
                                    {book.title}
                                </h1>
                                <p className="text-xl text-gray-700 mb-2">
                                    by {book.authors.join(", ")}
                                </p>
                            </div>

                            {/* Description */}
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-800 mb-4">About This Book</h2>
                                <div className="text-gray-700 leading-relaxed space-y-4">
                                    {book.fullDescription.split('\n\n').map((paragraph: string, index: number) => (
                                        <p key={index}>{paragraph.trim()}</p>
                                    ))}
                                </div>
                            </div>

                            {/* Table of Contents */}
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-800 mb-4">Table of Contents</h2>
                                <div className="bg-gray-50 rounded-lg p-6">
                                    <div className="space-y-2">
                                        {book.tableOfContents.map((item: any) => (
                                            <div key={item.chapter} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                                                <div className="flex items-center">
                                                    <span className="text-primary font-bold mr-3">Chapter {item.chapter}</span>
                                                    <span className="text-gray-800">{item.title}</span>
                                                </div>
                                                <span className="text-gray-600 text-sm">{item.pages}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Reviews */}
                            {book.reviews && book.reviews.length > 0 && (
                                <div className="mb-8">
                                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Reviews</h2>
                                    <div className="space-y-4">
                                        {book.reviews.map((review: any, index: number) => (
                                            <div key={index} className="bg-gray-50 rounded-lg p-6">
                                                <div className="flex items-center mb-2">
                                                    <div className="flex text-accent mr-2">
                                                        {[...Array(review.rating)].map((_, i) => (
                                                            <span key={i}>★</span>
                                                        ))}
                                                    </div>
                                                    <span className="font-semibold text-gray-800">{review.author}</span>
                                                </div>
                                                <p className="text-gray-700 italic">"{review.text}"</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Related Topics */}
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800 mb-4">Related Topics</h2>
                                <div className="flex flex-wrap gap-2">
                                    {book.relatedTopics.map((topic: string, index: number) => (
                                        <span
                                            key={index}
                                            className="inline-block bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm"
                                        >
                                            {topic}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Back Button */}
                <div className="mt-8">
                    <Link
                        href="/books"
                        className="inline-flex items-center text-primary hover:text-accent font-semibold"
                    >
                        ← Back to All Books
                    </Link>
                </div>
            </div>

            {/* Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
                            <h3 className="text-2xl font-bold text-gray-800">Book Preview</h3>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-8">
                            {book.previewPages.map((page: any, index: number) => (
                                <div key={index} className="mb-8">
                                    <div className="bg-gray-50 rounded-lg p-8">
                                        <div className="prose max-w-none">
                                            <pre className="whitespace-pre-wrap font-serif text-gray-800 leading-relaxed">
                                                {page.content}
                                            </pre>
                                        </div>
                                    </div>
                                    <p className="text-center text-sm text-gray-600 mt-4">
                                        Page {page.pageNumber} of {book.pages}
                                    </p>
                                </div>
                            ))}
                            <div className="text-center mt-8 p-6 bg-blue-50 rounded-lg">
                                <p className="text-gray-700 mb-4">
                                    This is a preview. Purchase the full book to read all {book.pages} pages.
                                </p>
                                <button
                                    onClick={() => {
                                        setShowPreview(false);
                                        alert("In production, this would proceed to checkout.");
                                    }}
                                    className="bg-accent hover:bg-accent-dark text-white px-8 py-3 rounded-lg font-bold transition-colors"
                                >
                                    Purchase Full Book - {book.price}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
