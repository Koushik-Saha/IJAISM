import Link from "next/link";

export default function CareersPage() {
  const openings = [
    {
      title: "Senior Editor - Information Technology",
      department: "Editorial",
      location: "Remote",
      type: "Full-time",
      posted: "2024-01-10",
      description: "Lead editorial operations for our IT journals, manage peer review process, and work with authors and reviewers.",
    },
    {
      title: "Peer Review Coordinator",
      department: "Editorial",
      location: "Remote",
      type: "Full-time",
      posted: "2024-01-08",
      description: "Coordinate the peer review process, assign reviewers, and ensure timely completion of reviews.",
    },
    {
      title: "Marketing Manager",
      department: "Marketing",
      location: "New York, USA / Remote",
      type: "Full-time",
      posted: "2024-01-05",
      description: "Develop and execute marketing strategies to promote our journals and conferences to the global research community.",
    },
    {
      title: "Full Stack Developer",
      department: "Technology",
      location: "Remote",
      type: "Full-time",
      posted: "2024-01-03",
      description: "Build and maintain our publishing platform using Next.js, React, and modern web technologies.",
    },
    {
      title: "Copyeditor",
      department: "Editorial",
      location: "Remote",
      type: "Part-time / Freelance",
      posted: "2023-12-28",
      description: "Review and edit manuscripts for grammar, style, and clarity while maintaining academic integrity.",
    },
  ];

  const benefits = [
    {
      icon: "💰",
      title: "Competitive Salary",
      description: "Industry-leading compensation packages with performance bonuses.",
    },
    {
      icon: "🏥",
      title: "Health Benefits",
      description: "Comprehensive health, dental, and vision insurance for you and your family.",
    },
    {
      icon: "🌴",
      title: "Flexible PTO",
      description: "Generous paid time off policy with flexible vacation scheduling.",
    },
    {
      icon: "💻",
      title: "Remote Work",
      description: "Work from anywhere with flexible hours and home office stipend.",
    },
    {
      icon: "📚",
      title: "Learning Budget",
      description: "Annual budget for conferences, courses, and professional development.",
    },
    {
      icon: "🎓",
      title: "Education Support",
      description: "Tuition reimbursement for continuing education and advanced degrees.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Careers at C5K</h1>
          <p className="text-xl md:text-2xl text-gray-100 max-w-3xl">
            Join our mission to accelerate the dissemination of knowledge worldwide
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Why Join C5K */}
        <div className="bg-white rounded-lg shadow-md p-8 md:p-12 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">Why Join C5K?</h2>
          <p className="text-lg text-gray-700 mb-6 leading-relaxed">
            At C5K, we're transforming academic publishing by making research more accessible and
            the publication process faster and more efficient. Our innovative review system
            has helped thousands of researchers share their discoveries with the world.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            We're looking for talented, passionate individuals who want to make a real impact on
            global knowledge sharing. Join a diverse team of editors, technologists, and
            researchers dedicated to advancing science and innovation.
          </p>
        </div>

        {/* Benefits */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-primary mb-8 text-center">
            Benefits & Perks
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="text-4xl mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-bold text-primary mb-3">{benefit.title}</h3>
                <p className="text-gray-700">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Current Openings */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-primary mb-8">Current Openings</h2>
          <div className="space-y-6">
            {openings.map((job, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 md:p-8 border-l-4 border-accent"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-primary mb-3">{job.title}</h3>
                    <div className="flex flex-wrap gap-3 mb-4">
                      <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                        {job.department}
                      </span>
                      <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                        {job.type}
                      </span>
                      <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                        📍 {job.location}
                      </span>
                    </div>
                  </div>
                  <div className="text-gray-600 text-sm mt-2 md:mt-0 md:text-right">
                    Posted: {new Date(job.posted).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>

                <p className="text-gray-700 mb-6 leading-relaxed">{job.description}</p>

                <div className="flex flex-wrap gap-3">
                  <button className="bg-accent hover:bg-accent-dark text-white px-6 py-3 rounded-lg font-bold transition-colors">
                    Apply Now
                  </button>
                  <button className="border border-primary text-primary hover:bg-primary/10 px-6 py-3 rounded-lg font-bold transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Our Values */}
        <div className="bg-white rounded-lg shadow-md p-8 md:p-12 mb-12">
          <h2 className="text-3xl font-bold text-primary mb-8">Our Core Values</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="border-l-4 border-accent pl-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Excellence</h3>
              <p className="text-gray-700">
                We strive for the highest standards in everything we do, from editorial quality to
                customer service.
              </p>
            </div>
            <div className="border-l-4 border-accent pl-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Innovation</h3>
              <p className="text-gray-700">
                We embrace new technologies and approaches to continuously improve academic
                publishing.
              </p>
            </div>
            <div className="border-l-4 border-accent pl-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Integrity</h3>
              <p className="text-gray-700">
                We maintain the highest ethical standards and are transparent in all our operations.
              </p>
            </div>
            <div className="border-l-4 border-accent pl-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Collaboration</h3>
              <p className="text-gray-700">
                We believe in working together, supporting each other, and building a diverse team.
              </p>
            </div>
          </div>
        </div>

        {/* Diversity Statement */}
        <div className="bg-white rounded-lg shadow-md p-8 md:p-12 mb-12">
          <h2 className="text-3xl font-bold text-primary mb-6">
            Diversity, Equity & Inclusion
          </h2>
          <p className="text-lg text-gray-700 mb-4 leading-relaxed">
            C5K is committed to creating an inclusive environment where everyone feels welcome,
            valued, and empowered to do their best work. We believe that diversity of perspectives,
            backgrounds, and experiences makes us stronger and better able to serve the global
            research community.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            We are an equal opportunity employer and do not discriminate on the basis of race,
            color, religion, gender, sexual orientation, age, disability, or any other protected
            characteristic. We actively encourage applications from underrepresented groups in
            academic publishing.
          </p>
        </div>

        {/* Application Process */}
        <div className="bg-white rounded-lg shadow-md p-8 md:p-12 mb-12">
          <h2 className="text-3xl font-bold text-primary mb-8">Application Process</h2>
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center font-bold text-lg mr-4">
                1
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Submit Application</h3>
                <p className="text-gray-700">
                  Apply online with your resume, cover letter, and any required materials.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center font-bold text-lg mr-4">
                2
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Initial Screening</h3>
                <p className="text-gray-700">
                  Our hiring team reviews applications within 2 weeks of submission.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center font-bold text-lg mr-4">
                3
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Interviews</h3>
                <p className="text-gray-700">
                  Qualified candidates participate in 2-3 rounds of interviews with team members.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center font-bold text-lg mr-4">
                4
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Offer & Onboarding</h3>
                <p className="text-gray-700">
                  Successful candidates receive an offer and begin our comprehensive onboarding
                  program.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-primary to-blue-800 text-white rounded-lg shadow-lg p-8 md:p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Don't See the Right Role?
          </h2>
          <p className="text-xl text-gray-100 mb-8 max-w-2xl mx-auto">
            We're always looking for talented people. Send us your resume and we'll keep you in
            mind for future opportunities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-accent hover:bg-accent-dark text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors"
            >
              Send Your Resume
            </Link>
            <Link
              href="/about"
              className="bg-white hover:bg-gray-100 text-primary px-8 py-4 rounded-lg font-bold text-lg transition-colors"
            >
              Learn More About C5K
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
