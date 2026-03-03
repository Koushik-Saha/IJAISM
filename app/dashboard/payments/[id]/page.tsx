'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { loadStripe } from '@stripe/stripe-js';
import { toast } from "sonner";
import { track } from "@vercel/analytics";
import Card from '@/components/ui/Card';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function PaymentPage() {
    const router = useRouter();
    const params = useParams();
    const articleId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [article, setArticle] = useState<any>(null);
    const [apcFee, setApcFee] = useState<number>(500);
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | null>(null);

    useEffect(() => {
        if (articleId) {
            fetchData();
        }
    }, [articleId]);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }

            // 1. Fetch Article Details
            const resArticle = await fetch(`/api/articles/${articleId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!resArticle.ok) throw new Error('Failed to load article');
            const articleData = await resArticle.json();
            setArticle(articleData);

            // 2. Fetch Current APC Fee
            const resSettings = await fetch('/api/admin/settings', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (resSettings.ok) {
                const settingsData = await resSettings.json();
                if (settingsData.settings?.apc_fee) {
                    setApcFee(settingsData.settings.apc_fee);
                }
            }

        } catch (error) {
            console.error(error);
            toast.error('Error loading payment details');
        } finally {
            setLoading(false);
        }
    };

    const handleStripeCheckout = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/payments/create-apc-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ articleId })
            });

            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                toast.error(data.error || 'Failed to start Stripe checkout');
            }
        } catch (error) {
            console.error(error);
            toast.error('An error occurred');
        }
    };

    const createPaypalOrder = async () => {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("Authentication required");

        try {
            const response = await fetch('/api/payments/paypal/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    type: 'apc',
                    itemId: articleId
                })
            });

            const orderData = await response.json();
            if (orderData.id) return orderData.id;
            throw new Error(orderData.error || "Order creation failed");
        } catch (err) {
            console.error(err);
            toast.error("Failed to initiate APC payment");
            throw err;
        }
    };

    const onPaypalApprove = async (data: any) => {
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

            const result = await response.json();
            if (result.status === 'COMPLETED') {
                track('Successful Payment', { method: 'paypal', articleId });
                toast.success("Payment Successful!");
                router.push('/dashboard/submissions?success=true');
            } else {
                toast.error("Payment not completed");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to capture payment");
        }
    };

    if (loading) return <div className="p-8 text-center">Loading payment details...</div>;
    if (!article) return <div className="p-8 text-center text-red-600">Article not found</div>;

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900">Complete Your Submission</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Secure processing for Article Processing Charge
                    </p>
                </div>

                <Card>
                    <div className="p-4">
                        <div className="mb-6 border-b border-gray-100 pb-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-2">{article.title}</h2>
                            <p className="text-sm text-gray-500">{article.journal?.name}</p>
                            <div className="mt-4 flex justify-between items-center bg-blue-50 p-3 rounded-lg">
                                <span className="font-medium text-blue-900">Total Fee:</span>
                                <span className="text-xl font-bold text-blue-900">${apcFee.toFixed(2)}</span>
                            </div>
                        </div>

                        <h3 className="text-sm font-medium text-gray-700 mb-3">Select Payment Method</h3>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <button
                                onClick={() => setPaymentMethod('card')}
                                className={`p-3 border rounded-lg flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'card'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                <span className="font-bold">Credit Card</span>
                                <span className="text-xs text-gray-500">Stripe Secure</span>
                            </button>

                            <button
                                onClick={() => setPaymentMethod('paypal')}
                                className={`p-3 border rounded-lg flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'paypal'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                <span className="font-bold">PayPal</span>
                                <span className="text-xs text-gray-500">Fast Checkout</span>
                            </button>
                        </div>

                        <div className="mt-6">
                            {paymentMethod === 'card' && (
                                <button
                                    onClick={handleStripeCheckout}
                                    className="w-full bg-slate-900 text-white py-3 px-4 rounded-lg font-bold hover:bg-slate-800 transition-colors shadow-lg"
                                >
                                    Pay ${apcFee} with Card
                                </button>
                            )}

                            {paymentMethod === 'paypal' && (
                                <div className="w-full">
                                    <PayPalScriptProvider options={{
                                        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test",
                                        components: "buttons",
                                        currency: "USD",
                                        intent: "capture"
                                    }}>
                                        <PayPalButtons
                                            style={{ layout: "vertical", shape: "rect" }}
                                            createOrder={createPaypalOrder}
                                            onApprove={onPaypalApprove}
                                            onError={(err) => {
                                                console.error(err);
                                                toast.error("PayPal Error. Please try again.");
                                            }}
                                        />
                                    </PayPalScriptProvider>
                                </div>
                            )}

                            {!paymentMethod && (
                                <div className="text-center text-sm text-gray-500 py-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                    Please select a payment method above to proceed.
                                </div>
                            )}
                        </div>

                        <div className="mt-6 text-center">
                            <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-900 underline">
                                Cancel and Return
                            </button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
