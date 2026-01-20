"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ConferenceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId] = useState<string>("");
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [downloadingBrochure, setDownloadingBrochure] = useState(false);

  useEffect(() => {
    params.then((resolvedParams) => {
      setId(resolvedParams.id);
    });
  }, [params]);

  // Mock data - in production, this would be fetched from database
  const conferences: Record<string, any> = {
    "1": {
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
      description: "Join leading researchers, practitioners, and industry experts from around the world for three days of cutting-edge presentations, workshops, and networking opportunities in artificial intelligence and machine learning.",
      fullDescription: `The International Conference on Artificial Intelligence and Machine Learning (ICAIML 2024) brings together the global AI community for an immersive three-day event featuring keynote presentations, technical sessions, workshops, and networking opportunities.

      ICAIML 2024 provides a premier platform for researchers, practitioners, and industry leaders to share recent advances, discuss challenges, and explore future directions in AI and ML. The conference features both theoretical contributions and practical applications across various domains.

      With over 500 expected attendees from 50+ countries, ICAIML 2024 offers unparalleled opportunities for collaboration, knowledge exchange, and professional development.`,
      keynotes: [
        {
          name: "Dr. Yann LeCun",
          title: "Chief AI Scientist, Meta",
          topic: "The Future of Deep Learning"
        },
        {
          name: "Dr. Fei-Fei Li",
          title: "Professor, Stanford University",
          topic: "Human-Centered AI"
        },
        {
          name: "Dr. Andrew Ng",
          title: "Founder, DeepLearning.AI",
          topic: "AI Transformation in Industry"
        }
      ],
      schedule: [
        {
          day: "Day 1 - June 15, 2024",
          events: [
            { time: "08:00 - 09:00", event: "Registration & Welcome Coffee" },
            { time: "09:00 - 10:00", event: "Opening Ceremony & Keynote 1" },
            { time: "10:00 - 12:00", event: "Technical Sessions (Parallel Tracks)" },
            { time: "12:00 - 13:30", event: "Lunch & Poster Session" },
            { time: "13:30 - 15:30", event: "Technical Sessions (Parallel Tracks)" },
            { time: "15:30 - 16:00", event: "Coffee Break" },
            { time: "16:00 - 18:00", event: "Workshop Sessions" },
            { time: "19:00 - 21:00", event: "Welcome Reception" }
          ]
        },
        {
          day: "Day 2 - June 16, 2024",
          events: [
            { time: "09:00 - 10:00", event: "Keynote 2" },
            { time: "10:00 - 12:00", event: "Technical Sessions (Parallel Tracks)" },
            { time: "12:00 - 13:30", event: "Lunch & Industry Exhibition" },
            { time: "13:30 - 15:30", event: "Panel Discussions" },
            { time: "15:30 - 16:00", event: "Coffee Break" },
            { time: "16:00 - 18:00", event: "Technical Sessions (Parallel Tracks)" },
            { time: "19:00 - 22:00", event: "Conference Dinner" }
          ]
        },
        {
          day: "Day 3 - June 17, 2024",
          events: [
            { time: "09:00 - 10:00", event: "Keynote 3" },
            { time: "10:00 - 12:00", event: "Technical Sessions (Parallel Tracks)" },
            { time: "12:00 - 13:30", event: "Lunch" },
            { time: "13:30 - 15:00", event: "Best Paper Awards & Closing Ceremony" },
            { time: "15:00 - 17:00", event: "Networking Session" }
          ]
        }
      ],
      registrationFees: {
        earlyBird: {
          period: "Until March 31, 2024",
          inPerson: "$450",
          virtual: "$150",
          student: "40% off"
        },
        regular: {
          period: "April 1 - May 31, 2024",
          inPerson: "$550",
          virtual: "$200",
          student: "40% off"
        },
        late: {
          period: "After June 1, 2024",
          inPerson: "$650",
          virtual: "$250",
          student: "40% off"
        }
      },
      included: [
        "Access to all technical sessions and workshops",
        "Conference proceedings (print and digital)",
        "Welcome reception and coffee breaks",
        "Conference dinner (in-person only)",
        "Certificate of attendance",
        "Networking opportunities",
        "Access to recorded sessions (virtual attendees)"
      ],
      importantDates: [
        { event: "Paper Submission Deadline", date: "May 1, 2024" },
        { event: "Notification of Acceptance", date: "May 20, 2024" },
        { event: "Camera-Ready Submission", date: "June 1, 2024" },
        { event: "Early Bird Registration Ends", date: "March 31, 2024" },
        { event: "Conference Dates", date: "June 15-17, 2024" }
      ],
      venueDetails: {
        name: "Moscone Center",
        address: "747 Howard St, San Francisco, CA 94103",
        description: "The Moscone Center is San Francisco's premier convention facility, located in the heart of the city with easy access to hotels, restaurants, and attractions.",
        hotels: [
          { name: "Marriott Marquis", distance: "0.2 miles", rate: "$250/night" },
          { name: "Hilton San Francisco", distance: "0.3 miles", rate: "$220/night" },
          { name: "Hyatt Regency", distance: "0.5 miles", rate: "$200/night" }
        ]
      }
    },
    "2": {
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
      description: "A premier event bringing together business leaders, innovators, and researchers to explore the latest trends and strategies in business innovation and digital transformation.",
      fullDescription: `The Global Business Innovation Summit (GBIS 2024) is the world's leading forum for business innovation, bringing together C-suite executives, entrepreneurs, academics, and thought leaders to discuss the future of business in the digital age.

      GBIS 2024 features inspiring keynotes, interactive workshops, case study presentations, and extensive networking opportunities. The summit covers all aspects of business innovation, from strategy and culture to technology and implementation.`,
      keynotes: [
        {
          name: "Satya Nadella",
          title: "CEO, Microsoft",
          topic: "Digital Transformation at Scale"
        },
        {
          name: "Sheryl Sandberg",
          title: "Former COO, Meta",
          topic: "Leading Through Change"
        }
      ],
      registrationFees: {
        earlyBird: {
          period: "Until May 31, 2024",
          inPerson: "£550",
          virtual: "£200",
          student: "50% off"
        },
        regular: {
          period: "June 1 - July 10, 2024",
          inPerson: "£650",
          virtual: "£250",
          student: "50% off"
        }
      },
      venueDetails: {
        name: "ExCeL London",
        address: "Royal Victoria Dock, 1 Western Gateway, London E16 1XL",
        description: "ExCeL London is one of Europe's most prestigious and versatile event venues, easily accessible from central London."
      }
    },
    "3": {
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
      description: "Leading cybersecurity and data privacy conference in Asia-Pacific, featuring cutting-edge research and practical insights from industry experts.",
      fullDescription: `The Cybersecurity and Data Privacy Conference (CDPC 2024) is Asia-Pacific's premier gathering for cybersecurity professionals, bringing together experts from industry, government, and academia to address the evolving landscape of cyber threats and data protection.

      CDPC 2024 offers a unique blend of technical presentations, hands-on workshops, and strategic discussions on current and emerging security challenges. Attendees will gain practical insights and actionable strategies for protecting organizations in an increasingly complex threat environment.`,
      registrationFees: {
        earlyBird: {
          period: "Until June 30, 2024",
          inPerson: "S$600",
          virtual: "S$200",
          student: "40% off"
        }
      },
      venueDetails: {
        name: "Marina Bay Sands",
        address: "10 Bayfront Ave, Singapore 018956",
        description: "Marina Bay Sands is Singapore's iconic integrated resort, offering world-class conference facilities with stunning city views."
      }
    }
  };

  // Show loading while params resolve
  if (!id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Get conference or default to ID 1 if not found
  const conference = conferences[id] || conferences["1"];

  const handleDownloadBrochure = () => {
    setDownloadingBrochure(true);
    setTimeout(() => {
      alert("Brochure download would start here. In production, this would download the actual conference brochure PDF.");
      setDownloadingBrochure(false);
    }, 1000);
  };

  const handleRegistration = (formData: any) => {
    // In production, this would submit to API
    alert(`Registration submitted! In production, this would process the registration for ${formData.name}.`);
    setShowRegistrationForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="inline-block bg-white/20 px-4 py-1 rounded-full text-sm font-bold">
              {conference.status}
            </span>
            <span className="inline-block bg-accent px-4 py-1 rounded-full text-sm font-bold">
              {conference.type}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{conference.title}</h1>
          <p className="text-2xl mb-6">{conference.acronym}</p>
          <div className="flex flex-wrap gap-6 text-lg">
            <div className="flex items-center">
              <span className="mr-2">📅</span>
              <span>{conference.date}</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">📍</span>
              <span>{conference.location}</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">🏢</span>
              <span>{conference.venue}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>

              <div className="space-y-3 mb-6">
                <button
                  onClick={() => setShowRegistrationForm(true)}
                  className="w-full bg-accent hover:bg-accent-dark text-white px-6 py-3 rounded-lg font-bold transition-colors"
                >
                  Register Now
                </button>

                <button
                  onClick={handleDownloadBrochure}
                  disabled={downloadingBrochure}
                  className="w-full border-2 border-primary text-primary hover:bg-primary/10 px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50"
                >
                  {downloadingBrochure ? 'Downloading...' : 'Download Brochure'}
                </button>

                <Link
                  href="/submit"
                  className="block w-full text-center border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg font-bold transition-colors"
                >
                  Submit Paper
                </Link>
              </div>

              {/* Important Dates */}
              {conference.importantDates && (
                <div className="border-t border-gray-200 pt-6 mb-6">
                  <h4 className="font-bold text-gray-800 mb-3">Important Dates</h4>
                  <div className="space-y-2">
                    {conference.importantDates.map((item: any, index: number) => (
                      <div key={index} className="text-sm">
                        <p className="text-gray-600">{item.event}</p>
                        <p className="font-semibold text-gray-800">{item.date}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-bold text-gray-800 mb-3">Contact</h4>
                <p className="text-sm text-gray-600 mb-2">
                  For inquiries, please contact:
                </p>
                <p className="text-sm text-primary font-semibold">
                  conference@c5k.com
                </p>
              </div>
            </div>
          </div>

          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-3xl font-bold text-primary mb-4">About the Conference</h2>
              <div className="text-gray-700 leading-relaxed space-y-4">
                {conference.fullDescription.split('\n\n').map((paragraph: string, index: number) => (
                  <p key={index}>{paragraph.trim()}</p>
                ))}
              </div>
            </div>

            {/* Topics */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-3xl font-bold text-primary mb-4">Key Topics</h2>
              <div className="flex flex-wrap gap-2">
                {conference.topics.map((topic: string, index: number) => (
                  <span
                    key={index}
                    className="inline-block bg-gray-100 text-gray-700 px-4 py-2 rounded-lg"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            {/* Keynote Speakers */}
            {conference.keynotes && (
              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-3xl font-bold text-primary mb-6">Keynote Speakers</h2>
                <div className="space-y-6">
                  {conference.keynotes.map((keynote: any, index: number) => (
                    <div key={index} className="border-l-4 border-accent pl-6">
                      <h3 className="text-xl font-bold text-gray-800">{keynote.name}</h3>
                      <p className="text-gray-600 mb-2">{keynote.title}</p>
                      <p className="text-gray-800 font-semibold">{keynote.topic}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Schedule */}
            {conference.schedule && (
              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-3xl font-bold text-primary mb-6">Conference Schedule</h2>
                <div className="space-y-6">
                  {conference.schedule.map((day: any, dayIndex: number) => (
                    <div key={dayIndex}>
                      <h3 className="text-xl font-bold text-gray-800 mb-4">{day.day}</h3>
                      <div className="space-y-3">
                        {day.events.map((event: any, eventIndex: number) => (
                          <div key={eventIndex} className="flex border-b border-gray-200 pb-3">
                            <div className="w-32 flex-shrink-0 text-primary font-semibold">
                              {event.time}
                            </div>
                            <div className="flex-1 text-gray-800">{event.event}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Registration Fees */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-3xl font-bold text-primary mb-6">Registration Fees</h2>
              <div className="space-y-6">
                {Object.entries(conference.registrationFees).map(([key, value]: [string, any]) => (
                  <div key={key} className="border-l-4 border-accent pl-6">
                    <h3 className="text-xl font-bold text-gray-800 capitalize mb-2">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </h3>
                    <p className="text-gray-600 mb-3">{value.period}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">In-Person</p>
                        <p className="text-2xl font-bold text-accent">{value.inPerson}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Virtual</p>
                        <p className="text-2xl font-bold text-accent">{value.virtual}</p>
                      </div>
                    </div>
                    {value.student && (
                      <p className="text-sm text-gray-600 mt-2">Student Discount: {value.student}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* What's Included */}
            {conference.included && (
              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-3xl font-bold text-primary mb-6">Registration Includes</h2>
                <ul className="grid md:grid-cols-2 gap-3">
                  {conference.included.map((item: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <span className="text-accent mr-2 mt-1">✓</span>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Venue */}
            {conference.venueDetails && (
              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-3xl font-bold text-primary mb-6">Venue Information</h2>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{conference.venueDetails.name}</h3>
                <p className="text-gray-600 mb-4">{conference.venueDetails.address}</p>
                <p className="text-gray-700 mb-6">{conference.venueDetails.description}</p>

                {conference.venueDetails.hotels && (
                  <div>
                    <h4 className="font-bold text-gray-800 mb-3">Nearby Hotels</h4>
                    <div className="space-y-3">
                      {conference.venueDetails.hotels.map((hotel: any, index: number) => (
                        <div key={index} className="flex justify-between items-center border-b border-gray-200 pb-3">
                          <div>
                            <p className="font-semibold text-gray-800">{hotel.name}</p>
                            <p className="text-sm text-gray-600">{hotel.distance}</p>
                          </div>
                          <p className="text-accent font-semibold">{hotel.rate}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8">
          <Link
            href="/conferences"
            className="inline-flex items-center text-primary hover:text-accent font-semibold"
          >
            ← Back to All Conferences
          </Link>
        </div>
      </div>

      {/* Registration Modal */}
      {showRegistrationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-800">Conference Registration</h3>
              <button
                onClick={() => setShowRegistrationForm(false)}
                className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-8">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = {
                    name: (e.target as any).fullName.value,
                    email: (e.target as any).email.value,
                    organization: (e.target as any).organization.value,
                    type: (e.target as any).registrationType.value,
                    attendance: (e.target as any).attendanceType.value
                  };
                  handleRegistration(formData);
                }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Organization *
                  </label>
                  <input
                    type="text"
                    name="organization"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="Enter your organization"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Registration Type *
                  </label>
                  <select
                    name="registrationType"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  >
                    <option value="">Select type</option>
                    <option value="academic">Academic/Researcher</option>
                    <option value="industry">Industry Professional</option>
                    <option value="student">Student</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Attendance Type *
                  </label>
                  <select
                    name="attendanceType"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  >
                    <option value="">Select attendance type</option>
                    <option value="inperson">In-Person</option>
                    <option value="virtual">Virtual</option>
                  </select>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowRegistrationForm(false)}
                    className="flex-1 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-accent hover:bg-accent-dark text-white px-6 py-3 rounded-lg font-bold transition-colors"
                  >
                    Submit Registration
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
