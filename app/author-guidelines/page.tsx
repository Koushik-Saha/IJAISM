import Link from "next/link";

export default function AuthorGuidelinesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Author Guidelines</h1>
          <p className="text-xl md:text-2xl text-gray-100 max-w-3xl">
            Everything you need to know to submit and publish with IJAISM
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Links */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-primary mb-4">Quick Navigation</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <a href="#submission-process" className="text-accent hover:underline">→ Submission Process</a>
            <a href="#manuscript-preparation" className="text-accent hover:underline">→ Manuscript Preparation</a>
            <a href="#review-process" className="text-accent hover:underline">→ Review Process</a>
            <a href="#publication" className="text-accent hover:underline">→ Publication</a>
            <a href="#ethical-guidelines" className="text-accent hover:underline">→ Ethical Guidelines</a>
            <a href="#copyright" className="text-accent hover:underline">→ Copyright & Licensing</a>
          </div>
        </div>

        {/* Introduction */}
        <div className="bg-white rounded-lg shadow-md p-8 md:p-10 mb-8">
          <h2 className="text-3xl font-bold text-primary mb-4">Welcome Authors</h2>
          <p className="text-lg text-gray-700 mb-4 leading-relaxed">
            Thank you for considering IJAISM for publishing your research. We are committed to
            maintaining the highest standards of academic publishing while ensuring a fast and
            efficient review process through our innovative 4-reviewer system.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            Please read these guidelines carefully before submitting your manuscript. Adherence
            to these guidelines will help expedite the review process and increase the likelihood
            of acceptance.
          </p>
        </div>

        {/* Submission Process */}
        <div id="submission-process" className="bg-white rounded-lg shadow-md p-8 md:p-10 mb-8">
          <h2 className="text-3xl font-bold text-primary mb-6">Submission Process</h2>

          <h3 className="text-xl font-bold text-gray-900 mb-3">Before You Submit</h3>
          <ul className="list-disc ml-6 mb-6 space-y-2 text-gray-700">
            <li>Ensure your research is original and has not been published elsewhere</li>
            <li>Verify that your manuscript is not under consideration by another journal</li>
            <li>Review our <Link href="/paper-format" className="text-accent hover:underline">paper format guidelines</Link></li>
            <li>Prepare all required files (manuscript, cover letter, supplementary materials)</li>
            <li>Obtain necessary permissions for copyrighted material</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-900 mb-3">Submission Steps</h3>
          <ol className="list-decimal ml-6 mb-6 space-y-3 text-gray-700">
            <li>
              <strong>Create an Account:</strong> Register on our platform with your academic email address
            </li>
            <li>
              <strong>Select Journal:</strong> Choose the appropriate journal for your research area
            </li>
            <li>
              <strong>Upload Manuscript:</strong> Submit your manuscript in PDF or Word format
            </li>
            <li>
              <strong>Complete Metadata:</strong> Provide title, abstract, keywords, and author information
            </li>
            <li>
              <strong>Submit Cover Letter:</strong> Explain the significance and novelty of your work
            </li>
            <li>
              <strong>Review and Confirm:</strong> Check all information and submit
            </li>
          </ol>

          <div className="bg-blue-50 border-l-4 border-accent p-4 rounded">
            <p className="text-gray-700">
              <strong>💡 Tip:</strong> You will receive a confirmation email with a manuscript ID
              within 24 hours of submission. Use this ID for all future correspondence.
            </p>
          </div>
        </div>

        {/* Manuscript Preparation */}
        <div id="manuscript-preparation" className="bg-white rounded-lg shadow-md p-8 md:p-10 mb-8">
          <h2 className="text-3xl font-bold text-primary mb-6">Manuscript Preparation</h2>

          <h3 className="text-xl font-bold text-gray-900 mb-3">General Requirements</h3>
          <ul className="list-disc ml-6 mb-6 space-y-2 text-gray-700">
            <li><strong>Length:</strong> 6-12 pages for regular papers, 15-20 pages for review articles</li>
            <li><strong>Format:</strong> PDF or Microsoft Word (.doc, .docx)</li>
            <li><strong>Language:</strong> English (American or British spelling, but be consistent)</li>
            <li><strong>Font:</strong> Times New Roman, 12pt for body text</li>
            <li><strong>Spacing:</strong> Double-spaced throughout</li>
            <li><strong>Margins:</strong> 1 inch (2.54 cm) on all sides</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-900 mb-3">Manuscript Structure</h3>
          <ol className="list-decimal ml-6 mb-6 space-y-3 text-gray-700">
            <li>
              <strong>Title:</strong> Concise and descriptive (max 150 characters)
            </li>
            <li>
              <strong>Authors:</strong> Full names, affiliations, email addresses, ORCID IDs
            </li>
            <li>
              <strong>Abstract:</strong> 150-250 words summarizing objectives, methods, results, conclusions
            </li>
            <li>
              <strong>Keywords:</strong> 4-6 keywords for indexing purposes
            </li>
            <li>
              <strong>Introduction:</strong> Background, objectives, and significance
            </li>
            <li>
              <strong>Literature Review:</strong> Current state of research (if applicable)
            </li>
            <li>
              <strong>Methodology:</strong> Detailed description of methods and materials
            </li>
            <li>
              <strong>Results:</strong> Findings presented clearly with figures and tables
            </li>
            <li>
              <strong>Discussion:</strong> Interpretation and implications of results
            </li>
            <li>
              <strong>Conclusion:</strong> Summary and future directions
            </li>
            <li>
              <strong>References:</strong> Complete citations in APA, IEEE, or Chicago style
            </li>
          </ol>

          <h3 className="text-xl font-bold text-gray-900 mb-3">Figures and Tables</h3>
          <ul className="list-disc ml-6 mb-6 space-y-2 text-gray-700">
            <li>Number all figures and tables consecutively</li>
            <li>Include descriptive captions</li>
            <li>Ensure high resolution (minimum 300 dpi for images)</li>
            <li>Cite all figures and tables in the text</li>
            <li>Provide source information for reproduced materials</li>
          </ul>

          <Link
            href="/paper-format"
            className="inline-block bg-accent hover:bg-accent-dark text-white px-6 py-3 rounded-lg font-bold transition-colors"
          >
            View Detailed Format Guide
          </Link>
        </div>

        {/* Review Process */}
        <div id="review-process" className="bg-white rounded-lg shadow-md p-8 md:p-10 mb-8">
          <h2 className="text-3xl font-bold text-primary mb-6">4-Reviewer System</h2>

          <p className="text-lg text-gray-700 mb-6 leading-relaxed">
            IJAISM uses an innovative 4-reviewer peer review system to ensure rigorous evaluation
            while maintaining rapid publication timelines.
          </p>

          <h3 className="text-xl font-bold text-gray-900 mb-3">How It Works</h3>
          <div className="space-y-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center font-bold mr-4">
                1
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Reviewer Assignment (1 week)</h4>
                <p className="text-gray-700">
                  Four expert reviewers are assigned to evaluate your manuscript independently.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center font-bold mr-4">
                2
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Review Period (4-6 weeks)</h4>
                <p className="text-gray-700">
                  Reviewers assess the manuscript for originality, methodology, significance, and clarity.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center font-bold mr-4">
                3
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Decision</h4>
                <p className="text-gray-700">
                  <strong className="text-accent">If all 4 reviewers accept:</strong> Your paper is automatically published!
                  <br />
                  <strong>If any reviewer rejects:</strong> Revisions required or rejection.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center font-bold mr-4">
                4
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Revision (if needed)</h4>
                <p className="text-gray-700">
                  Address reviewer comments and resubmit within 60 days for re-evaluation.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <p className="text-gray-700">
              <strong>✅ Average time to decision:</strong> 6-8 weeks from submission
              <br />
              <strong>✅ Automatic publication:</strong> When all 4 reviewers accept
            </p>
          </div>
        </div>

        {/* Publication */}
        <div id="publication" className="bg-white rounded-lg shadow-md p-8 md:p-10 mb-8">
          <h2 className="text-3xl font-bold text-primary mb-6">Publication</h2>

          <h3 className="text-xl font-bold text-gray-900 mb-3">Upon Acceptance</h3>
          <ul className="list-disc ml-6 mb-6 space-y-2 text-gray-700">
            <li>Authors receive acceptance notification via email</li>
            <li>Papers are published online within 7-10 days</li>
            <li>DOI (Digital Object Identifier) assigned to each article</li>
            <li>Articles immediately accessible to global readership</li>
            <li>Indexed in major academic databases</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-900 mb-3">Article Processing</h3>
          <ul className="list-disc ml-6 mb-6 space-y-2 text-gray-700">
            <li>Professional copyediting for grammar and style</li>
            <li>Layout and formatting in journal template</li>
            <li>PDF and HTML versions created</li>
            <li>Author proofs sent for final approval</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-900 mb-3">Article Processing Charges (APC)</h3>
          <p className="text-gray-700 mb-4">
            IJAISM operates on an open access model. Publication fees vary by journal:
          </p>
          <ul className="list-disc ml-6 mb-6 space-y-2 text-gray-700">
            <li>Standard articles: $500-$800 USD</li>
            <li>Review articles: $800-$1,200 USD</li>
            <li>Waivers available for authors from developing countries</li>
            <li>Discounts for IJAISM members (20% off)</li>
          </ul>
        </div>

        {/* Ethical Guidelines */}
        <div id="ethical-guidelines" className="bg-white rounded-lg shadow-md p-8 md:p-10 mb-8">
          <h2 className="text-3xl font-bold text-primary mb-6">Ethical Guidelines</h2>

          <h3 className="text-xl font-bold text-gray-900 mb-3">Authorship</h3>
          <ul className="list-disc ml-6 mb-6 space-y-2 text-gray-700">
            <li>All listed authors must have made substantial contributions</li>
            <li>All contributors meeting authorship criteria should be listed</li>
            <li>Corresponding author responsible for communication</li>
            <li>Changes to authorship require written consent from all authors</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-900 mb-3">Plagiarism</h3>
          <p className="text-gray-700 mb-4">
            All submissions are screened for plagiarism using advanced detection software. Any
            manuscript with significant similarity to published work will be rejected.
          </p>

          <h3 className="text-xl font-bold text-gray-900 mb-3">Data Integrity</h3>
          <ul className="list-disc ml-6 mb-6 space-y-2 text-gray-700">
            <li>Fabrication or falsification of data is strictly prohibited</li>
            <li>Raw data should be available for verification if requested</li>
            <li>Image manipulation must not alter scientific interpretation</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-900 mb-3">Conflicts of Interest</h3>
          <p className="text-gray-700 mb-4">
            Authors must disclose any financial or personal relationships that could influence
            their work.
          </p>

          <h3 className="text-xl font-bold text-gray-900 mb-3">Human and Animal Research</h3>
          <ul className="list-disc ml-6 mb-6 space-y-2 text-gray-700">
            <li>Research involving humans must have ethical approval</li>
            <li>Informed consent required from all participants</li>
            <li>Animal research must follow institutional and international guidelines</li>
          </ul>
        </div>

        {/* Copyright */}
        <div id="copyright" className="bg-white rounded-lg shadow-md p-8 md:p-10 mb-8">
          <h2 className="text-3xl font-bold text-primary mb-6">Copyright & Licensing</h2>

          <h3 className="text-xl font-bold text-gray-900 mb-3">Open Access</h3>
          <p className="text-gray-700 mb-4">
            IJAISM publishes all articles under the Creative Commons Attribution (CC BY) license,
            allowing readers to:
          </p>
          <ul className="list-disc ml-6 mb-6 space-y-2 text-gray-700">
            <li>Read, download, and distribute the work</li>
            <li>Create derivative works</li>
            <li>Use the work for commercial purposes</li>
          </ul>
          <p className="text-gray-700 mb-6">
            Attribution to the original author must be given.
          </p>

          <h3 className="text-xl font-bold text-gray-900 mb-3">Author Rights</h3>
          <ul className="list-disc ml-6 mb-6 space-y-2 text-gray-700">
            <li>Authors retain copyright of their work</li>
            <li>Authors grant IJAISM a license to publish and distribute</li>
            <li>Authors can reuse their work in future publications</li>
            <li>Authors can share their work on institutional repositories</li>
          </ul>
        </div>

        {/* Contact */}
        <div className="bg-gradient-to-r from-primary to-blue-800 text-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Questions?</h2>
          <p className="text-lg text-gray-100 mb-6">
            Our editorial team is here to help with any questions about the submission process
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/submit"
              className="bg-accent hover:bg-accent-dark text-white px-8 py-3 rounded-lg font-bold transition-colors"
            >
              Submit Your Paper
            </Link>
            <Link
              href="/contact"
              className="bg-white hover:bg-gray-100 text-primary px-8 py-3 rounded-lg font-bold transition-colors"
            >
              Contact Editorial Team
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
