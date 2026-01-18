import Link from "next/link";

export default function MembershipPage() {
  const plans = [
    {
      name: "Free",
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
      name: "Author",
      price: "$99",
      period: "per year",
      description: "For active researchers and authors",
      features: [
        "All Free features",
        "Priority paper review",
        "Enhanced author dashboard",
        "Submission analytics",
        "Early access to new features",
        "Author certification badge",
        "Unlimited submissions",
      ],
      cta: "Become an Author",
      recommended: true,
    },
    {
      name: "Institutional",
      price: "Custom",
      period: "contact us",
      description: "For universities and research organizations",
      features: [
        "All Author features",
        "Multiple user accounts",
        "Institutional branding",
        "Dedicated account manager",
        "Custom reporting",
        "API access",
        "Priority support",
        "Bulk submission discounts",
      ],
      cta: "Contact Sales",
      recommended: false,
    },
  ];

  const benefits = [
    {
      icon: "📚",
      title: "Access to Research",
      description: "Unlimited access to thousands of peer-reviewed articles across all journals.",
    },
    {
      icon: "🚀",
      title: "Fast Publication",
      description: "Our 4-reviewer system ensures rapid publication without compromising quality.",
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

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`bg-white rounded-lg shadow-lg overflow-hidden ${
                  plan.recommended ? "ring-4 ring-accent transform scale-105" : ""
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
                  <Link
                    href={plan.name === "Institutional" ? "/contact" : "/register"}
                    className={`block w-full text-center py-3 px-6 rounded-lg font-bold transition-colors ${
                      plan.recommended
                        ? "bg-accent text-white hover:bg-accent-dark"
                        : "bg-primary text-white hover:bg-primary/90"
                    }`}
                  >
                    {plan.cta}
                  </Link>
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
                than traditional journals. The 4-reviewer system ensures quality while maintaining
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
