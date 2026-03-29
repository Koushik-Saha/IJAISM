"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";

interface InvitationData {
    reviewId: string;
    status: string;
    reviewerName: string;
    article: {
        title: string;
        abstract: string;
        journalName: string;
    };
}

export default function InvitationPage() {
    const params = useParams();
    const router = useRouter();
    const [invitation, setInvitation] = useState<InvitationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        const fetchInvitation = async () => {
            try {
                if (!params?.id) return;

                const response = await fetch(`/api/invitations/${params.id}`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Failed to fetch invitation details.");
                }

                setInvitation(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchInvitation();
    }, [params]);

    const handleAction = async (action: 'accept' | 'decline') => {
        setActionLoading(action);
        setError(null);

        try {
            const response = await fetch(`/api/invitations/${params.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Failed to ${action} invitation.`);
            }

            if (action === 'accept') {
                if (data.isNewReviewer && data.reviewerEmail) {
                    router.push(`/reviewer-setup?email=${encodeURIComponent(data.reviewerEmail)}`);
                } else {
                    router.push('/login?redirect=/dashboard/reviews');
                }
            } else {
                setSuccessMessage("You have successfully declined this review. Thank you for letting us know.");
                setInvitation(prev => prev ? { ...prev, status: 'declined' } : null);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="flex justify-center items-center gap-3 text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Loading invitation details...</span>
                </div>
            </div>
        );
    }

    if (error && !invitation) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
                        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Invitation Error</h2>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <Link href="/" className="text-blue-600 hover:underline">
                            Return to Homepage
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!invitation) return null;

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Invitation</h1>
                    <p className="text-lg text-gray-600">
                        {invitation.article.journalName}
                    </p>
                </div>

                {successMessage ? (
                    <div className="bg-white shadow sm:rounded-lg p-8 text-center">
                        <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You</h2>
                        <p className="text-gray-600 text-lg mb-6">{successMessage}</p>
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                            Return Home
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <div className="px-4 py-5 sm:px-6 bg-blue-50 border-b border-blue-100">
                            <h3 className="text-lg leading-6 font-medium text-blue-900">
                                Manuscript Details
                            </h3>
                            <p className="mt-1 max-w-2xl text-sm text-blue-700">
                                Dear {invitation.reviewerName}, you have been invited to review the following manuscript.
                            </p>
                        </div>

                        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <dt className="text-sm font-medium text-gray-500">Title</dt>
                                    <dd className="mt-1 text-base text-gray-900 font-semibold">{invitation.article.title}</dd>
                                </div>
                                <div className="sm:col-span-2">
                                    <dt className="text-sm font-medium text-gray-500">Abstract</dt>
                                    <dd className="mt-1 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                        {invitation.article.abstract}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        <div className="bg-gray-50 px-4 py-6 sm:px-6 border-t border-gray-200">
                            {invitation.status === 'invited' ? (
                                <div>
                                    {error && (
                                        <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-md text-sm whitespace-pre-wrap flex items-start gap-2">
                                            <AlertCircle className="w-5 h-5 shrink-0" />
                                            {error}
                                        </div>
                                    )}
                                    <h4 className="text-center font-medium text-gray-900 mb-6">Will you accept this review assignment?</h4>
                                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                                        <button
                                            onClick={() => handleAction('accept')}
                                            disabled={!!actionLoading}
                                            className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                                        >
                                            {actionLoading === 'accept' ? (
                                                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
                                            ) : (
                                                <><CheckCircle className="w-5 h-5 mr-2" /> Accept Review</>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleAction('decline')}
                                            disabled={!!actionLoading}
                                            className="inline-flex justify-center items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                        >
                                            {actionLoading === 'decline' ? (
                                                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
                                            ) : (
                                                <><XCircle className="w-5 h-5 mr-2" /> Decline</>
                                            )}
                                        </button>
                                    </div>
                                    <p className="mt-4 text-center text-xs text-gray-500">
                                        If you accept, you will be directed to log in to the review portal.
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                                        This invitation has already been {invitation.status}.
                                    </div>
                                    {invitation.status === 'accepted' && (
                                        <div className="mt-4">
                                            <Link href="/dashboard/reviews" className="text-blue-600 hover:text-blue-800 font-medium">
                                                Go to your Reviewer Dashboard &rarr;
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
