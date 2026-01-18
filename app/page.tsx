import Link from "next/link";
import Card from "@/components/ui/Card";

// Mock data for demo (will be replaced with database queries)
const mockJournals = [
  { id: "1", code: "JITMB", fullName: "Journal of Information Technology and Management in Business", coverImageUrl: "" },
  { id: "2", code: "JSAE", fullName: "Journal of Social and Anthropological Explorations", coverImageUrl: "" },
  { id: "3", code: "AMLID", fullName: "Accounting, Management, and Leadership in Development", coverImageUrl: "" },
  { id: "4", code: "OJBEM", fullName: "Business Economics and Management", coverImageUrl: "" },
  { id: "5", code: "PRAIHI", fullName: "Research and Innovation in Health Informatics", coverImageUrl: "" },
  { id: "6", code: "JBVADA", fullName: "Business Valuation and Data Analytics", coverImageUrl: "" },
  { id: "7", code: "JAMSAI", fullName: "Applied Mathematics, Statistics, and AI", coverImageUrl: "" },
  { id: "8", code: "AESI", fullName: "Environmental Studies and Innovation", coverImageUrl: "" },
  { id: "9", code: "ILPROM", fullName: "International Leadership and Professional Management", coverImageUrl: "" },
  { id: "10", code: "TBFLI", fullName: "Business and Financial Leadership Insights", coverImageUrl: "" },
  { id: "11", code: "PMSRI", fullName: "Public Management and Social Research Insights", coverImageUrl: "" },
  { id: "12", code: "DRSDR", fullName: "Demographic Research and Social Development Reviews", coverImageUrl: "" },
];

const mockArticles = [
  {
    id: "1",
    title: "AI-Driven Solutions for Mental Health: Early Detection and Intervention",
    authors: "Dr. John Smith, Dr. Jane Doe",
    abstract: "This research explores the application of artificial intelligence in mental health care, focusing on early detection systems and intervention strategies...",
    journal: "PRAIHI",
  },
  {
    id: "2",
    title: "Machine Learning Applications in Business Valuation",
    authors: "Prof. Michael Johnson",
    abstract: "An in-depth analysis of machine learning algorithms and their effectiveness in predicting business valuations across various industries...",
    journal: "JBVADA",
  },
  {
    id: "3",
    title: "Sustainable Environmental Policies: A Global Perspective",
    authors: "Dr. Sarah Williams, Dr. Robert Chen",
    abstract: "This paper examines sustainable environmental policies implemented globally and their impact on climate change mitigation...",
    journal: "AESI",
  },
  {
    id: "4",
    title: "Leadership in the Digital Age: Challenges and Opportunities",
    authors: "Prof. David Brown",
    abstract: "Exploring how digital transformation is reshaping leadership paradigms and organizational management structures...",
    journal: "ILPROM",
  },
];

const mockAnnouncements = [
  {
    id: "1",
    title: "Call for Papers: International Conference on AI and Healthcare 2026",
    excerpt: "Submit your research on AI applications in healthcare by March 31, 2026.",
    thumbnailUrl: "",
  },
  {
    id: "2",
    title: "New Journal Launch: Journal of Digital Transformation",
    excerpt: "We are excited to announce the launch of our newest journal focusing on digital transformation.",
    thumbnailUrl: "",
  },
  {
    id: "3",
    title: "Special Issue: Climate Change and Sustainable Development",
    excerpt: "Accepting submissions for our special issue on climate change and sustainable development goals.",
    thumbnailUrl: "",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-primary to-primary-light text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Welcome to IJAISM Academic Publishing Platform
          </h1>
          <p className="text-xl md:text-2xl mb-4 text-gray-100">
            Dedicated to publishing groundbreaking research and promoting innovative ideas
          </p>
          <p className="text-lg mb-8 text-gray-200">
            in the fields of information technology, business management, and related disciplines
          </p>
          <p className="text-base mb-8 text-gray-300 max-w-3xl mx-auto">
            Our goal is to minimize the delay in sharing new ideas and discoveries with the world,
            making high-quality, peer-reviewed journals available online through our fast 4-reviewer approval system.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/submit" className="btn-accent">
              Submit Your Research
            </Link>
            <Link href="/journals" className="btn-secondary bg-white text-primary hover:bg-gray-100">
              Browse Journals
            </Link>
          </div>
        </div>
      </section>

      {/* Latest Announcements */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8 text-center">Latest Announcements</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mockAnnouncements.map((announcement) => (
              <Card key={announcement.id}>
                <div className="h-40 bg-gray-200 rounded mb-4 flex items-center justify-center">
                  <span className="text-gray-400">Image Placeholder</span>
                </div>
                <h3 className="text-lg font-bold mb-2">{announcement.title}</h3>
                <p className="text-gray-600 mb-4">{announcement.excerpt}</p>
                <Link href={`/announcements/${announcement.id}`} className="text-primary hover:text-primary-dark font-semibold">
                  Read More →
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Academic Journals */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8 text-center">Academic Journals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mockJournals.map((journal) => (
              <Link key={journal.id} href={`/journals/${journal.code.toLowerCase()}`}>
                <Card className="h-full">
                  <div className="h-48 bg-gradient-to-br from-primary-light to-primary rounded mb-4 flex items-center justify-center">
                    <span className="text-white text-3xl font-bold">{journal.code}</span>
                  </div>
                  <h3 className="text-sm font-bold text-center">{journal.fullName}</h3>
                </Card>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/journals" className="btn-primary">
              View All Journals
            </Link>
          </div>
        </div>
      </section>

      {/* Latest Articles */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8 text-center">Latest Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mockArticles.map((article) => (
              <Card key={article.id}>
                <div className="mb-2">
                  <span className="text-xs bg-primary text-white px-2 py-1 rounded">
                    {article.journal}
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-2">{article.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{article.authors}</p>
                <p className="text-sm text-gray-700 mb-4 line-clamp-3">{article.abstract}</p>
                <Link href={`/articles/${article.id}`} className="text-primary hover:text-primary-dark font-semibold">
                  Read More →
                </Link>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/articles" className="btn-primary">
              View All Articles
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Subscription */}
      <section className="py-16 bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Subscribe to IJAISM for Updates</h2>
          <p className="text-lg mb-8">Stay informed about the latest research, publications, and academic events.</p>
          <form className="flex flex-col sm:flex-row gap-4 justify-center">
            <input
              type="email"
              placeholder="Enter your email"
              className="px-6 py-3 rounded text-gray-900 w-full sm:w-96"
            />
            <button type="submit" className="btn-accent">
              Subscribe
            </button>
          </form>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">12</div>
              <div className="text-gray-600">Academic Journals</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">1000+</div>
              <div className="text-gray-600">Published Articles</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-gray-600">Active Researchers</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">50+</div>
              <div className="text-gray-600">Countries</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
