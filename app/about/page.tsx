import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About IJAISM</h1>
          <p className="text-xl md:text-2xl text-gray-100 max-w-3xl">
            Leading the way in academic publishing excellence since our founding
          </p>
        </div>
      </div>

      {/* Mission Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-primary mb-6">Our Mission</h2>
          <p className="text-lg text-gray-700 mb-4 leading-relaxed">
            IJAISM is dedicated to publishing groundbreaking research and promoting innovative ideas
            in the fields of information technology, business management, and related disciplines.
            Our goal is to minimize the delay in sharing new ideas and discoveries with the world,
            making high-quality, peer-reviewed journals available online.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            We believe in accelerating the dissemination of knowledge through our innovative
            rapid approval system, ensuring rapid publication while maintaining the highest
            standards of academic rigor.
          </p>
        </div>

        {/* Vision Section */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-primary mb-6">Our Vision</h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            To become the world's most trusted and accessible platform for academic publishing,
            where researchers worldwide can share their discoveries quickly and efficiently,
            advancing human knowledge across disciplines.
          </p>
        </div>

        {/* Values Section */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-primary mb-6">Our Core Values</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border-l-4 border-accent pl-4">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Excellence</h3>
              <p className="text-gray-700">
                We maintain the highest standards in peer review and publication quality.
              </p>
            </div>
            <div className="border-l-4 border-accent pl-4">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Speed</h3>
              <p className="text-gray-700">
                Our streamlined review process ensures rapid dissemination of knowledge.
              </p>
            </div>
            <div className="border-l-4 border-accent pl-4">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Accessibility</h3>
              <p className="text-gray-700">
                We make research freely available to advance global understanding.
              </p>
            </div>
            <div className="border-l-4 border-accent pl-4">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Integrity</h3>
              <p className="text-gray-700">
                We uphold ethical standards in all aspects of academic publishing.
              </p>
            </div>
          </div>
        </div>

        {/* Publishing Process */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-primary mb-6">Our Publishing Process</h2>
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center font-bold text-lg">
                1
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Submission</h3>
                <p className="text-gray-700">
                  Authors submit their research through our online platform with all required materials.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center font-bold text-lg">
                2
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Expert Assessment</h3>
                <p className="text-gray-700">
                  Four expert reviewers evaluate the manuscript independently for quality and originality.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center font-bold text-lg">
                3
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Automatic Publication</h3>
                <p className="text-gray-700">
                  If all four reviewers accept, the paper is automatically published. Any rejection requires revision.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center font-bold text-lg">
                4
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Global Dissemination</h3>
                <p className="text-gray-700">
                  Published research is immediately available to the global academic community.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="bg-gradient-to-r from-primary to-blue-800 text-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
          <p className="text-lg mb-6 text-gray-100">
            Be part of a global network of researchers advancing knowledge
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-accent hover:bg-accent-dark text-white px-8 py-3 rounded-lg font-bold transition-colors"
            >
              Register Now
            </Link>
            <Link
              href="/submit"
              className="bg-white hover:bg-gray-100 text-primary px-8 py-3 rounded-lg font-bold transition-colors"
            >
              Submit Your Research
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
