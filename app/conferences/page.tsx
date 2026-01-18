import Link from "next/link";

export default function ConferencesPage() {
  const upcomingConferences = [
    {
      id: 1,
      title: "International Conference on Artificial Intelligence and Machine Learning",
      acronym: "ICAIML 2024",
      date: "June 15-17, 2024",
      location: "San Francisco, USA",
      venue: "Moscone Center",
      type: "Hybrid (In-person & Virtual)",
      deadline: "May 1, 2024",
      status: "Registration Open",
      topics: ["Machine Learning", "Deep Learning", "Neural Networks", "AI Applications"],
    },
    {
      id: 2,
      title: "Global Business Innovation Summit",
      acronym: "GBIS 2024",
      date: "July 22-24, 2024",
      location: "London, UK",
      venue: "ExCeL London",
      type: "Hybrid (In-person & Virtual)",
      deadline: "June 5, 2024",
      status: "Call for Papers",
      topics: ["Digital Transformation", "Innovation Management", "Business Strategy", "Entrepreneurship"],
    },
    {
      id: 3,
      title: "Cybersecurity and Data Privacy Conference",
      acronym: "CDPC 2024",
      date: "August 10-12, 2024",
      location: "Singapore",
      venue: "Marina Bay Sands",
      type: "Hybrid (In-person & Virtual)",
      deadline: "June 20, 2024",
      status: "Registration Open",
      topics: ["Cybersecurity", "Data Privacy", "Network Security", "Threat Intelligence"],
    },
  ];

  const pastConferences = [
    {
      id: 1,
      title: "Technology and Society Conference 2023",
      date: "November 2023",
      location: "New York, USA",
      papers: 156,
      attendees: 450,
    },
    {
      id: 2,
      title: "Business Analytics Summit 2023",
      date: "September 2023",
      location: "Tokyo, Japan",
      papers: 142,
      attendees: 380,
    },
    {
      id: 3,
      title: "Cloud Computing and IoT Conference 2023",
      date: "July 2023",
      location: "Berlin, Germany",
      papers: 168,
      attendees: 520,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Academic Conferences</h1>
          <p className="text-xl md:text-2xl text-gray-100 max-w-3xl">
            Connect with leading researchers and present your work at prestigious international events
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Info Section */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-primary mb-4">IJAISM Conferences</h2>
          <p className="text-lg text-gray-700 mb-4 leading-relaxed">
            IJAISM organizes world-class academic conferences that bring together researchers,
            practitioners, and industry leaders from around the globe. Our conferences provide
            platforms for knowledge exchange, networking, and collaboration across disciplines.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            We offer both in-person and virtual participation options to ensure accessibility
            for the global research community.
          </p>
        </div>

        {/* Submit Paper CTA */}
        <div className="bg-accent text-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h3 className="text-2xl font-bold mb-2">Submit Your Research</h3>
              <p className="text-gray-100">
                Present your work at our upcoming conferences and engage with peers
              </p>
            </div>
            <Link
              href="/submit"
              className="bg-white text-accent hover:bg-gray-100 px-8 py-3 rounded-lg font-bold transition-colors whitespace-nowrap"
            >
              Submit Paper
            </Link>
          </div>
        </div>

        {/* Upcoming Conferences */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-primary mb-6">Upcoming Conferences</h2>
          <div className="grid gap-6">
            {upcomingConferences.map((conference) => (
              <div
                key={conference.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border-l-4 border-accent"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className="inline-block bg-accent text-white px-4 py-1 rounded-full text-sm font-bold">
                        {conference.status}
                      </span>
                      <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                        {conference.type}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-primary mb-2">
                      {conference.title}
                    </h3>
                    <p className="text-lg font-semibold text-gray-700 mb-3">{conference.acronym}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-gray-600 font-semibold mb-1">📅 Date</p>
                    <p className="text-gray-800">{conference.date}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-semibold mb-1">📍 Location</p>
                    <p className="text-gray-800">{conference.location}</p>
                    <p className="text-gray-600 text-sm">{conference.venue}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-semibold mb-1">⏰ Submission Deadline</p>
                    <p className="text-gray-800">{conference.deadline}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-600 font-semibold mb-2">Key Topics</p>
                  <div className="flex flex-wrap gap-2">
                    {conference.topics.map((topic, index) => (
                      <span
                        key={index}
                        className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded font-medium transition-colors">
                    View Details
                  </button>
                  <button className="border border-primary text-primary hover:bg-primary/10 px-6 py-2 rounded font-medium transition-colors">
                    Register Now
                  </button>
                  <button className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2 rounded font-medium transition-colors">
                    Download Brochure
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Past Conferences */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-primary mb-6">Past Conferences</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {pastConferences.map((conference) => (
              <div
                key={conference.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200"
              >
                <h3 className="text-lg font-bold text-primary mb-3">
                  {conference.title}
                </h3>
                <div className="space-y-2 text-gray-700">
                  <p><span className="font-semibold">Date:</span> {conference.date}</p>
                  <p><span className="font-semibold">Location:</span> {conference.location}</p>
                  <p><span className="font-semibold">Papers:</span> {conference.papers}</p>
                  <p><span className="font-semibold">Attendees:</span> {conference.attendees}</p>
                </div>
                <button className="mt-4 w-full border border-primary text-primary hover:bg-primary/10 px-4 py-2 rounded font-medium transition-colors">
                  View Proceedings
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-primary mb-6">Conference Benefits</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center font-bold text-lg mr-4">
                🎤
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Present Your Research</h3>
                <p className="text-gray-700">
                  Share your findings with an engaged audience of experts and peers.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center font-bold text-lg mr-4">
                🤝
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Network Globally</h3>
                <p className="text-gray-700">
                  Connect with researchers and practitioners from around the world.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center font-bold text-lg mr-4">
                📚
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Publish Proceedings</h3>
                <p className="text-gray-700">
                  All accepted papers are published in our indexed proceedings.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center font-bold text-lg mr-4">
                🌐
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Hybrid Format</h3>
                <p className="text-gray-700">
                  Participate in-person or virtually for maximum flexibility.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Guidelines Section */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-3xl font-bold text-primary mb-6">Submission Guidelines</h2>
          <div className="space-y-4">
            <div className="border-l-4 border-accent pl-4">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Paper Format</h3>
              <p className="text-gray-700">
                Submissions must follow the IJAISM paper format (6-12 pages, IEEE style). See our{" "}
                <Link href="/paper-format" className="text-accent hover:underline font-semibold">
                  paper format guidelines
                </Link>.
              </p>
            </div>
            <div className="border-l-4 border-accent pl-4">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Review Process</h3>
              <p className="text-gray-700">
                All submissions undergo double-blind peer review by at least three experts.
              </p>
            </div>
            <div className="border-l-4 border-accent pl-4">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Registration</h3>
              <p className="text-gray-700">
                At least one author must register and present the accepted paper.
              </p>
            </div>
            <div className="border-l-4 border-accent pl-4">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Publication</h3>
              <p className="text-gray-700">
                Accepted papers are published in conference proceedings with ISBN.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
