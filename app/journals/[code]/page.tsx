import Link from "next/link";
import Card from "@/components/ui/Card";

// Mock data - would come from database
const journalData: { [key: string]: any } = {
  jitmb: {
    code: "JITMB",
    fullName: "Journal of Information Technology and Management in Business",
    description: "The Journal of Information Technology and Management in Business (JITMB) publishes cutting-edge research at the intersection of information technology and business management.",
    aimsAndScope: "JITMB welcomes original research articles, reviews, and case studies that explore innovative applications of IT in business contexts, including but not limited to: enterprise systems, digital transformation, IT strategy, e-commerce, and business analytics.",
    issn: "2456-7890",
    eIssn: "2456-7890E",
    impactFactor: 2.5,
    frequency: "Quarterly",
    articleProcessingCharge: 500,
    editorInChief: "Dr. Robert Smith",
    institution: "MIT, USA",
  },
};

const mockArticles = [
  {
    id: "1",
    title: "Digital Transformation Strategies for Modern Enterprises",
    authors: "Dr. Jane Wilson, Prof. Michael Chen",
    publicationDate: "2024-01-15",
    volume: 5,
    issue: 1,
    pages: "1-18",
  },
  {
    id: "2",
    title: "AI-Powered Business Intelligence: A Comprehensive Review",
    authors: "Dr. Sarah Johnson",
    publicationDate: "2024-01-15",
    volume: 5,
    issue: 1,
    pages: "19-35",
  },
  {
    id: "3",
    title: "Cybersecurity in Cloud-Based ERP Systems",
    authors: "Prof. David Brown, Dr. Emily Davis",
    publicationDate: "2024-01-15",
    volume: 5,
    issue: 1,
    pages: "36-52",
  },
];

export default function JournalDetailPage({ params }: { params: { code: string } }) {
  const journal = journalData[params.code] || journalData.jitmb;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-light text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center">
              <span className="text-primary text-2xl font-bold">{journal.code}</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">{journal.fullName}</h1>
              <div className="flex gap-4 text-sm text-gray-100">
                <span>ISSN: {journal.issn}</span>
                <span>e-ISSN: {journal.eIssn}</span>
                <span>Impact Factor: {journal.impactFactor}</span>
                <span>{journal.frequency}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* About */}
            <Card className="mb-8">
              <h2 className="text-2xl font-bold mb-4">About the Journal</h2>
              <p className="text-gray-700 mb-4">{journal.description}</p>
              <h3 className="text-xl font-bold mb-2">Aims and Scope</h3>
              <p className="text-gray-700">{journal.aimsAndScope}</p>
            </Card>

            {/* Current Issue */}
            <Card className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Current Issue - Volume {mockArticles[0].volume}, Issue {mockArticles[0].issue}</h2>
              <div className="space-y-4">
                {mockArticles.map((article) => (
                  <div key={article.id} className="border-b border-gray-200 pb-4 last:border-0">
                    <Link href={`/articles/${article.id}`} className="text-lg font-semibold text-primary hover:text-primary-dark">
                      {article.title}
                    </Link>
                    <p className="text-sm text-gray-600 mt-1">{article.authors}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Pages {article.pages} | Published: {article.publicationDate}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Call to Action */}
            <Card>
              <h2 className="text-2xl font-bold mb-4">Submit to This Journal</h2>
              <p className="text-gray-700 mb-4">
                We welcome submissions of original research articles, review papers, and case studies.
              </p>
              <Link href="/submit" className="btn-primary">
                Submit Your Manuscript
              </Link>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            {/* Editor Info */}
            <Card className="mb-6">
              <h3 className="text-lg font-bold mb-3">Editor-in-Chief</h3>
              <p className="font-semibold">{journal.editorInChief}</p>
              <p className="text-sm text-gray-600">{journal.institution}</p>
            </Card>

            {/* Quick Info */}
            <Card className="mb-6">
              <h3 className="text-lg font-bold mb-3">Quick Information</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <span className="font-semibold">Frequency:</span> {journal.frequency}
                </li>
                <li>
                  <span className="font-semibold">APC:</span> ${journal.articleProcessingCharge}
                </li>
                <li>
                  <span className="font-semibold">First Published:</span> 2020
                </li>
                <li>
                  <span className="font-semibold">Open Access:</span> Yes
                </li>
              </ul>
            </Card>

            {/* Links */}
            <Card>
              <h3 className="text-lg font-bold mb-3">For Authors</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/author-guidelines" className="text-primary hover:text-primary-dark">
                    Author Guidelines
                  </Link>
                </li>
                <li>
                  <Link href="/paper-format" className="text-primary hover:text-primary-dark">
                    Paper Format
                  </Link>
                </li>
                <li>
                  <Link href="/submit" className="text-primary hover:text-primary-dark">
                    Submit Article
                  </Link>
                </li>
                <li>
                  <Link href="/review-process" className="text-primary hover:text-primary-dark">
                    Review Process
                  </Link>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
