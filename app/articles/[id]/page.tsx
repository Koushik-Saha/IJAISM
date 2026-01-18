import Link from "next/link";
import Card from "@/components/ui/Card";

const mockArticle = {
  id: "1",
  title: "AI-Driven Solutions for Mental Health: Early Detection and Intervention",
  authors: [
    { name: "Dr. John Smith", affiliation: "Stanford University, USA", orcid: "0000-0001-2345-6789" },
    { name: "Dr. Jane Doe", affiliation: "MIT, USA", orcid: "0000-0001-2345-6790" },
  ],
  correspondingAuthor: "Dr. John Smith (jsmith@stanford.edu)",
  journal: { code: "PRAIHI", name: "Research and Innovation in Health Informatics" },
  publicationDate: "2024-01-15",
  doi: "10.1234/c5k.2024.001",
  volume: 5,
  issue: 1,
  pages: "1-18",
  abstract: "This research explores the application of artificial intelligence in mental health care, focusing on early detection systems and intervention strategies. We present a novel framework that combines machine learning algorithms with clinical expertise to identify early warning signs of mental health issues. Our approach demonstrates 89% accuracy in predicting mental health crises up to 30 days in advance, enabling timely interventions. The study includes data from 10,000+ patients across multiple healthcare institutions and provides valuable insights for healthcare providers implementing AI-driven mental health solutions.",
  keywords: ["AI", "Mental Health", "Early Detection", "Machine Learning", "Healthcare Innovation"],
  fullText: `
## Introduction

Mental health is a critical global challenge affecting millions of people worldwide. Early detection and intervention are crucial for improving patient outcomes and reducing the burden on healthcare systems...

## Methodology

Our study employed a mixed-methods approach combining quantitative analysis of patient data with qualitative insights from mental health professionals. We developed a machine learning model using the following steps:

1. Data collection from 10,000+ patients
2. Feature engineering and selection
3. Model training and validation
4. Clinical validation with healthcare professionals

## Results

The AI-driven early detection system demonstrated:
- 89% accuracy in predicting mental health crises
- 30-day advance warning capability
- 95% precision in high-risk patient identification
- Significant reduction in emergency interventions

## Discussion

Our findings suggest that AI-driven solutions can significantly enhance mental health care delivery. The early detection capability enables healthcare providers to implement preventive measures and allocate resources more effectively...

## Conclusion

This research demonstrates the potential of AI in transforming mental health care. Future work will focus on expanding the model to additional mental health conditions and validating results across diverse populations.
  `,
  citations: 45,
  downloads: 320,
  views: 1250,
  received: "2023-10-15",
  revised: "2023-12-01",
  accepted: "2023-12-20",
  published: "2024-01-15",
};

const relatedArticles = [
  {
    id: "2",
    title: "Machine Learning in Clinical Psychology: A Review",
    authors: "Prof. Sarah Wilson",
    journal: "PRAIHI",
  },
  {
    id: "3",
    title: "Digital Health Technologies for Mental Wellness",
    authors: "Dr. Michael Chen, Dr. Emily Rodriguez",
    journal: "PRAIHI",
  },
  {
    id: "4",
    title: "Predictive Analytics in Healthcare: Opportunities and Challenges",
    authors: "Prof. David Brown",
    journal: "JAMSAI",
  },
];

