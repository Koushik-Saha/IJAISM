import Link from "next/link";

export default function BookPublishingPage() {
  const publishingOptions = [
    {
      name: "Monograph",
      description: "Single-author or collaborative scholarly work presenting original research",
      length: "200-400 pages",
      timeline: "8-12 months",
    },
    {
      name: "Edited Volume",
      description: "Collection of chapters by different authors on a unified theme",
      length: "300-500 pages",
      timeline: "10-14 months",
    },
    {
      name: "Textbook",
      description: "Educational resource for undergraduate or graduate courses",
      length: "400-800 pages",
      timeline: "12-18 months",
    },
    {
      name: "Conference Proceedings",
      description: "Peer-reviewed papers from academic conferences",
      length: "200-600 pages",
      timeline: "6-9 months",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Book Publishing</h1>
          <p className="text-xl md:text-2xl text-gray-100 max-w-3xl">
            Publish your scholarly book with a leading academic publisher
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Introduction */}
        <div className="bg-white rounded-lg shadow-md p-8 md:p-12 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">
            Publish Your Book with IJAISM
          </h2>
          <p className="text-lg text-gray-700 mb-4 leading-relaxed">
            IJAISM Press publishes high-quality academic books that advance knowledge in information
            technology, business management, and related disciplines. Our rigorous peer review
            process ensures scholarly excellence, while our global distribution network maximizes
            your book's reach and impact.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            We offer both traditional publishing and open access options, providing authors with
            flexibility in how they share their work with the world. Our experienced editorial
            team works closely with authors throughout the publishing process to ensure the
            highest quality final product.
          </p>
        </div>

        {/* Publishing Options */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-primary mb-8 text-center">
            What We Publish
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {publishingOptions.map((option, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border-l-4 border-accent"
              >
                <h3 className="text-2xl font-bold text-primary mb-3">{option.name}</h3>
                <p className="text-gray-700 mb-4 leading-relaxed">{option.description}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-bold text-gray-600 mb-1">TYPICAL LENGTH</p>
                    <p className="text-gray-800">{option.length}</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-600 mb-1">TIMELINE</p>
                    <p className="text-gray-800">{option.timeline}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Publishing Process */}
        <div className="bg-white rounded-lg shadow-md p-8 md:p-12 mb-12">
          <h2 className="text-3xl font-bold text-primary mb-8">Publishing Process</h2>
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center font-bold text-lg mr-4">
                1
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Proposal Submission</h3>
                <p className="text-gray-700 mb-2">
                  Submit a book proposal including overview, table of contents, sample chapter,
                  and author CV.
                </p>
                <p className="text-sm text-gray-600">Timeline: Submit anytime</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center font-bold text-lg mr-4">
                2
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Editorial Review</h3>
                <p className="text-gray-700 mb-2">
                  Our editorial board evaluates the proposal for fit with our publishing program
                  and academic merit.
                </p>
                <p className="text-sm text-gray-600">Timeline: 2-4 weeks</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center font-bold text-lg mr-4">
                3
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Peer Review</h3>
                <p className="text-gray-700 mb-2">
                  Full manuscript (or substantial portion) undergoes peer review by subject matter
                  experts.
                </p>
                <p className="text-sm text-gray-600">Timeline: 6-8 weeks</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center font-bold text-lg mr-4">
                4
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Contract & Revisions</h3>
                <p className="text-gray-700 mb-2">
                  Publishing contract signed. Author revises manuscript based on reviewer feedback.
                </p>
                <p className="text-sm text-gray-600">Timeline: 2-6 months</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center font-bold text-lg mr-4">
                5
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Production</h3>
                <p className="text-gray-700 mb-2">
                  Professional copyediting, typesetting, cover design, and proofreading.
                </p>
                <p className="text-sm text-gray-600">Timeline: 3-5 months</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center font-bold text-lg mr-4">
                6
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Publication & Distribution</h3>
                <p className="text-gray-700 mb-2">
                  Book published in print and digital formats, distributed globally through major
                  retailers and libraries.
                </p>
                <p className="text-sm text-gray-600">Timeline: 1-2 months post-production</p>
              </div>
            </div>
          </div>
        </div>

        {/* Why Publish with IJAISM */}
        <div className="bg-white rounded-lg shadow-md p-8 md:p-12 mb-12">
          <h2 className="text-3xl font-bold text-primary mb-8">Why Publish with IJAISM?</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center font-bold text-2xl mr-4">
                🌍
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Global Reach</h3>
                <p className="text-gray-700">
                  Distribution through Amazon, Google Books, major academic libraries, and 50+
                  countries worldwide.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center font-bold text-2xl mr-4">
                ⚡
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Fast Publication</h3>
                <p className="text-gray-700">
                  Streamlined process from acceptance to publication, typically 8-12 months.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center font-bold text-2xl mr-4">
                ✨
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Professional Quality</h3>
                <p className="text-gray-700">
                  Expert copyediting, professional design, and high-quality production standards.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center font-bold text-2xl mr-4">
                📈
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Author Support</h3>
                <p className="text-gray-700">
                  Dedicated editor, marketing support, and author dashboard for sales tracking.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center font-bold text-2xl mr-4">
                🔓
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Open Access Option</h3>
                <p className="text-gray-700">
                  Choose traditional or open access publishing to maximize your book's impact.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center font-bold text-2xl mr-4">
                💰
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Author Royalties</h3>
                <p className="text-gray-700">
                  Competitive royalty rates (15-25%) with transparent reporting and timely payments.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Proposal Requirements */}
        <div className="bg-white rounded-lg shadow-md p-8 md:p-12 mb-12">
          <h2 className="text-3xl font-bold text-primary mb-8">Proposal Requirements</h2>

          <h3 className="text-xl font-bold text-gray-900 mb-4">Your proposal should include:</h3>

          <div className="space-y-6">
            <div className="border-l-4 border-accent pl-6">
              <h4 className="text-lg font-bold text-gray-900 mb-2">1. Overview (2-3 pages)</h4>
              <ul className="list-disc ml-6 space-y-1 text-gray-700">
                <li>Book's main argument or contribution</li>
                <li>Target audience (students, researchers, practitioners)</li>
                <li>Competing or comparable titles</li>
                <li>What makes your book unique</li>
                <li>Estimated completion date</li>
              </ul>
            </div>

            <div className="border-l-4 border-accent pl-6">
              <h4 className="text-lg font-bold text-gray-900 mb-2">2. Table of Contents</h4>
              <ul className="list-disc ml-6 space-y-1 text-gray-700">
                <li>Chapter titles and brief descriptions</li>
                <li>Estimated page count per chapter</li>
                <li>Current status of each chapter</li>
              </ul>
            </div>

            <div className="border-l-4 border-accent pl-6">
              <h4 className="text-lg font-bold text-gray-900 mb-2">3. Sample Chapter</h4>
              <ul className="list-disc ml-6 space-y-1 text-gray-700">
                <li>One complete chapter (preferably introduction or core chapter)</li>
                <li>Demonstrates writing quality and depth of analysis</li>
              </ul>
            </div>

            <div className="border-l-4 border-accent pl-6">
              <h4 className="text-lg font-bold text-gray-900 mb-2">4. Author Information</h4>
              <ul className="list-disc ml-6 space-y-1 text-gray-700">
                <li>Academic CV or resume</li>
                <li>Previous publications</li>
                <li>Institutional affiliation</li>
                <li>Relevant expertise and credentials</li>
              </ul>
            </div>
          </div>

          <div className="mt-8">
            <button className="bg-accent hover:bg-accent-dark text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors">
              Submit Book Proposal
            </button>
          </div>
        </div>

        {/* Publishing Models */}
        <div className="bg-white rounded-lg shadow-md p-8 md:p-12 mb-12">
          <h2 className="text-3xl font-bold text-primary mb-8">Publishing Models</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="border-2 border-gray-200 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-primary mb-4">Traditional Publishing</h3>
              <p className="text-gray-700 mb-4">
                Book sold through retailers and libraries. Revenue from sales shared with author
                through royalties.
              </p>
              <h4 className="font-bold text-gray-900 mb-2">Features:</h4>
              <ul className="space-y-2 text-gray-700 mb-6">
                <li className="flex items-start">
                  <span className="text-accent mr-2">✓</span>
                  No publication fees for authors
                </li>
                <li className="flex items-start">
                  <span className="text-accent mr-2">✓</span>
                  15-25% royalties on net sales
                </li>
                <li className="flex items-start">
                  <span className="text-accent mr-2">✓</span>
                  Print and digital formats
                </li>
                <li className="flex items-start">
                  <span className="text-accent mr-2">✓</span>
                  Marketing support included
                </li>
              </ul>
              <p className="text-sm font-bold text-gray-600">Best for: Authors seeking wide commercial distribution</p>
            </div>

            <div className="border-2 border-accent rounded-lg p-6">
              <div className="bg-accent text-white text-center py-1 -mx-6 -mt-6 mb-4 rounded-t-lg font-bold text-sm">
                MAXIMUM IMPACT
              </div>
              <h3 className="text-2xl font-bold text-primary mb-4">Open Access</h3>
              <p className="text-gray-700 mb-4">
                Book freely available online. Funded by Book Processing Charge (BPC) or institutional
                sponsorship.
              </p>
              <h4 className="font-bold text-gray-900 mb-2">Features:</h4>
              <ul className="space-y-2 text-gray-700 mb-6">
                <li className="flex items-start">
                  <span className="text-accent mr-2">✓</span>
                  Maximum visibility and citations
                </li>
                <li className="flex items-start">
                  <span className="text-accent mr-2">✓</span>
                  Global reach and accessibility
                </li>
                <li className="flex items-start">
                  <span className="text-accent mr-2">✓</span>
                  CC BY license
                </li>
                <li className="flex items-start">
                  <span className="text-accent mr-2">✓</span>
                  BPC: $3,000-$8,000
                </li>
              </ul>
              <p className="text-sm font-bold text-gray-600">Best for: Authors prioritizing maximum readership and impact</p>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="bg-white rounded-lg shadow-md p-8 md:p-12 mb-12">
          <h2 className="text-3xl font-bold text-primary mb-8">Frequently Asked Questions</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                How long does the publishing process take?
              </h3>
              <p className="text-gray-700">
                From proposal acceptance to publication typically takes 8-18 months depending on
                the book type and author's timeline for revisions.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                What are the costs involved?
              </h3>
              <p className="text-gray-700">
                Traditional publishing has no author fees. Open access requires a Book Processing
                Charge ($3,000-$8,000) which can often be covered by institutional or grant funding.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Do I retain copyright?
              </h3>
              <p className="text-gray-700">
                Yes, authors retain copyright under both publishing models. For open access, you
                grant a CC BY license allowing others to use your work with attribution.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Can I publish a revised version of my dissertation?
              </h3>
              <p className="text-gray-700">
                Yes, many successful books are based on dissertations. However, substantial
                revision is usually required to make the work suitable for book publication.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                How are books marketed?
              </h3>
              <p className="text-gray-700">
                We provide catalogue listings, conference exhibits, social media promotion, review
                copy distribution, and metadata optimization for discoverability.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-primary to-blue-800 text-white rounded-lg shadow-lg p-8 md:p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Publish Your Book?
          </h2>
          <p className="text-xl text-gray-100 mb-8 max-w-2xl mx-auto">
            Submit your proposal today and join our prestigious list of authors
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-accent hover:bg-accent-dark text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors">
              Submit Proposal
            </button>
            <Link
              href="/contact"
              className="bg-white hover:bg-gray-100 text-primary px-8 py-4 rounded-lg font-bold text-lg transition-colors"
            >
              Contact Acquisitions Editor
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
