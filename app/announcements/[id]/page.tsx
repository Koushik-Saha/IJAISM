"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AnnouncementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string>("");

  useEffect(() => {
    params.then((resolvedParams) => {
      setId(resolvedParams.id);
    });
  }, [params]);

  // In a real app, this would fetch from database
  const announcementDetails: Record<string, any> = {
    "1": {
      id: 1,
      title: "New Special Issue: AI Ethics and Governance",
      date: "2024-01-15",
      category: "Journal",
      priority: "high",
      author: "Editorial Board",
      content: `
        <p class="mb-4">We are excited to announce a special issue on <strong>AI Ethics and Governance</strong> in the Journal of Advanced Machine Learning and Artificial Intelligence (JAMLAI).</p>

        <h2 class="text-2xl font-bold text-primary mb-4 mt-6">Call for Papers</h2>
        <p class="mb-4">This special issue aims to explore the ethical implications and governance frameworks necessary for responsible AI development and deployment. We invite original research articles, review papers, and case studies that address the following topics:</p>

        <ul class="list-disc ml-6 mb-4 space-y-2">
          <li>Ethical frameworks for AI development</li>
          <li>AI governance policies and regulations</li>
          <li>Algorithmic bias and fairness</li>
          <li>Privacy and data protection in AI systems</li>
          <li>Transparency and explainability in AI</li>
          <li>AI accountability and responsibility</li>
          <li>Human rights in the age of AI</li>
          <li>Case studies of ethical AI implementation</li>
        </ul>

        <h2 class="text-2xl font-bold text-primary mb-4 mt-6">Important Dates</h2>
        <ul class="mb-4 space-y-2">
          <li><strong>Submission Deadline:</strong> March 31, 2024</li>
          <li><strong>First Review:</strong> April 30, 2024</li>
          <li><strong>Revised Submission:</strong> May 31, 2024</li>
          <li><strong>Final Decision:</strong> June 30, 2024</li>
          <li><strong>Publication:</strong> August 2024</li>
        </ul>

        <h2 class="text-2xl font-bold text-primary mb-4 mt-6">Guest Editors</h2>
        <ul class="mb-4 space-y-3">
          <li>
            <strong>Dr. Sarah Johnson</strong><br/>
            Professor of Computer Science, Stanford University
          </li>
          <li>
            <strong>Dr. Michael Chen</strong><br/>
            Associate Professor of AI Ethics, MIT
          </li>
          <li>
            <strong>Dr. Emily Rodriguez</strong><br/>
            Senior Researcher, Oxford Internet Institute
          </li>
        </ul>

        <h2 class="text-2xl font-bold text-primary mb-4 mt-6">Submission Guidelines</h2>
        <p class="mb-4">All submissions should follow the JAMLAI author guidelines and be submitted through our online submission system. Papers will undergo rigorous peer review by our 4-reviewer system, ensuring high-quality publications.</p>

        <p class="mb-4">For more information, please contact the guest editors at <a href="mailto:ai-ethics-special@c5k.com" class="text-accent hover:underline">ai-ethics-special@c5k.com</a></p>
      `,
    },
    "2": {
      id: 2,
      title: "ICAIML 2024 Conference Registration Now Open",
      date: "2024-01-10",
      category: "Conference",
      priority: "high",
      author: "Conference Committee",
      content: `
        <p class="mb-4">Early bird registration is now available for the <strong>International Conference on Artificial Intelligence and Machine Learning (ICAIML 2024)</strong> taking place June 15-17, 2024 in San Francisco, USA.</p>

        <h2 class="text-2xl font-bold text-primary mb-4 mt-6">Conference Details</h2>
        <p class="mb-4">Join leading researchers, practitioners, and industry experts from around the world for three days of cutting-edge presentations, workshops, and networking opportunities.</p>

        <ul class="list-disc ml-6 mb-4 space-y-2">
          <li><strong>Dates:</strong> June 15-17, 2024</li>
          <li><strong>Location:</strong> Moscone Center, San Francisco, USA</li>
          <li><strong>Format:</strong> Hybrid (In-person & Virtual)</li>
          <li><strong>Paper Submission Deadline:</strong> May 1, 2024</li>
        </ul>

        <h2 class="text-2xl font-bold text-primary mb-4 mt-6">Registration Fees</h2>
        <ul class="mb-4 space-y-2">
          <li><strong>Early Bird (Until March 31):</strong> $450 (In-person) / $150 (Virtual)</li>
          <li><strong>Regular (April 1 - May 31):</strong> $550 (In-person) / $200 (Virtual)</li>
          <li><strong>Late (After June 1):</strong> $650 (In-person) / $250 (Virtual)</li>
          <li><strong>Student Discount:</strong> 40% off all rates</li>
        </ul>

        <p class="mb-4">Register now to secure your spot and take advantage of early bird pricing. Visit our <a href="/conferences" class="text-accent hover:underline">conference page</a> for more information and to register.</p>
      `,
    },
    "3": {
      id: 3,
      title: "IJAISM Research Scholarship Program Announced",
      date: "2024-01-05",
      category: "Scholarship",
      priority: "high",
      author: "IJAISM Foundation",
      content: `
        <p class="mb-4">IJAISM is proud to launch a new <strong>Research Scholarship Program</strong> supporting doctoral researchers in information technology and business management. Applications open February 1, 2024.</p>

        <h2 class="text-2xl font-bold text-primary mb-4 mt-6">Scholarship Details</h2>
        <p class="mb-4">We are offering 10 full scholarships to outstanding doctoral candidates conducting research in areas aligned with IJAISM's mission.</p>

        <ul class="list-disc ml-6 mb-4 space-y-2">
          <li><strong>Award Amount:</strong> $25,000 per year (renewable for up to 3 years)</li>
          <li><strong>Number of Awards:</strong> 10 scholarships</li>
          <li><strong>Eligibility:</strong> Doctoral students in IT, Business Management, or related fields</li>
          <li><strong>Application Deadline:</strong> March 15, 2024</li>
        </ul>

        <h2 class="text-2xl font-bold text-primary mb-4 mt-6">Benefits</h2>
        <ul class="list-disc ml-6 mb-4 space-y-2">
          <li>Annual stipend of $25,000</li>
          <li>Conference travel support</li>
          <li>Publishing fee waivers</li>
          <li>Mentorship from IJAISM editorial board members</li>
          <li>Networking opportunities with global researchers</li>
        </ul>

        <p class="mb-4">For application guidelines and requirements, please contact <a href="mailto:scholarships@c5k.com" class="text-accent hover:underline">scholarships@c5k.com</a></p>
      `,
    },
    "4": {
      id: 4,
      title: "Updated Author Guidelines for 2024",
      date: "2024-01-03",
      category: "Guidelines",
      priority: "medium",
      author: "Editorial Team",
      content: `
        <p class="mb-4">We have updated our <strong>Author Guidelines for 2024</strong> to include new formatting requirements and best practices. All authors should review the updated guidelines before submission.</p>

        <h2 class="text-2xl font-bold text-primary mb-4 mt-6">Key Changes</h2>
        <ul class="list-disc ml-6 mb-4 space-y-2">
          <li>Updated citation style (now using APA 7th edition)</li>
          <li>New requirements for data availability statements</li>
          <li>Enhanced guidelines for figures and tables</li>
          <li>Expanded ethics and conflicts of interest section</li>
          <li>Updated open data and reproducibility requirements</li>
        </ul>

        <h2 class="text-2xl font-bold text-primary mb-4 mt-6">What You Need to Do</h2>
        <p class="mb-4">Please review the updated guidelines available on our <a href="/author-guidelines" class="text-accent hover:underline">Author Guidelines page</a> before submitting your next manuscript. All submissions received after January 15, 2024 must comply with the new guidelines.</p>

        <p class="mb-4">If you have questions about the new requirements, please contact our editorial office at <a href="mailto:editorial@c5k.com" class="text-accent hover:underline">editorial@c5k.com</a></p>
      `,
    },
    "5": {
      id: 5,
      title: "New Editorial Board Members Appointed",
      date: "2023-12-28",
      category: "Editorial",
      priority: "medium",
      author: "Chief Editor",
      content: `
        <p class="mb-4">IJAISM welcomes <strong>five distinguished researchers</strong> to our editorial boards across multiple journals, strengthening our commitment to academic excellence.</p>

        <h2 class="text-2xl font-bold text-primary mb-4 mt-6">New Editorial Board Members</h2>
        <ul class="mb-4 space-y-3">
          <li>
            <strong>Dr. Maria Garcia</strong><br/>
            Professor of Data Science, UC Berkeley<br/>
            <em>Journal of Business Value and Data Analytics</em>
          </li>
          <li>
            <strong>Dr. James Park</strong><br/>
            Associate Professor of Cybersecurity, Georgia Tech<br/>
            <em>Digital Rights, Security, and Data Regulations</em>
          </li>
          <li>
            <strong>Dr. Aisha Rahman</strong><br/>
            Senior Researcher, Microsoft Research<br/>
            <em>Advances in Machine Learning and Intelligent Data</em>
          </li>
          <li>
            <strong>Dr. Thomas Mueller</strong><br/>
            Professor of Business Management, University of Munich<br/>
            <em>Open Journal of Business and Economic Management</em>
          </li>
          <li>
            <strong>Dr. Yuki Tanaka</strong><br/>
            Associate Professor of AI Ethics, University of Tokyo<br/>
            <em>Journal of Advances in Management Sciences and Artificial Intelligence</em>
          </li>
        </ul>

        <p class="mb-4">We are honored to have these distinguished scholars join our editorial team and look forward to their contributions to advancing research excellence.</p>
      `,
    },
    "6": {
      id: 6,
      title: "Call for Papers: Business Analytics Special Issue",
      date: "2023-12-20",
      category: "Journal",
      priority: "high",
      author: "Guest Editors",
      content: `
        <p class="mb-4">The <strong>Journal of Business Value and Data Analytics</strong> is seeking submissions for a special issue on advanced business analytics applications. Deadline: April 15, 2024.</p>

        <h2 class="text-2xl font-bold text-primary mb-4 mt-6">Topics of Interest</h2>
        <ul class="list-disc ml-6 mb-4 space-y-2">
          <li>Predictive analytics in business decision-making</li>
          <li>Big data analytics for competitive advantage</li>
          <li>Machine learning applications in business</li>
          <li>Real-time analytics and business intelligence</li>
          <li>Data-driven strategy and innovation</li>
          <li>Customer analytics and personalization</li>
          <li>Supply chain analytics and optimization</li>
        </ul>

        <h2 class="text-2xl font-bold text-primary mb-4 mt-6">Important Dates</h2>
        <ul class="mb-4 space-y-2">
          <li><strong>Submission Deadline:</strong> April 15, 2024</li>
          <li><strong>First Review:</strong> May 30, 2024</li>
          <li><strong>Final Decision:</strong> July 15, 2024</li>
          <li><strong>Publication:</strong> September 2024</li>
        </ul>

        <p class="mb-4">Submit your paper through our <a href="/submit" class="text-accent hover:underline">online submission system</a>.</p>
      `,
    },
    "7": {
      id: 7,
      title: "IJAISM Platform Update: Enhanced Features",
      date: "2023-12-15",
      category: "Platform",
      priority: "low",
      author: "Development Team",
      content: `
        <p class="mb-4">Our platform has been updated with <strong>new features</strong> including improved manuscript tracking, enhanced reviewer dashboard, and mobile responsiveness.</p>

        <h2 class="text-2xl font-bold text-primary mb-4 mt-6">What's New</h2>
        <ul class="list-disc ml-6 mb-4 space-y-2">
          <li><strong>Enhanced Dashboard:</strong> New visualization tools for tracking submissions</li>
          <li><strong>Mobile Optimization:</strong> Full mobile responsiveness across all pages</li>
          <li><strong>Improved Notifications:</strong> Real-time email and in-app notifications</li>
          <li><strong>Advanced Search:</strong> Better filtering and search capabilities</li>
          <li><strong>Reviewer Tools:</strong> Enhanced review interface with better formatting options</li>
          <li><strong>Performance:</strong> 50% faster page load times</li>
        </ul>

        <p class="mb-4">These improvements are part of our ongoing commitment to providing the best possible experience for authors, reviewers, and editors.</p>

        <p class="mb-4">If you encounter any issues or have suggestions for future improvements, please contact our support team at <a href="mailto:support@c5k.com" class="text-accent hover:underline">support@c5k.com</a></p>
      `,
    },
    "8": {
      id: 8,
      title: "Partnership with Leading Universities",
      date: "2023-12-10",
      category: "Partnership",
      priority: "medium",
      author: "IJAISM Leadership",
      content: `
        <p class="mb-4">IJAISM announces <strong>strategic partnerships</strong> with Stanford, MIT, and Oxford to promote open access research and collaborative publishing initiatives.</p>

        <h2 class="text-2xl font-bold text-primary mb-4 mt-6">Partnership Benefits</h2>
        <ul class="list-disc ml-6 mb-4 space-y-2">
          <li><strong>Open Access:</strong> Subsidized publishing fees for researchers from partner institutions</li>
          <li><strong>Research Collaboration:</strong> Joint research initiatives and special issues</li>
          <li><strong>Student Support:</strong> Discounted membership and conference rates</li>
          <li><strong>Faculty Engagement:</strong> Opportunities for editorial board participation</li>
          <li><strong>Knowledge Sharing:</strong> Collaborative workshops and seminars</li>
        </ul>

        <h2 class="text-2xl font-bold text-primary mb-4 mt-6">About the Partners</h2>
        <p class="mb-4">These partnerships bring together some of the world's leading research institutions to advance open access publishing and promote collaborative research in information technology and business management.</p>

        <p class="mb-4">We are excited about the opportunities these partnerships create for our global research community and look forward to many productive collaborations.</p>
      `,
    },
  };

  // Show loading while params resolve
  if (!id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const announcement = announcementDetails[id] || {
    title: "Announcement Not Found",
    date: new Date().toISOString(),
    category: "General",
    priority: "low",
    author: "IJAISM Team",
    content: "<p>The announcement you are looking for could not be found.</p>",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center text-sm text-gray-600">
            <Link href="/" className="hover:text-primary">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/announcements" className="hover:text-primary">
              Announcements
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">Announcement #{id}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <article className="bg-white rounded-lg shadow-md p-8 md:p-12">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {announcement.priority === "high" && (
                <span className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold uppercase">
                  Important
                </span>
              )}
              <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                {announcement.category}
              </span>
              <span className="text-sm text-gray-600">
                {new Date(announcement.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
              {announcement.title}
            </h1>

            <div className="flex items-center text-gray-600">
              <span className="font-medium">Posted by {announcement.author}</span>
            </div>
          </div>

          {/* Content */}
          <div
            className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: announcement.content }}
          />

          {/* Actions */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-wrap gap-4">
              <Link
                href="/submit"
                className="bg-accent hover:bg-accent-dark text-white px-8 py-3 rounded-lg font-bold transition-colors"
              >
                Submit Your Paper
              </Link>
              <Link
                href="/author-guidelines"
                className="border border-primary text-primary hover:bg-primary/10 px-8 py-3 rounded-lg font-bold transition-colors"
              >
                View Author Guidelines
              </Link>
            </div>
          </div>

          {/* Back Link */}
          <div className="mt-8">
            <Link
              href="/announcements"
              className="inline-flex items-center text-primary hover:text-accent font-semibold"
            >
              ← Back to All Announcements
            </Link>
          </div>
        </article>

        {/* Related Announcements */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-primary mb-6">Related Announcements</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Link href="/announcements/2" className="block">
              <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border-l-4 border-accent">
                <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-2">
                  Conference
                </span>
                <h3 className="text-lg font-bold text-primary mb-2 hover:text-accent transition-colors">
                  ICAIML 2024 Conference Registration Now Open
                </h3>
                <p className="text-sm text-gray-600">January 10, 2024</p>
              </div>
            </Link>
            <Link href="/announcements/3" className="block">
              <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border-l-4 border-accent">
                <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-2">
                  Scholarship
                </span>
                <h3 className="text-lg font-bold text-primary mb-2 hover:text-accent transition-colors">
                  IJAISM Research Scholarship Program Announced
                </h3>
                <p className="text-sm text-gray-600">January 5, 2024</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
