"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HeartIcon as HeartIconOutline } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

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
        hardCoverPrice?: string | null;
        paperBookPrice?: string | null;
        dimensions?: string | null;
        weight?: string | null;
        doi?: string | null;
        keyFeatures?: string[];
        createdAt: string;
        updatedAt: string;
        chapters: any[];
    };
}

export default function BookClient({ book }: BookClientProps) {
    const router = useRouter();
    const [showPreview, setShowPreview] = useState(false);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [isPurchased, setIsPurchased] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe');

    const handleStripeOrder = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error("Please login to purchase");
            router.push('/login');
            return;
        }

        try {
            // Note: Reuse the create-order endpoint if checks out for both, or specific endpoint
            // BUT for Stripe we use checkout session
            const res = await fetch('/api/payments/create-checkout-session', { // Need to verify if this endpoint supports books or if I need a new one. 
                // Wait, create-checkout-session in step 8023 is for memberships (tier, interval). 
                // I need a Book specific endpoint or generic one.
                // Step 8024 created create-apc-session. 
                // I probably need create-book-session.
                // Let's assume I will create it or use a generic one. 
                // For now I will point to a new endpoint I will create: `/api/payments/create-book-session`
            });
            // Actually, I should check if I can reuse `create-apc-session` or make a `create-payment-session`.
            // Let's create `create-book-session` later.

            const response = await fetch('/api/payments/create-book-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ bookId: book.id })
            });

            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                toast.error(data.error || 'Failed to start Stripe checkout');
            }
        } catch (error) {
            console.error(error);
            toast.error("Payment initiation failed");
        }
    };

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
        const token = localStorage.getItem('token');

        if (!token) {
            toast.error("Please login to use wishlist");
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
                body: JSON.stringify({ action: 'wishlist', bookId: book.id })
            });
            const data = await res.json();

            if (data.success) {
                setIsWishlisted(data.data.isWishlisted);
                toast.success(data.data.message);
                window.dispatchEvent(new Event('wishlistUpdated'));
            } else {
                toast.error(data.error?.message || "Failed");
            }
        } catch (error) {
            console.error("Wishlist error:", error);
            toast.error("Failed to update wishlist");
        }
    };

    const createOrder = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error("Please login to purchase");
            router.push('/login');
            throw new Error("Login required");
        }

        try {
            const response = await fetch('/api/payments/paypal/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    type: 'book',
                    itemId: book.id
                })
            });

            const orderData = await response.json();

            if (orderData.id) {
                return orderData.id;
            } else {
                const errorDetail = orderData?.details?.[0];
                const errorMessage = errorDetail
                    ? `${errorDetail.issue} ${errorDetail.description} (${orderData.debug_id})`
                    : JSON.stringify(orderData);
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error("Create Order Error:", error);
            toast.error("Could not initiate payment");
            throw error;
        }
    };

    const onApprove = async (data: any) => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('/api/payments/paypal/capture-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    orderID: data.orderID
                })
            });

            const transaction = await response.json();

            if (transaction.status === 'COMPLETED') {
                setIsPurchased(true);
                toast.success("Purchase successful! You can now read the full book.");
            } else {
                toast.error("Payment not completed.");
            }
        } catch (error) {
            console.error("Capture Error:", error);
            toast.error("Payment failed to capture.");
        }
    };

    // Find the first free chapter for the preview modal — serve via API route
    const freeChapter = book.chapters?.find(c => c.pdfUrl != null);
    const pdfToDisplay = freeChapter
        ? `/api/books/pdf?chapterId=${freeChapter.id}`
        : null;

    return (
        <PayPalScriptProvider options={{
            clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test",
            components: "buttons",
            currency: "USD"
        }}>
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
                                        src={book.coverImageUrl.startsWith('http') ? book.coverImageUrl : `https://c5k.com/public/backend/books/${book.coverImageUrl.replace(/^\//, '')}`}
                                        alt={book.title}
                                        className="w-full aspect-[2/3] object-cover rounded-lg mb-6 shadow-sm"
                                    />
                                ) : (
                                    <div className="w-full aspect-[2/3] bg-gradient-to-br from-primary to-blue-800 rounded-lg mb-6 flex items-center justify-center text-white font-bold text-center p-6 shadow-sm">
                                        <div className="text-sm leading-tight">{book.title}</div>
                                    </div>
                                )}

                                {/* Price */}
                                <div className="mb-6 space-y-2">
                                    <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                        <span className="text-sm text-gray-500">E-Book (PDF)</span>
                                        <span className="font-bold text-primary text-lg">{book.price}</span>
                                    </div>
                                    {book.hardCoverPrice && (
                                        <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                            <span className="text-sm text-gray-500">Hard Cover</span>
                                            <span className="font-semibold text-gray-800">{book.hardCoverPrice}</span>
                                        </div>
                                    )}
                                    {book.paperBookPrice && (
                                        <div className="flex justify-between items-center py-1.5">
                                            <span className="text-sm text-gray-500">Paper Book</span>
                                            <span className="font-semibold text-gray-800">{book.paperBookPrice}</span>
                                        </div>
                                    )}
                                </div>

                                {!isPurchased && (
                                    <div className="flex justify-center mb-4">
                                        <div className="bg-gray-100 p-1 rounded-lg inline-flex">
                                            <button
                                                onClick={() => setPaymentMethod('stripe')}
                                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${paymentMethod === 'stripe' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'
                                                    }`}
                                            >
                                                Card
                                            </button>
                                            <button
                                                onClick={() => setPaymentMethod('paypal')}
                                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${paymentMethod === 'paypal' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-900'
                                                    }`}
                                            >
                                                PayPal
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="space-y-3 mb-6">
                                    {!isPurchased ? (
                                        <div className="w-full">
                                            {paymentMethod === 'stripe' ? (
                                                <button
                                                    onClick={handleStripeOrder}
                                                    className="w-full bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-bold transition-colors shadow-md"
                                                >
                                                    Buy Now
                                                </button>
                                            ) : (
                                                <PayPalButtons
                                                    style={{ layout: "vertical" }}
                                                    createOrder={createOrder}
                                                    onApprove={onApprove}
                                                />
                                            )}
                                        </div>
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
                                    {book.dimensions && (
                                        <div>
                                            <p className="text-sm text-gray-600">Dimensions</p>
                                            <p className="font-semibold text-gray-800">{book.dimensions}</p>
                                        </div>
                                    )}
                                    {book.weight && (
                                        <div>
                                            <p className="text-sm text-gray-600">Weight</p>
                                            <p className="font-semibold text-gray-800">{book.weight}</p>
                                        </div>
                                    )}
                                    {book.doi && (
                                        <div>
                                            <p className="text-sm text-gray-600">DOI</p>
                                            <a href={book.doi} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline break-all text-sm">{book.doi}</a>
                                        </div>
                                    )}
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

                                {/* Key Features */}
                                {book.keyFeatures && book.keyFeatures.length > 0 && (
                                    <div className="mb-8">
                                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Key Features</h2>
                                        <ul className="space-y-2">
                                            {book.keyFeatures.map((feature: string, index: number) => (
                                                <li key={index} className="flex items-start gap-2 text-gray-700">
                                                    <span className="text-primary font-bold mt-0.5">•</span>
                                                    <span>{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Table of Contents */}
                                <div className="mb-8">
                                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Table of Contents</h2>
                                    <div className="bg-gray-50 rounded-lg p-6">
                                        <div className="space-y-4">
                                            {book.chapters && book.chapters.length > 0 ? (
                                                book.chapters.map((chapter: any, idx: number) => (
                                                    <div key={chapter.id} className="flex flex-col py-3 border-b border-gray-200 last:border-0">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <div className="flex flex-col">
                                                                <span className="text-primary font-bold uppercase text-sm mb-1">{chapter.title}</span>
                                                            </div>
                                                            {chapter.pdfUrl ? (
                                                                <span className="text-green-600 font-bold text-[10px] bg-green-100 px-2 py-0.5 rounded shadow-sm">FREE</span>
                                                            ) : (
                                                                <span className="text-red-500 font-bold text-[10px] bg-red-100 px-2 py-0.5 rounded shadow-sm">PREMIUM</span>
                                                            )}
                                                        </div>
                                                        
                                                        {chapter.pdfUrl && (
                                                            <div className="flex gap-4 mt-2">
                                                                <a href={chapter.pdfUrl} target="_blank" className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-semibold transition-colors">
                                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                                                    View PDF (Sample)
                                                                </a>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-gray-500 italic">No chapters available.</div>
                                            )}
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
                            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-gray-800">
                                    {isPurchased ? "Full Book" : `Preview — ${freeChapter?.title ?? 'Chapter'} (10 pages)`}
                                </h3>
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="p-0">
                                {pdfToDisplay ? (
                                    <div className="w-full" style={{height: '75vh'}}>
                                        <object
                                            data={pdfToDisplay}
                                            type="application/pdf"
                                            width="100%"
                                            height="100%"
                                            style={{display: 'block', border: 'none'}}
                                        >
                                            <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500 p-8">
                                                <p>Your browser cannot display the PDF inline.</p>
                                                <a
                                                    href={pdfToDisplay}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90"
                                                >
                                                    Open PDF in New Tab
                                                </a>
                                            </div>
                                        </object>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-500">
                                        No preview PDF available.
                                    </div>
                                )}

                            </div>
                            {!isPurchased && (
                                <div className="border-t border-blue-100 bg-blue-50 px-6 py-4 text-center rounded-b-lg">
                                    <p className="text-gray-700 text-sm font-medium">
                                        📖 This is a sample preview. Purchase to access the full {book.pages}-page book.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </PayPalScriptProvider>
    );
}
