"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { toast } from "sonner";
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function MembershipPage() {
  const router = useRouter();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe');

  const handleStripeSubscribe = async (tier: string, interval: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tier, interval })
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

  const plans = [
    {
      name: "Free",
      tier: "free",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started with C5K",
      features: [
        "Access to all published articles",
        "Browse journals and conferences",
        "Submit papers for review",
        "Basic profile",
        "Email notifications",
      ],
      cta: "Sign Up Free",
      recommended: false,
      paypalPlanId: null
    },
    {
      name: "Basic",
      tier: "basic",
      price: "$99",
      period: "per year",
      description: "For active researchers and authors",
      features: [
        "All Free features",
        "Submit up to 5 papers/year",
        "Priority paper review",
        "Basic author dashboard",
        "Email notifications",
        "Author certification badge",
      ],
      cta: "Get Basic",
      recommended: false,
      paypalPlanId: process.env.NEXT_PUBLIC_PAYPAL_PLAN_BASIC
    },
    {
      name: "Premium",
      tier: "premium",
      price: "$199",
      period: "per year",
      description: "For prolific researchers and academics",
      features: [
        "All Basic features",
        "Unlimited submissions",
        "Enhanced author dashboard",
        "Submission analytics & insights",
        "Early access to new features",
        "Priority email support",
        "Featured author profile",
        "Conference discounts (20%)",
      ],
      cta: "Get Premium",
      recommended: true,
      paypalPlanId: process.env.NEXT_PUBLIC_PAYPAL_PLAN_PREMIUM
    },
    {
      name: "Institutional",
      tier: "institutional",
      price: "$499",
      period: "per year",
      description: "For universities and research organizations",
      features: [
        "All Author features",
        "Multiple user accounts (up to 50)",
        "Institutional branding",
        "Dedicated account manager",
        "Custom reporting & analytics",
        "API access",
        "Priority 24/7 support",
        "Bulk submission discounts",
      ],
      cta: "Get Institutional",
      recommended: false,
      paypalPlanId: process.env.NEXT_PUBLIC_PAYPAL_PLAN_INSTITUTIONAL
    },
  ];

  const handleFreeSignup = () => {
    router.push('/register');
  };

  const onApproveSubscription = async (data: any, actions: any, tier: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Please login to complete subscription");
        router.push('/login');
        return;
      }

      const response = await fetch('/api/payments/paypal/record-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subscriptionID: data.subscriptionID,
          tier: tier
        })
      });

      const result = await response.json();
      if (result.success) {
        toast.success(`Successfully subscribed to ${tier} plan!`);
        router.push('/dashboard?payment=success');
      } else {
        toast.error("Failed to record subscription using PayPal.");
      }
    } catch (err) {
      console.error("Subscription Error", err);
      toast.error("An error occurred during subscription.");
    }
  };


  const benefits = [
    {
      icon: "📚",
      title: "Access to Research",
      description: "Unlimited access to thousands of peer-reviewed articles across all journals.",
    },
    {
      icon: "🚀",
      title: "Fast Publication",
      description: "Our rapid review system ensures rapid publication without compromising quality.",
    },
    {
      icon: "🌍",
      title: "Global Network",
      description: "Connect with researchers and institutions from around the world.",
    },
    {
      icon: "📊",
      title: "Track Your Impact",
      description: "Monitor citations, downloads, and impact metrics for your publications.",
    },
    {
      icon: "🎓",
      title: "Professional Development",
      description: "Access webinars, workshops, and resources for career advancement.",
    },
    {
      icon: "🏆",
      title: "Recognition",
      description: "Gain visibility through our prestigious journals and conferences.",
    },
  ];

  return (
    <PayPalScriptProvider options={{
      clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test", // Fallback for safety
      components: "buttons",
      intent: "subscription",
      vault: true
    }}>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary to-blue-800 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Join C5K Community</h1>
            <p className="text-xl md:text-2xl text-gray-100 max-w-3xl mx-auto">
              Become part of a global network advancing knowledge and innovation
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

          {/* Warning if Client ID missing */}
          {!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-8">
              <p className="text-yellow-700">
                PayPal Client ID is missing. Payments will not function correctly.
              </p>
            </div>
          )}

          {/* Pricing Plans */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
                Choose Your Plan
              </h2>
              <p className="text-lg text-gray-700 max-w-2xl mx-auto">
                Select the membership level that best fits your research needs
              </p>
            </div>

            {/* Payment Method Toggle */}
            <div className="flex justify-center mb-8">
              <div className="bg-white p-1 rounded-lg border border-gray-200 inline-flex shadow-sm">
                <button
                  onClick={() => setPaymentMethod('stripe')}
                  className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${paymentMethod === 'stripe' ? 'bg-primary text-white shadow' : 'text-gray-500 hover:text-gray-900'
                    }`}
                >
                  Credit Card
                </button>
                <button
                  onClick={() => setPaymentMethod('paypal')}
                  className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${paymentMethod === 'paypal' ? 'bg-[#003087] text-white shadow' : 'text-gray-500 hover:text-gray-900'
                    }`}
                >
                  PayPal
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`bg-white rounded-lg shadow-lg overflow-hidden flex flex-col ${plan.recommended ? "ring-4 ring-accent transform scale-105" : ""
                    }`}
                >
                  {plan.recommended && (
                    <div className="bg-accent text-white text-center py-2 font-bold text-sm">
                      RECOMMENDED
                    </div>
                  )}
                  <div className="p-8 flex-1 flex flex-col">
                    <h3 className="text-2xl font-bold text-primary mb-2">{plan.name}</h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-600 ml-2">{plan.period}</span>
                    </div>
                    <p className="text-gray-700 mb-6">{plan.description}</p>
                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <svg
                            className="w-5 h-5 text-accent mr-2 mt-0.5 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Action Button */}
                    <div className="mt-auto">
                      {plan.tier === 'free' ? (
                        <button
                          onClick={handleFreeSignup}
                          className="block w-full text-center py-3 px-6 rounded-lg font-bold transition-colors bg-primary text-white hover:bg-primary/90"
                        >
                          {plan.cta}
                        </button>
                      ) : (
                        <div className="w-full">
                          {paymentMethod === 'stripe' ? (
                            <button
                              onClick={() => handleStripeSubscribe(plan.name, "year")}
                              className="w-full py-3 px-6 rounded-lg font-bold transition-colors bg-primary text-white hover:bg-primary-dark shadow-md"
                            >
                              Subscribe with Card
                            </button>
                          ) : (
                            plan.paypalPlanId ? (
                              <PayPalButtons
                                style={{ layout: "vertical", label: "subscribe" }}
                                createSubscription={(data, actions) => {
                                  return actions.subscription.create({
                                    plan_id: plan.paypalPlanId!
                                  });
                                }}
                                onApprove={(data, actions) => onApproveSubscription(data, actions, plan.tier)}
                              />
                            ) : (
                              <button disabled className="w-full bg-gray-300 text-gray-500 py-3 rounded cursor-not-allowed">
                                Plan Not Configured
                              </button>
                            )
                          )}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Benefits Section */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
                Membership Benefits
              </h2>
              <p className="text-lg text-gray-700 max-w-2xl mx-auto">
                Unlock powerful features and resources to advance your research
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-6">
                  <div className="text-4xl mb-4">{benefit.icon}</div>
                  <h3 className="text-xl font-bold text-primary mb-3">{benefit.title}</h3>
                  <p className="text-gray-700">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Member Testimonials */}
          <div className="bg-white rounded-lg shadow-md p-8 md:p-12 mb-16">
            <h2 className="text-3xl font-bold text-primary mb-8 text-center">
              What Our Members Say
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="border-l-4 border-accent pl-6">
                <p className="text-gray-700 italic mb-4">
                  "C5K's rapid publication process allowed me to share my research months earlier
                  than traditional journals. The rapid review system ensures quality while maintaining
                  speed."
                </p>
                <p className="font-bold text-gray-900">Dr. Sarah Johnson</p>
                <p className="text-gray-600">Stanford University</p>
              </div>
              <div className="border-l-4 border-accent pl-6">
                <p className="text-gray-700 italic mb-4">
                  "As an institutional member, we've been able to streamline our publication process
                  across departments. The dedicated support team is exceptional."
                </p>
                <p className="font-bold text-gray-900">Prof. Michael Chen</p>
                <p className="text-gray-600">MIT</p>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-white rounded-lg shadow-md p-8 md:p-12 mb-16">
            <h2 className="text-3xl font-bold text-primary mb-8">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Can I upgrade my membership later?
                </h3>
                <p className="text-gray-700">
                  Yes, you can upgrade your membership at any time. The difference will be prorated
                  based on your billing cycle.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  What payment methods do you accept?
                </h3>
                <p className="text-gray-700">
                  We accept all major credit cards and PayPal.
                </p>
              </div>
              {/* ... other FAQs ... */}
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-primary to-blue-800 text-white rounded-lg shadow-lg p-8 md:p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl text-gray-100 mb-8 max-w-2xl mx-auto">
              Join thousands of researchers advancing knowledge through C5K
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="bg-accent hover:bg-accent-dark text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors"
              >
                Join Now
              </Link>
              <Link
                href="/contact"
                className="bg-white hover:bg-gray-100 text-primary px-8 py-4 rounded-lg font-bold text-lg transition-colors"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PayPalScriptProvider>
  );
}
