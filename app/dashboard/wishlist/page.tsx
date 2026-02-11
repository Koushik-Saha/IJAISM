
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HeartIcon } from "@heroicons/react/24/solid";

export default function WishlistPage() {
    const router = useRouter();
    const [wishlist, setWishlist] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        fetchWishlist(token);
    };

    const fetchWishlist = async (token: string) => {
        try {
            const res = await fetch('/api/dashboard/wishlist', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setWishlist(data.data?.wishlist || []);
            }
        } catch (error) {
            console.error("Failed to fetch wishlist", error);
        } finally {
            setIsLoading(false);
        }
    };

    const removeFromWishlist = async (bookId: string) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch('/api/books/interact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ action: 'wishlist', bookId })
            });

            if (res.ok) {
                const data = await res.json();
                if (!data.data.isWishlisted) {
                    setWishlist(prev => prev.filter(item => item.bookId !== bookId));
                    toast.success("Removed from wishlist");
                }
            }
        } catch (error) {
            toast.error("Failed to remove");
        }
    };

    if (isLoading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-3 mb-8">
                    <HeartIcon className="w-8 h-8 text-red-500" />
                    <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
                </div>

                {wishlist.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                        <h3 className="text-xl font-medium text-gray-900 mb-2">Your wishlist is empty</h3>
                        <p className="text-gray-500 mb-6">Explore our collection and save books for later.</p>
                        <Link href="/books" className="btn-primary">
                            Browse Books
                        </Link>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {wishlist.map((item) => (
                            <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                                <div className="flex h-48">
                                    <div className="w-1/3 bg-gray-200">
                                        {item.book.coverImageUrl ? (
                                            <img src={item.book.coverImageUrl} alt={item.book.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-primary flex items-center justify-center text-white p-2 text-xs text-center">
                                                {item.book.title}
                                            </div>
                                        )}
                                    </div>
                                    <div className="w-2/3 p-4 flex flex-col justify-between">
                                        <div>
                                            <Link href={`/books/${item.bookId}`} className="block">
                                                <h3 className="font-bold text-lg text-primary line-clamp-2 hover:underline">{item.book.title}</h3>
                                            </Link>
                                            <p className="text-sm text-gray-600 mt-1 line-clamp-1">{item.book.authors.join(', ')}</p>
                                            <p className="text-sm font-semibold text-accent mt-2">{item.book.price}</p>
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            <Link href={`/books/${item.bookId}`} className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded hover:bg-primary/20 transition-colors">
                                                View
                                            </Link>
                                            <button
                                                onClick={() => removeFromWishlist(item.bookId)}
                                                className="text-xs text-red-600 hover:text-red-800 px-2 py-1.5"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
