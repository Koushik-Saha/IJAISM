"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

export default function MembershipPage() {
  const router = useRouter();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const plans = [
    {
      name: "Free",
      tier: "free",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started with IJAISM",
      features: [
        "Access to all published articles",
        "Browse journals and conferences",
        "Submit papers for review",
        "Basic profile",
        "Email notifications",
      ],
      cta: "Sign Up Free",
      recommended: false,
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
    },
  ];

  // Handle subscription
  const handleSubscribe = async (tier: string) => {
    if (tier === "free") {
      // Redirect to registration for free tier
      router.push('/register');
      return;
    }

    setError(null);
    setLoadingTier(tier);

    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        // Redirect to login if not authenticated
        router.push(`/login?redirect=/membership&tier=${tier}`);
        return;
      }

      // Create checkout session
      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ tier }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }

      // Use the URL from the session instead of redirectToCheckout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received from server');
      }

    } catch (error: any) {
      console.error('Subscription error:', error);
      setError(error.message || 'Failed to start subscription. Please try again.');
      setLoadingTier(null);
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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Join IJAISM Community</h1>
          <p className="text-xl md:text-2xl text-gray-100 max-w-3xl mx-auto">
            Become part of a global network advancing knowledge and innovation
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-8 max-w-4xl mx-auto">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-bold text-red-800">Subscription Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
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

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`bg-white rounded-lg shadow-lg overflow-hidden ${plan.recommended ? "ring-4 ring-accent transform scale-105" : ""
                  }`}
              >
                {plan.recommended && (
                  <div className="bg-accent text-white text-center py-2 font-bold text-sm">
                    RECOMMENDED
                  </div>
                )}
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-primary mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 ml-2">{plan.period}</span>
                  </div>
                  <p className="text-gray-700 mb-6">{plan.description}</p>
                  <ul className="space-y-3 mb-8">
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
                  <button
                    onClick={() => handleSubscribe(plan.tier)}
                    disabled={loadingTier !== null}
                    className={`block w-full text-center py-3 px-6 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${plan.recommended
                      ? "bg-accent text-white hover:bg-accent-dark"
                      : "bg-primary text-white hover:bg-primary/90"
                      }`}
                  >
                    {loadingTier === plan.tier ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      plan.cta
                    )}
                  </button>
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
                "IJAISM's rapid publication process allowed me to share my research months earlier
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
                We accept all major credit cards, PayPal, and bank transfers for institutional
                memberships.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Is there a discount for students?
              </h3>
              <p className="text-gray-700">
                Yes! Students with valid academic email addresses receive 50% off Author
                membership. Contact us for details.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Can I cancel my membership?
              </h3>
              <p className="text-gray-700">
                Yes, you can cancel anytime. You'll continue to have access until the end of your
                current billing period.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-primary to-blue-800 text-white rounded-lg shadow-lg p-8 md:p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-gray-100 mb-8 max-w-2xl mx-auto">
            Join thousands of researchers advancing knowledge through IJAISM
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
  );
}
