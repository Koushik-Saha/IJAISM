import Link from "next/link";
import Card from "@/components/ui/Card";

const journals = [
  {
    code: "JITMB",
    fullName: "Journal of Information Technology and Management in Business",
    description: "Focuses on the intersection of IT and business management",
    issn: "2456-7890",
    impactFactor: 2.5
  },
  {
    code: "JSAE",
    fullName: "Journal of Social and Anthropological Explorations",
    description: "Explores social and cultural phenomena through anthropological research",
    issn: "2456-7891",
    impactFactor: 2.1
  },
  {
    code: "AMLID",
    fullName: "Accounting, Management, and Leadership in Development",
    description: "Covers accounting, management practices, and leadership development",
    issn: "2456-7892",
    impactFactor: 1.9
  },
  {
    code: "OJBEM",
    fullName: "Business Economics and Management",
    description: "Publishes research on business economics and management strategies",
    issn: "2456-7893",
    impactFactor: 2.3
  },
  {
    code: "PRAIHI",
    fullName: "Research and Innovation in Health Informatics",
    description: "Advances in health informatics and medical technology",
    issn: "2456-7894",
    impactFactor: 3.1
  },
  {
    code: "JBVADA",
    fullName: "Business Valuation and Data Analytics",
    description: "Focus on business valuation methods and data-driven insights",
    issn: "2456-7895",
    impactFactor: 2.7
  },
  {
    code: "JAMSAI",
    fullName: "Applied Mathematics, Statistics, and AI",
    description: "Mathematical and statistical methods with AI applications",
    issn: "2456-7896",
    impactFactor: 3.4
  },
  {
    code: "AESI",
    fullName: "Environmental Studies and Innovation",
    description: "Environmental research and sustainable development innovations",
    issn: "2456-7897",
    impactFactor: 2.8
  },
  {
    code: "ILPROM",
    fullName: "International Leadership and Professional Management",
    description: "Global leadership trends and professional management practices",
    issn: "2456-7898",
    impactFactor: 2.2
  },
  {
    code: "TBFLI",
    fullName: "Business and Financial Leadership Insights",
    description: "Business and financial leadership strategies",
    issn: "2456-7899",
    impactFactor: 2.4
  },
  {
    code: "PMSRI",
    fullName: "Public Management and Social Research Insights",
    description: "Public administration and social research",
    issn: "2456-7900",
    impactFactor: 1.8
  },
  {
    code: "DRSDR",
    fullName: "Demographic Research and Social Development Reviews",
    description: "Demographic trends and social development studies",
    issn: "2456-7901",
    impactFactor: 2.0
  },
];

export default function JournalsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">Academic Journals</h1>
          <p className="text-xl text-gray-100">
            Browse our collection of 12 prestigious academic journals covering various disciplines
          </p>
        </div>
      </div>

      {/* Journals Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {journals.map((journal) => (
            <Link key={journal.code} href={`/journals/${journal.code.toLowerCase()}`}>
              <Card className="h-full">
                <div className="h-48 bg-gradient-to-br from-primary-light to-primary rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-white text-4xl font-bold">{journal.code}</span>
                </div>
                <h2 className="text-xl font-bold mb-2 text-primary">{journal.fullName}</h2>
                <p className="text-gray-600 mb-4">{journal.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>ISSN: {journal.issn}</span>
                  <span className="bg-accent text-white px-2 py-1 rounded">IF: {journal.impactFactor}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
