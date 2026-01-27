import Link from "next/link";

export default function ScholarshipPage() {
  const scholarships = [
    {
      name: "C5K Doctoral Research Scholarship",
      amount: "$25,000",
      duration: "1 year",
      eligibility: "PhD students in IT or Business Management",
      deadline: "March 31, 2024",
      awards: "10 scholarships",
      status: "Open",
    },
    {
      name: "Emerging Researcher Grant",
      amount: "$10,000",
      duration: "6 months",
      eligibility: "Early-career researchers (within 5 years of PhD)",
      deadline: "April 15, 2024",
      awards: "15 grants",
      status: "Open",
    },
    {
      name: "Conference Travel Grant",
      amount: "$2,500",
      duration: "One-time",
      eligibility: "Graduate students presenting at C5K conferences",
      deadline: "Rolling basis",
      awards: "50 grants per year",
      status: "Open",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Research Scholarships</h1>
          <p className="text-xl md:text-2xl text-gray-100 max-w-3xl">
            Supporting the next generation of researchers and innovators
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Info Section */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-primary mb-4">C5K Scholarship Program</h2>
          <p className="text-lg text-gray-700 mb-4 leading-relaxed">
            C5K is committed to advancing academic research by providing financial support to
            talented researchers worldwide. Our scholarship program aims to remove financial
            barriers and enable researchers to focus on groundbreaking work in information
            technology, business management, and related disciplines.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            Since 2020, we have awarded over $2 million in scholarships to more than 500
            researchers from 60+ countries, contributing to significant advancements in their
            respective fields.
          </p>
        </div>

        {/* Available Scholarships */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-primary mb-6">Available Scholarships</h2>
          <div className="grid md:grid-cols-1 gap-6">
            {scholarships.map((scholarship, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 md:p-8 border-l-4 border-accent"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold uppercase">
                        {scholarship.status}
                      </span>
                      <span className="inline-block bg-accent text-white px-4 py-1 rounded-full text-sm font-bold">
                        {scholarship.awards}
                      </span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-primary mb-2">
                      {scholarship.name}
                    </h3>
                  </div>
                  <div className="text-right mt-4 md:mt-0">
                    <div className="text-3xl md:text-4xl font-bold text-accent">
                      {scholarship.amount}
                    </div>
                    <div className="text-gray-600">{scholarship.duration}</div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm font-bold text-gray-600 mb-1">ELIGIBILITY</p>
                    <p className="text-gray-800">{scholarship.eligibility}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-600 mb-1">APPLICATION DEADLINE</p>
                    <p className="text-gray-800 font-semibold">{scholarship.deadline}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button className="bg-accent hover:bg-accent-dark text-white px-6 py-3 rounded-lg font-bold transition-colors">
                    Apply Now
                  </button>
                  <button className="border border-primary text-primary hover:bg-primary/10 px-6 py-3 rounded-lg font-bold transition-colors">
                    Learn More
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Eligibility Criteria */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-primary mb-6">General Eligibility Criteria</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Who Can Apply?</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
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
                  Graduate or doctoral students
                </li>
                <li className="flex items-start">
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
                  Early-career researchers
                </li>
                <li className="flex items-start">
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
                  Enrolled at accredited institutions
                </li>
                <li className="flex items-start">
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
                  Research focus in IT or Business
                </li>
                <li className="flex items-start">
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
                  Demonstrated research excellence
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Required Documents</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
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
                  Research proposal (2-5 pages)
                </li>
                <li className="flex items-start">
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
                  Academic transcripts
                </li>
                <li className="flex items-start">
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
                  Curriculum vitae
                </li>
                <li className="flex items-start">
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
                  Two letters of recommendation
                </li>
                <li className="flex items-start">
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
                  Personal statement
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Selection Process */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-primary mb-6">Selection Process</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center font-bold text-lg mr-4">
                1
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Application Review</h3>
                <p className="text-gray-700">
                  Our selection committee reviews all applications for completeness and eligibility.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center font-bold text-lg mr-4">
                2
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Expert Evaluation</h3>
                <p className="text-gray-700">
                  Research proposals are evaluated by experts in the relevant field for quality and
                  innovation.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center font-bold text-lg mr-4">
                3
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Interview (Finalists)</h3>
                <p className="text-gray-700">
                  Shortlisted candidates participate in virtual interviews with the selection panel.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center font-bold text-lg mr-4">
                4
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Award Notification</h3>
                <p className="text-gray-700">
                  Successful applicants are notified within 8 weeks of the application deadline.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Success Stories */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-primary mb-6">Success Stories</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="border-l-4 border-accent pl-6">
              <p className="text-gray-700 italic mb-4">
                "The C5K scholarship enabled me to focus entirely on my doctoral research in AI
                ethics. I successfully defended my thesis and now lead a research lab at a top
                university."
              </p>
              <p className="font-bold text-gray-900">Dr. Maria Santos</p>
              <p className="text-gray-600">2022 Doctoral Scholar • Now at Harvard</p>
            </div>
            <div className="border-l-4 border-accent pl-6">
              <p className="text-gray-700 italic mb-4">
                "The grant provided critical support for my blockchain research, leading to three
                published papers and a startup based on my findings."
              </p>
              <p className="font-bold text-gray-900">Dr. Ahmed Khan</p>
              <p className="text-gray-600">2023 Emerging Researcher • Founder, BlockChain Solutions</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-primary to-blue-800 text-white rounded-lg shadow-md p-8 md:p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Apply?</h2>
          <p className="text-xl text-gray-100 mb-8 max-w-2xl mx-auto">
            Take the first step towards advancing your research with C5K support
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-accent hover:bg-accent-dark text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors"
            >
              Apply Now
            </Link>
            <Link
              href="/contact"
              className="bg-white hover:bg-gray-100 text-primary px-8 py-4 rounded-lg font-bold text-lg transition-colors"
            >
              Have Questions?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
