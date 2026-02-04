"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HeartIcon as HeartIconOutline } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";

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
        createdAt: string;
        updatedAt: string;
    };
}

export default function BookClient({ book }: BookClientProps) {
    const router = useRouter();
    const [showPreview, setShowPreview] = useState(false);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [isPurchased, setIsPurchased] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkStatus();
    }, [book.id]);

    const checkStatus = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch(`/api/books/interact?bookId=${book.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setIsWishlisted(data.data.isWishlisted);
                setIsPurchased(data.data.isPurchased);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleWishlist = async () => {
        console.log("handleWishlist clicked");
        const token = localStorage.getItem('token');
        console.log("Token exists:", !!token);

        if (!token) {
            toast.error("Please login to use wishlist");
            router.push('/login');
            return;
        }

        try {
            console.log("Sending request to /api/books/interact");
            const res = await fetch('/api/books/interact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ action: 'wishlist', bookId: book.id })
            });
            console.log("Response status:", res.status);
            const data = await res.json();
            console.log("Response data:", data);

            if (data.success) {
                setIsWishlisted(data.data.isWishlisted);
                toast.success(data.data.message);
                // Trigger header update
                window.dispatchEvent(new Event('wishlistUpdated'));
            } else {
                toast.error(data.error?.message || "Failed");
            }
        } catch (error) {
            console.error("Wishlist error:", error);
            toast.error("Failed to update wishlist");
        }
    };

    const handlePurchase = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error("Please login to purchase");
            router.push('/login');
            return;
        }

        try {
            const res = await fetch('/api/books/interact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: 'purchase',
                    bookId: book.id,
                    price: book.price
                })
            });
            const data = await res.json();
            if (data.success) {
                setIsPurchased(true);
                toast.success("Purchase successful! You can now read the full book.");
            }
        } catch (error) {
            toast.error("Purchase failed");
        }
    };

    // Filter preview pages (Limit to 10 if not purchased)
    const displayPages = isPurchased
        ? book.previewPages // In real app, this would fetch full content
        : book.previewPages.slice(0, 10);

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
                                <p className="text-4xl font-bold text-accent mb-2">{isPurchased ? 'Owned' : book.price}</p>
                                <p className="text-sm text-gray-600">{book.format}</p>
                            </div>

                            {/* Actions */}
                            <div className="space-y-3 mb-6">
                                {!isPurchased ? (
                                    <button
                                        onClick={handlePurchase}
                                        className="w-full bg-accent hover:bg-accent-dark text-white px-6 py-3 rounded-lg font-bold transition-colors"
                                    >
                                        Purchase Book
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setShowPreview(true)}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold transition-colors"
                                    >
                                        Read Full Book
                                    </button>
                                )}

                                {!isPurchased && (
                                    <button
                                        onClick={() => setShowPreview(true)}
                                        className="w-full border-2 border-primary text-primary hover:bg-primary/10 px-6 py-3 rounded-lg font-bold transition-colors"
                                    >
                                        Preview
                                    </button>
                                )}

                                <button
                                    onClick={handleWishlist}
                                    className={`w-full border-2 ${isWishlisted ? 'border-red-500 text-red-500 bg-red-50' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} px-6 py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2`}
                                >
                                    {isWishlisted ? (
                                        <>
                                            <HeartIconSolid className="w-5 h-5" />
                                            Wishlist
                                        </>
                                    ) : (
                                        <>
                                            <HeartIconOutline className="w-5 h-5" />
                                            Add to Wishlist
                                        </>
                                    )}
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
                            <h3 className="text-2xl font-bold text-gray-800">
                                {isPurchased ? "Full Book Reader" : "Book Preview (10 Pages)"}
                            </h3>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-8">
                            {displayPages.length > 0 ? (
                                displayPages.map((page: any, index: number) => (
                                    <div key={index} className="mb-8">
                                        <div className="bg-gray-50 rounded-lg p-8 shadow-inner min-h-[600px]">
                                            <div className="prose max-w-none">
                                                <pre className="whitespace-pre-wrap font-serif text-gray-800 leading-relaxed">
                                                    {page.content || "Page content not available."}
                                                </pre>
                                            </div>
                                        </div>
                                        <p className="text-center text-sm text-gray-600 mt-4">
                                            Page {page.pageNumber || index + 1} of {book.pages}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    No preview pages available.
                                </div>
                            )}

                            {!isPurchased && (
                                <div className="text-center mt-8 p-6 bg-blue-50 rounded-lg border border-blue-100">
                                    <p className="text-gray-700 mb-4 font-medium">
                                        This is a preview. Purchase the full book to read all {book.pages} pages.
                                    </p>
                                    <button
                                        onClick={() => {
                                            setShowPreview(false);
                                            handlePurchase();
                                        }}
                                        className="bg-accent hover:bg-accent-dark text-white px-8 py-3 rounded-lg font-bold transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                    >
                                        Purchase Full Book - {book.price}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
