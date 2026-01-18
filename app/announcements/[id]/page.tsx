import Link from "next/link";

export default function AnnouncementDetailPage({ params }: { params: { id: string } }) {
  // In a real app, this would fetch from database
  const announcements: Record<string, any> = {
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
  };

  const announcement = announcements[params.id] || {
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
            <span className="text-gray-900">Announcement #{params.id}</span>
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