export default function ArticleDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="text-sm text-gray-600 mb-4">
            <Link href="/" className="hover:text-primary">Home</Link>
            {" / "}
            <Link href="/articles" className="hover:text-primary">Articles</Link>
            {" / "}
            <span className="text-gray-900">{mockArticle.title}</span>
          </nav>
          <div className="mb-4">
            <span className="text-xs bg-primary text-white px-2 py-1 rounded">
              {mockArticle.journal.code}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{mockArticle.title}</h1>
          <div className="flex flex-wrap gap-4 text-gray-600 mb-4">
            <span>Published: {mockArticle.publicationDate}</span>
            <span>DOI: {mockArticle.doi}</span>
            <span>Volume {mockArticle.volume}, Issue {mockArticle.issue}</span>
            <span>Pages {mockArticle.pages}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Authors */}
            <Card className="mb-6">
              <h2 className="text-xl font-bold mb-4">Authors</h2>
              {mockArticle.authors.map((author, index) => (
                <div key={index} className="mb-3">
                  <p className="font-semibold">{author.name}</p>
                  <p className="text-sm text-gray-600">{author.affiliation}</p>
                  <p className="text-xs text-gray-500">ORCID: {author.orcid}</p>
                </div>
              ))}
              <p className="text-sm text-gray-600 mt-4">
                <span className="font-semibold">Corresponding author:</span> {mockArticle.correspondingAuthor}
              </p>
            </Card>

            {/* Abstract */}
            <Card className="mb-6">
              <h2 className="text-xl font-bold mb-4">Abstract</h2>
              <p className="text-gray-700 leading-relaxed">{mockArticle.abstract}</p>
            </Card>

            {/* Keywords */}
            <Card className="mb-6">
              <h2 className="text-xl font-bold mb-4">Keywords</h2>
              <div className="flex flex-wrap gap-2">
                {mockArticle.keywords.map((keyword) => (
                  <span key={keyword} className="bg-gray-200 text-gray-700 px-3 py-1 rounded">
                    {keyword}
                  </span>
                ))}
              </div>
            </Card>

            {/* Full Text */}
            <Card className="mb-6">
              <h2 className="text-xl font-bold mb-4">Full Text</h2>
              <div className="prose max-w-none text-gray-700">
                {mockArticle.fullText.split('\n\n').map((paragraph, index) => (
                  <div key={index} className="mb-4">
                    {paragraph.startsWith('##') ? (
                      <h3 className="text-lg font-bold mt-6 mb-3">{paragraph.replace('## ', '')}</h3>
                    ) : paragraph.startsWith('1.') || paragraph.startsWith('2.') ? (
                      <ul className="list-disc pl-6">
                        <li>{paragraph}</li>
                      </ul>
                    ) : (
                      <p className="leading-relaxed">{paragraph}</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Timeline */}
            <Card>
              <h2 className="text-xl font-bold mb-4">Article Timeline</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-semibold">Received:</span>
                  <span>{mockArticle.received}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Revised:</span>
                  <span>{mockArticle.revised}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Accepted:</span>
                  <span>{mockArticle.accepted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Published:</span>
                  <span>{mockArticle.published}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            {/* Metrics */}
            <Card className="mb-6">
              <h3 className="text-lg font-bold mb-4">Article Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Views</span>
                  <span className="font-semibold">{mockArticle.views}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Downloads</span>
                  <span className="font-semibold">{mockArticle.downloads}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Citations</span>
                  <span className="font-semibold">{mockArticle.citations}</span>
                </div>
              </div>
            </Card>

            {/* Download */}
            <Card className="mb-6">
              <h3 className="text-lg font-bold mb-4">Download</h3>
              <button className="w-full btn-primary mb-2">Download PDF</button>
              <button className="w-full btn-secondary">Print Article</button>
            </Card>

            {/* Cite */}
            <Card className="mb-6">
              <h3 className="text-lg font-bold mb-4">Cite This Article</h3>
              <select className="w-full border border-gray-300 rounded px-3 py-2 mb-2">
                <option>BibTeX</option>
                <option>RIS</option>
                <option>EndNote</option>
                <option>APA</option>
                <option>MLA</option>
              </select>
              <button className="w-full btn-secondary">Copy Citation</button>
            </Card>

            {/* Share */}
            <Card className="mb-6">
              <h3 className="text-lg font-bold mb-4">Share</h3>
              <div className="flex gap-2">
                <button className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                  Twitter
                </button>
                <button className="flex-1 bg-blue-800 text-white py-2 rounded hover:bg-blue-900">
                  Facebook
                </button>
                <button className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
                  LinkedIn
                </button>
              </div>
            </Card>

            {/* Related Articles */}
            <Card>
              <h3 className="text-lg font-bold mb-4">Related Articles</h3>
              <div className="space-y-4">
                {relatedArticles.map((article) => (
                  <div key={article.id}>
                    <Link href={`/articles/${article.id}`} className="text-primary hover:text-primary-dark font-semibold text-sm">
                      {article.title}
                    </Link>
                    <p className="text-xs text-gray-600 mt-1">{article.authors}</p>
                    <p className="text-xs text-gray-500">{article.journal}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
