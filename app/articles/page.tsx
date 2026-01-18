import Link from "next/link";
import Card from "@/components/ui/Card";

const mockArticles = [
  {
    id: "1",
    title: "AI-Driven Solutions for Mental Health: Early Detection and Intervention",
    authors: ["Dr. John Smith", "Dr. Jane Doe"],
    journal: { code: "PRAIHI", name: "Research and Innovation in Health Informatics" },
    publicationDate: "2024-01-15",
    doi: "10.1234/c5k.2024.001",
    abstract: "This research explores the application of artificial intelligence in mental health care, focusing on early detection systems and intervention strategies. We present a novel framework...",
    keywords: ["AI", "Mental Health", "Early Detection", "Machine Learning"],
    citations: 45,
    downloads: 320,
  },
  {
    id: "2",
    title: "Machine Learning Applications in Business Valuation",
    authors: ["Prof. Michael Johnson"],
    journal: { code: "JBVADA", name: "Business Valuation and Data Analytics" },
    publicationDate: "2024-01-10",
    doi: "10.1234/c5k.2024.002",
    abstract: "An in-depth analysis of machine learning algorithms and their effectiveness in predicting business valuations across various industries. This study compares multiple ML models...",
    keywords: ["Machine Learning", "Business Valuation", "Predictive Analytics"],
    citations: 32,
    downloads: 245,
  },
  {
    id: "3",
    title: "Sustainable Environmental Policies: A Global Perspective",
    authors: ["Dr. Sarah Williams", "Dr. Robert Chen"],
    journal: { code: "AESI", name: "Environmental Studies and Innovation" },
    publicationDate: "2024-01-05",
    doi: "10.1234/c5k.2024.003",
    abstract: "This paper examines sustainable environmental policies implemented globally and their impact on climate change mitigation. We analyze policy effectiveness across 50 countries...",
    keywords: ["Environment", "Sustainability", "Climate Change", "Policy"],
    citations: 67,
    downloads: 421,
  },
  {
    id: "4",
    title: "Leadership in the Digital Age: Challenges and Opportunities",
    authors: ["Prof. David Brown"],
    journal: { code: "ILPROM", name: "International Leadership and Professional Management" },
    publicationDate: "2023-12-28",
    doi: "10.1234/c5k.2023.150",
    abstract: "Exploring how digital transformation is reshaping leadership paradigms and organizational management structures. This research presents insights from 100+ global leaders...",
    keywords: ["Leadership", "Digital Transformation", "Management", "Innovation"],
    citations: 28,
    downloads: 198,
  },
  {
    id: "5",
    title: "Blockchain Technology in Financial Services: A Comprehensive Review",
    authors: ["Dr. Lisa Anderson", "Prof. Mark Thompson"],
    journal: { code: "TBFLI", name: "Business and Financial Leadership Insights" },
    publicationDate: "2023-12-20",
    doi: "10.1234/c5k.2023.145",
    abstract: "This comprehensive review examines the adoption and impact of blockchain technology in financial services, covering banking, insurance, and investment sectors...",
    keywords: ["Blockchain", "Financial Services", "Technology", "Innovation"],
    citations: 53,
    downloads: 387,
  },
  {
    id: "6",
    title: "Social Media Influence on Consumer Behavior in E-Commerce",
    authors: ["Dr. Emily Rodriguez"],
    journal: { code: "OJBEM", name: "Business Economics and Management" },
    publicationDate: "2023-12-15",
    doi: "10.1234/c5k.2023.140",
    abstract: "An empirical study examining how social media platforms influence consumer purchase decisions in online shopping. Data collected from 5,000+ consumers across multiple countries...",
    keywords: ["Social Media", "Consumer Behavior", "E-Commerce", "Marketing"],
    citations: 41,
    downloads: 312,
  },
];

export default function ArticlesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">Browse Articles</h1>
          <p className="text-xl text-gray-100">
            Explore our collection of peer-reviewed research articles
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <h2 className="text-lg font-bold mb-4">Filter Articles</h2>

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Journal</label>
                <select className="w-full border border-gray-300 rounded px-3 py-2">
                  <option>All Journals</option>
                  <option>JITMB</option>
                  <option>PRAIHI</option>
                  <option>JBVADA</option>
                  <option>AESI</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Year</label>
                <select className="w-full border border-gray-300 rounded px-3 py-2">
                  <option>All Years</option>
                  <option>2024</option>
                  <option>2023</option>
                  <option>2022</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Sort By</label>
                <select className="w-full border border-gray-300 rounded px-3 py-2">
                  <option>Most Recent</option>
                  <option>Most Cited</option>
                  <option>Most Downloaded</option>
                </select>
              </div>

              <button className="w-full btn-primary">Apply Filters</button>
            </Card>
          </div>

          {/* Articles List */}
          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">Showing {mockArticles.length} articles</p>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-primary text-white rounded">Grid</button>
                <button className="px-4 py-2 border border-gray-300 rounded">List</button>
              </div>
            </div>

            <div className="space-y-6">
              {mockArticles.map((article) => (
                <Card key={article.id}>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="mb-2">
                        <span className="text-xs bg-primary text-white px-2 py-1 rounded">
                          {article.journal.code}
                        </span>
                      </div>
                      <Link href={`/articles/${article.id}`}>
                        <h2 className="text-xl font-bold text-primary hover:text-primary-dark mb-2">
                          {article.title}
                        </h2>
                      </Link>
                      <p className="text-sm text-gray-600 mb-2">
                        {article.authors.join(", ")}
                      </p>
                      <p className="text-gray-700 mb-3 line-clamp-2">
                        {article.abstract}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {article.keywords.map((keyword) => (
                          <span key={keyword} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                            {keyword}
                          </span>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <span>Published: {article.publicationDate}</span>
                        <span>DOI: {article.doi}</span>
                        <span>Citations: {article.citations}</span>
                        <span>Downloads: {article.downloads}</span>
                      </div>
                    </div>
                    <div className="flex sm:flex-col gap-2">
                      <Link href={`/articles/${article.id}`} className="btn-primary text-sm px-4 py-2 whitespace-nowrap">
                        Read More
                      </Link>
                      <button className="btn-secondary text-sm px-4 py-2 whitespace-nowrap">
                        Download PDF
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center gap-2 mt-8">
              <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100">
                Previous
              </button>
              <button className="px-4 py-2 bg-primary text-white rounded">1</button>
              <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100">2</button>
              <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100">3</button>
              <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
