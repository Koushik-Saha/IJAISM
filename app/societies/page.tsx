import Link from "next/link";

export default function SocietiesPage() {
  const societies = [
    {
      name: "International Society for AI and Machine Learning Research (ISAIMLR)",
      founded: "2018",
      members: "12,500+",
      region: "Global",
      focus: "Artificial Intelligence, Machine Learning, Deep Learning",
      description: "Leading global society advancing AI and ML research, fostering collaboration among researchers, practitioners, and industry leaders.",
      benefits: [
        "Access to exclusive research publications",
        "Discounted conference registration",
        "Networking opportunities",
        "Monthly webinars and workshops",
      ],
    },
    {
      name: "Global Business Innovation Network (GBIN)",
      founded: "2019",
      members: "8,300+",
      region: "Global",
      focus: "Business Innovation, Digital Transformation, Entrepreneurship",
      description: "Connecting business researchers and practitioners worldwide to advance knowledge in innovation management and digital business.",
      benefits: [
        "Industry-academia collaboration programs",
        "Case study database access",
        "Leadership development workshops",
        "Innovation awards and recognition",
      ],
    },
    {
      name: "Cybersecurity Research Alliance (CRA)",
      founded: "2020",
      members: "6,700+",
      region: "Global",
      focus: "Cybersecurity, Network Security, Data Privacy",
      description: "Dedicated to advancing cybersecurity research and practice through collaboration, education, and knowledge sharing.",
      benefits: [
        "Threat intelligence sharing",
        "Security certification programs",
        "Annual cybersecurity summit",
        "Research grants and funding",
      ],
    },
    {
      name: "Society for Blockchain and Distributed Systems (SBDS)",
      founded: "2021",
      members: "4,200+",
      region: "Global",
      focus: "Blockchain, Cryptocurrency, Distributed Ledger Technology",
      description: "Promoting research and development in blockchain technology and its applications across industries.",
      benefits: [
        "Technical standards development",
        "Industry partnerships",
        "Blockchain developer certification",
        "Quarterly technical symposiums",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Academic Societies</h1>
          <p className="text-xl md:text-2xl text-gray-100 max-w-3xl">
            Join global communities of researchers advancing knowledge in specialized fields
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Info Section */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-12">
          <h2 className="text-3xl font-bold text-primary mb-4">IJAISM Academic Societies</h2>
          <p className="text-lg text-gray-700 mb-4 leading-relaxed">
            IJAISM hosts and supports several prestigious academic societies that bring together
            researchers, practitioners, and industry leaders from around the world. Our societies
            provide platforms for collaboration, knowledge exchange, and professional development
            in specialized research areas.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            As a member of a IJAISM society, you gain access to exclusive resources, networking
            opportunities, and the chance to shape the future of your field through active
            participation in research initiatives and standards development.
          </p>
        </div>

        {/* Societies */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-primary mb-8">Our Societies</h2>
          <div className="space-y-8">
            {societies.map((society, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 md:p-8 border-l-4 border-accent"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-2xl md:text-3xl font-bold text-primary mb-3">
                      {society.name}
                    </h3>
                    <div className="flex flex-wrap gap-3 mb-4">
                      <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                        Founded {society.founded}
                      </span>
                      <span className="inline-block bg-accent/10 text-accent px-3 py-1 rounded-full text-sm font-medium">
                        {society.members} Members
                      </span>
                      <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                        🌍 {society.region}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-bold text-gray-600 mb-2">RESEARCH FOCUS</p>
                  <p className="text-gray-800 font-medium">{society.focus}</p>
                </div>

                <p className="text-gray-700 mb-6 leading-relaxed">{society.description}</p>

                <div className="mb-6">
                  <p className="font-bold text-gray-900 mb-3">Membership Benefits:</p>
                  <ul className="grid md:grid-cols-2 gap-2">
                    {society.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start">
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
                        <span className="text-gray-700">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button className="bg-accent hover:bg-accent-dark text-white px-6 py-3 rounded-lg font-bold transition-colors">
                    Join Society
                  </button>
                  <button className="border border-primary text-primary hover:bg-primary/10 px-6 py-3 rounded-lg font-bold transition-colors">
                    Learn More
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Why Join */}
        <div className="bg-white rounded-lg shadow-md p-8 md:p-12 mb-12">
          <h2 className="text-3xl font-bold text-primary mb-8">Why Join a Society?</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center font-bold text-2xl mr-4">
                🤝
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Global Network</h3>
                <p className="text-gray-700">
                  Connect with thousands of researchers and professionals worldwide in your field.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center font-bold text-2xl mr-4">
                📚
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Exclusive Resources</h3>
                <p className="text-gray-700">
                  Access members-only publications, databases, and research tools.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center font-bold text-2xl mr-4">
                🎓
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Career Development</h3>
                <p className="text-gray-700">
                  Enhance your career through workshops, certifications, and mentorship programs.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center font-bold text-2xl mr-4">
                🏆
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Recognition</h3>
                <p className="text-gray-700">
                  Gain recognition through awards, fellowships, and leadership opportunities.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Membership Tiers */}
        <div className="bg-white rounded-lg shadow-md p-8 md:p-12 mb-12">
          <h2 className="text-3xl font-bold text-primary mb-8">Membership Tiers</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border-2 border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-primary mb-3">Student Member</h3>
              <div className="text-3xl font-bold text-gray-900 mb-4">$25/year</div>
              <ul className="space-y-2 text-gray-700 mb-6">
                <li>✓ Access to publications</li>
                <li>✓ Newsletter subscription</li>
                <li>✓ Student events</li>
                <li>✓ 50% conference discount</li>
              </ul>
              <button className="w-full bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded font-bold transition-colors">
                Join as Student
              </button>
            </div>
            <div className="border-2 border-accent rounded-lg p-6 transform scale-105 shadow-lg">
              <div className="bg-accent text-white text-center py-1 -mx-6 -mt-6 mb-4 rounded-t-lg font-bold text-sm">
                MOST POPULAR
              </div>
              <h3 className="text-xl font-bold text-primary mb-3">Regular Member</h3>
              <div className="text-3xl font-bold text-gray-900 mb-4">$99/year</div>
              <ul className="space-y-2 text-gray-700 mb-6">
                <li>✓ All Student benefits</li>
                <li>✓ Full publication access</li>
                <li>✓ Voting rights</li>
                <li>✓ Committee participation</li>
                <li>✓ 30% conference discount</li>
              </ul>
              <button className="w-full bg-accent hover:bg-accent-dark text-white px-4 py-2 rounded font-bold transition-colors">
                Join as Member
              </button>
            </div>
            <div className="border-2 border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-primary mb-3">Fellow</h3>
              <div className="text-3xl font-bold text-gray-900 mb-4">$199/year</div>
              <ul className="space-y-2 text-gray-700 mb-6">
                <li>✓ All Member benefits</li>
                <li>✓ Fellow designation</li>
                <li>✓ Mentorship program</li>
                <li>✓ Board nomination</li>
                <li>✓ Free conference entry</li>
              </ul>
              <button className="w-full bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded font-bold transition-colors">
                Apply as Fellow
              </button>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="bg-white rounded-lg shadow-md p-8 md:p-12 mb-12">
          <h2 className="text-3xl font-bold text-primary mb-8">Member Testimonials</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="border-l-4 border-accent pl-6">
              <p className="text-gray-700 italic mb-4">
                "Being a member of ISAIMLR has opened countless doors for collaboration and
                research opportunities. The network and resources are invaluable."
              </p>
              <p className="font-bold text-gray-900">Dr. Jennifer Lee</p>
              <p className="text-gray-600">AI Researcher, Google Research</p>
            </div>
            <div className="border-l-4 border-accent pl-6">
              <p className="text-gray-700 italic mb-4">
                "GBIN helped me transition from academia to industry leadership. The mentorship
                and professional development programs are exceptional."
              </p>
              <p className="font-bold text-gray-900">Prof. Robert Taylor</p>
              <p className="text-gray-600">Chief Innovation Officer, Fortune 500 Company</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-primary to-blue-800 text-white rounded-lg shadow-lg p-8 md:p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Join a Society?
          </h2>
          <p className="text-xl text-gray-100 mb-8 max-w-2xl mx-auto">
            Become part of a global community advancing knowledge in your field
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
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
