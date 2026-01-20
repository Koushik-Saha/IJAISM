"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DissertationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId] = useState<string>("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    params.then((resolvedParams) => {
      setId(resolvedParams.id);
    });
  }, [params]);

  // Mock data - in production, this would be fetched from database
  const dissertations: Record<string, any> = {
    "1": {
      id: 1,
      title: "Machine Learning Applications in Financial Risk Assessment",
      author: "Dr. Sarah Johnson",
      university: "Stanford University",
      department: "Computer Science",
      year: 2024,
      degreeType: "PhD",
      field: "Information Technology",
      supervisorName: "Prof. John Anderson",
      defenseDate: "2024-01-15",
      submissionDate: "2023-12-01",
      abstract: "This dissertation explores the application of machine learning algorithms in predicting and managing financial risks in modern banking systems. The research presents novel approaches to credit risk assessment, market risk prediction, and operational risk management using deep learning and ensemble methods.",
      fullAbstract: `This dissertation explores the application of machine learning algorithms in predicting and managing financial risks in modern banking systems. The research presents novel approaches to credit risk assessment, market risk prediction, and operational risk management using deep learning and ensemble methods.

      The study comprises three main contributions: First, a novel deep learning architecture for credit scoring that outperforms traditional methods by 23%. Second, an ensemble-based market risk prediction system that provides real-time risk assessment with 89% accuracy. Third, a comprehensive framework for operational risk management using natural language processing and time series analysis.

      The research was conducted in collaboration with five major financial institutions, analyzing over 10 million transactions and credit applications. The proposed methods have been validated through extensive empirical testing and have demonstrated significant improvements over existing approaches.`,
      keywords: ["Machine Learning", "Financial Risk", "Deep Learning", "Credit Scoring", "Risk Management", "Banking Systems"],
      pages: 287,
      pdfUrl: "/sample-dissertation.pdf",
      chapters: [
        { number: 1, title: "Introduction", pages: "1-15" },
        { number: 2, title: "Literature Review", pages: "16-45" },
        { number: 3, title: "Methodology", pages: "46-89" },
        { number: 4, title: "Credit Risk Assessment Using Deep Learning", pages: "90-145" },
        { number: 5, title: "Market Risk Prediction Framework", pages: "146-198" },
        { number: 6, title: "Operational Risk Management", pages: "199-245" },
        { number: 7, title: "Results and Discussion", pages: "246-270" },
        { number: 8, title: "Conclusion", pages: "271-287" },
      ],
    },
    "2": {
      id: 2,
      title: "Blockchain Technology and Supply Chain Management",
      author: "Dr. Michael Chen",
      university: "MIT",
      department: "Management",
      year: 2024,
      degreeType: "PhD",
      field: "Business Management",
      supervisorName: "Prof. Maria Garcia",
      defenseDate: "2024-02-20",
      submissionDate: "2024-01-10",
      abstract: "An in-depth analysis of how blockchain technology can revolutionize supply chain transparency and efficiency.",
      fullAbstract: `This dissertation provides an in-depth analysis of how blockchain technology can revolutionize supply chain transparency and efficiency. The research investigates the application of distributed ledger technology in improving traceability, reducing fraud, and enhancing collaboration across global supply chains.

      Key contributions include: A blockchain-based framework for end-to-end supply chain visibility, a smart contract system for automated compliance verification, and a consensus mechanism optimized for supply chain applications. The research includes five real-world case studies across manufacturing, retail, and pharmaceutical industries.`,
      keywords: ["Blockchain", "Supply Chain", "Smart Contracts", "Traceability", "Distributed Ledger"],
      pages: 315,
      pdfUrl: "/sample-dissertation.pdf",
      chapters: [
        { number: 1, title: "Introduction", pages: "1-20" },
        { number: 2, title: "Blockchain Fundamentals", pages: "21-58" },
        { number: 3, title: "Supply Chain Challenges", pages: "59-95" },
        { number: 4, title: "Framework Design", pages: "96-165" },
        { number: 5, title: "Case Studies", pages: "166-245" },
        { number: 6, title: "Implementation and Evaluation", pages: "246-290" },
        { number: 7, title: "Conclusion", pages: "291-315" },
      ],
    },
    "3": {
      id: 3,
      title: "Artificial Intelligence in Healthcare Decision Making",
      author: "Dr. Emily Rodriguez",
      university: "Harvard University",
      department: "Medical Informatics",
      year: 2023,
      degreeType: "PhD",
      field: "Information Technology",
      supervisorName: "Prof. David Kim",
      defenseDate: "2023-11-10",
      submissionDate: "2023-09-15",
      abstract: "Examining the role of AI systems in supporting clinical decision-making processes and patient outcomes.",
      fullAbstract: `This dissertation examines the role of AI systems in supporting clinical decision-making processes and improving patient outcomes. The research develops and validates multiple AI-based decision support systems for diagnosis, treatment planning, and patient monitoring.

      The work includes the development of interpretable machine learning models for clinical use, evaluation in real hospital settings, and analysis of physician-AI collaboration patterns. Results demonstrate significant improvements in diagnostic accuracy and treatment effectiveness.`,
      keywords: ["Artificial Intelligence", "Healthcare", "Clinical Decision Support", "Medical Diagnosis", "Patient Outcomes"],
      pages: 298,
      pdfUrl: "/sample-dissertation.pdf",
      chapters: [
        { number: 1, title: "Introduction", pages: "1-18" },
        { number: 2, title: "Clinical Decision Making", pages: "19-52" },
        { number: 3, title: "AI in Healthcare: State of the Art", pages: "53-95" },
        { number: 4, title: "Proposed Decision Support Systems", pages: "96-175" },
        { number: 5, title: "Clinical Validation", pages: "176-240" },
        { number: 6, title: "Ethical Considerations", pages: "241-270" },
        { number: 7, title: "Conclusion", pages: "271-298" },
      ],
    },
    "4": {
      id: 4,
      title: "Sustainable Business Practices in the Digital Age",
      author: "Dr. James Williams",
      university: "Oxford University",
      department: "Business Studies",
      year: 2023,
      degreeType: "PhD",
      field: "Business Management",
      supervisorName: "Prof. Susan White",
      defenseDate: "2023-09-25",
      submissionDate: "2023-07-20",
      abstract: "Investigating how digital transformation enables and promotes sustainable business practices globally.",
      fullAbstract: `This dissertation investigates how digital transformation enables and promotes sustainable business practices across global organizations. The research explores the intersection of digital technologies and sustainability, examining how companies leverage digital tools to achieve environmental and social goals.

      Through analysis of 50 multinational corporations, the study identifies key success factors, implementation strategies, and measurable outcomes of digital sustainability initiatives. The research provides a comprehensive framework for integrating sustainability into digital transformation strategies.`,
      keywords: ["Sustainability", "Digital Transformation", "Business Practices", "Corporate Responsibility", "Environmental Management"],
      pages: 265,
      pdfUrl: "/sample-dissertation.pdf",
      chapters: [
        { number: 1, title: "Introduction", pages: "1-15" },
        { number: 2, title: "Digital Transformation Landscape", pages: "16-48" },
        { number: 3, title: "Sustainability Framework", pages: "49-85" },
        { number: 4, title: "Case Study Analysis", pages: "86-175" },
        { number: 5, title: "Implementation Strategies", pages: "176-225" },
        { number: 6, title: "Results and Impact", pages: "226-250" },
        { number: 7, title: "Conclusion", pages: "251-265" },
      ],
    },
    "5": {
      id: 5,
      title: "Cybersecurity Frameworks for IoT Ecosystems",
      author: "Dr. Lisa Anderson",
      university: "Carnegie Mellon University",
      department: "Computer Science",
      year: 2023,
      degreeType: "PhD",
      field: "Information Technology",
      supervisorName: "Prof. Robert Taylor",
      defenseDate: "2023-08-15",
      submissionDate: "2023-06-01",
      abstract: "Developing comprehensive security frameworks for protecting Internet of Things devices and networks.",
      fullAbstract: `This dissertation develops comprehensive security frameworks for protecting Internet of Things devices and networks from emerging cyber threats. The research addresses critical vulnerabilities in IoT ecosystems and proposes multi-layered security architectures.

      The work includes the design of lightweight encryption protocols for resource-constrained devices, anomaly detection systems for IoT networks, and secure communication frameworks. The proposed solutions have been tested across various IoT deployments including smart homes, industrial systems, and healthcare devices.`,
      keywords: ["Cybersecurity", "IoT", "Security Framework", "Network Security", "Threat Detection"],
      pages: 342,
      pdfUrl: "/sample-dissertation.pdf",
      chapters: [
        { number: 1, title: "Introduction", pages: "1-22" },
        { number: 2, title: "IoT Security Landscape", pages: "23-68" },
        { number: 3, title: "Threat Modeling", pages: "69-115" },
        { number: 4, title: "Security Framework Design", pages: "116-195" },
        { number: 5, title: "Cryptographic Protocols", pages: "196-255" },
        { number: 6, title: "Implementation and Testing", pages: "256-310" },
        { number: 7, title: "Conclusion", pages: "311-342" },
      ],
    },
    "6": {
      id: 6,
      title: "Leadership Strategies in Remote Work Environments",
      author: "Dr. Robert Brown",
      university: "Cambridge University",
      department: "Management Studies",
      year: 2023,
      degreeType: "PhD",
      field: "Business Management",
      supervisorName: "Prof. Elizabeth Green",
      defenseDate: "2023-07-20",
      submissionDate: "2023-05-10",
      abstract: "Analyzing effective leadership approaches in the era of distributed and remote workforces.",
      fullAbstract: `This dissertation analyzes effective leadership approaches in the era of distributed and remote workforces. The research examines how leadership practices must adapt to virtual environments and identifies strategies that promote team cohesion, productivity, and employee well-being.

      Based on interviews with 150 remote leaders and surveys of 2,000 remote employees across 30 countries, the study develops a comprehensive leadership framework for remote work. The research includes analysis of communication patterns, trust-building mechanisms, and performance management in virtual settings.`,
      keywords: ["Leadership", "Remote Work", "Virtual Teams", "Management", "Organizational Behavior"],
      pages: 278,
      pdfUrl: "/sample-dissertation.pdf",
      chapters: [
        { number: 1, title: "Introduction", pages: "1-18" },
        { number: 2, title: "Remote Work Evolution", pages: "19-55" },
        { number: 3, title: "Leadership Theories", pages: "56-92" },
        { number: 4, title: "Research Methodology", pages: "93-128" },
        { number: 5, title: "Findings and Analysis", pages: "129-210" },
        { number: 6, title: "Leadership Framework", pages: "211-255" },
        { number: 7, title: "Conclusion", pages: "256-278" },
      ],
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

  // Get dissertation or default to ID 1 if not found
  const dissertation = dissertations[id] || dissertations["1"];

  const handleDownload = () => {
    setDownloading(true);
    // In production, this would trigger actual PDF download
    setTimeout(() => {
      alert("PDF download would start here. In production, this would download the actual dissertation PDF.");
      setDownloading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center text-sm text-gray-600">
            <Link href="/" className="hover:text-primary">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/dissertations" className="hover:text-primary">Dissertations</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 truncate">{dissertation.title}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-8">
              {/* Title and Badges */}
              <div className="mb-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                    {dissertation.field}
                  </span>
                  <span className="inline-block bg-accent/10 text-accent px-3 py-1 rounded-full text-sm font-medium">
                    {dissertation.degreeType}
                  </span>
                  <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                    {dissertation.year}
                  </span>
                </div>
                <h1 className="text-4xl font-bold text-primary mb-4">
                  {dissertation.title}
                </h1>
              </div>

              {/* Author Info */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Author</p>
                    <p className="text-lg font-bold text-gray-800">{dissertation.author}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Supervisor</p>
                    <p className="text-lg font-semibold text-gray-800">{dissertation.supervisorName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">University</p>
                    <p className="text-lg font-semibold text-gray-800">{dissertation.university}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Department</p>
                    <p className="text-lg font-semibold text-gray-800">{dissertation.department}</p>
                  </div>
                </div>
              </div>

              {/* Abstract */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Abstract</h2>
                <div className="text-gray-700 leading-relaxed space-y-4">
                  {dissertation.fullAbstract.split('\n\n').map((paragraph: string, index: number) => (
                    <p key={index}>{paragraph.trim()}</p>
                  ))}
                </div>
              </div>

              {/* Keywords */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Keywords</h2>
                <div className="flex flex-wrap gap-2">
                  {dissertation.keywords.map((keyword: string, index: number) => (
                    <span
                      key={index}
                      className="inline-block bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              {/* Table of Contents */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Table of Contents</h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="space-y-3">
                    {dissertation.chapters.map((chapter: any) => (
                      <div key={chapter.number} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                        <div className="flex items-center">
                          <span className="text-primary font-bold mr-3">Chapter {chapter.number}</span>
                          <span className="text-gray-800">{chapter.title}</span>
                        </div>
                        <span className="text-gray-600 text-sm">{chapter.pages}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Citation */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="font-bold text-gray-800 mb-2">How to Cite</h3>
                <p className="text-sm text-gray-700 font-mono">
                  {dissertation.author.replace('Dr. ', '')} ({dissertation.year}). <em>{dissertation.title}</em>.
                  Doctoral dissertation, {dissertation.university}, {dissertation.department}.
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Details</h3>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pages</p>
                  <p className="font-semibold text-gray-800">{dissertation.pages} pages</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Defense Date</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(dissertation.defenseDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Submission Date</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(dissertation.submissionDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downloading ? 'Preparing Download...' : 'Download PDF'}
                </button>

                <button
                  onClick={() => window.print()}
                  className="w-full border-2 border-primary text-primary hover:bg-primary/10 px-6 py-3 rounded-lg font-bold transition-colors"
                >
                  Print
                </button>

                <Link
                  href={`mailto:?subject=${encodeURIComponent(dissertation.title)}&body=${encodeURIComponent(`Check out this dissertation: ${dissertation.title} by ${dissertation.author}`)}`}
                  className="w-full block text-center border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg font-bold transition-colors"
                >
                  Share
                </Link>
              </div>

              {/* Submit Your Own */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="font-bold text-gray-800 mb-3">Submit Your Dissertation</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Share your doctoral research with the global academic community
                </p>
                <Link
                  href="/submit"
                  className="block text-center bg-accent hover:bg-accent-dark text-white px-6 py-3 rounded-lg font-bold transition-colors"
                >
                  Submit Now
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8">
          <Link
            href="/dissertations"
            className="inline-flex items-center text-primary hover:text-accent font-semibold"
          >
            ← Back to All Dissertations
          </Link>
        </div>
      </div>
    </div>
  );
}
