"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    params.then((resolvedParams) => {
      setId(resolvedParams.id);
    });
  }, [params]);

  // Mock data - in production, this would be fetched from database
  const books: Record<string, any> = {
    "1": {
      id: 1,
      title: "Advanced Machine Learning: Theory and Practice",
      authors: ["Dr. Sarah Johnson", "Dr. Michael Chen"],
      year: 2024,
      isbn: "978-1-234567-89-0",
      pages: 456,
      field: "Information Technology",
      description: "A comprehensive guide to advanced machine learning techniques, covering deep learning, neural networks, and real-world applications in business and technology.",
      fullDescription: `This comprehensive guide provides an in-depth exploration of advanced machine learning techniques, bridging the gap between theoretical concepts and practical applications. The book covers cutting-edge topics in deep learning, neural networks, and their real-world applications across business and technology sectors.

      Designed for graduate students, researchers, and practitioners, this book offers a thorough treatment of both foundational concepts and advanced methodologies. Each chapter includes practical examples, case studies, and hands-on exercises to reinforce learning.

      Key features include: detailed mathematical formulations, implementation guides in Python and TensorFlow, industry case studies from Fortune 500 companies, and best practices for deploying ML systems in production environments.`,
      price: "$89.99",
      publisher: "IJAISM Press",
      language: "English",
      edition: "1st Edition",
      format: "Hardcover & eBook",
      tableOfContents: [
        { chapter: 1, title: "Introduction to Machine Learning", pages: "1-32" },
        { chapter: 2, title: "Mathematical Foundations", pages: "33-78" },
        { chapter: 3, title: "Neural Networks and Deep Learning", pages: "79-156" },
        { chapter: 4, title: "Convolutional Neural Networks", pages: "157-212" },
        { chapter: 5, title: "Recurrent Neural Networks and LSTMs", pages: "213-268" },
        { chapter: 6, title: "Transformers and Attention Mechanisms", pages: "269-324" },
        { chapter: 7, title: "Reinforcement Learning", pages: "325-378" },
        { chapter: 8, title: "Generative Models", pages: "379-422" },
        { chapter: 9, title: "Real-World Applications", pages: "423-456" },
      ],
      previewPages: [
        {
          pageNumber: 1,
          content: `Chapter 1: Introduction to Machine Learning

Machine learning has revolutionized how we approach problem-solving in the digital age. This chapter introduces the fundamental concepts, methodologies, and applications that form the foundation of modern machine learning systems.

1.1 What is Machine Learning?

Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed. It focuses on the development of computer programs that can access data and use it to learn for themselves.

The process of learning begins with observations or data, such as examples, direct experience, or instruction, in order to look for patterns in data and make better decisions in the future based on the examples that we provide...`
        }
      ],
      reviews: [
        {
          author: "Prof. John Smith, MIT",
          rating: 5,
          text: "An excellent resource for both students and practitioners. The explanations are clear and the examples are highly relevant."
        },
        {
          author: "Dr. Emily White, Stanford",
          rating: 5,
          text: "This book successfully bridges theory and practice. The case studies are particularly valuable."
        }
      ],
      relatedTopics: ["Deep Learning", "Neural Networks", "AI Applications", "Data Science", "Python Programming"]
    },
    "2": {
      id: 2,
      title: "Digital Transformation Strategies for Modern Business",
      authors: ["Dr. Emily Rodriguez"],
      year: 2024,
      isbn: "978-1-234567-90-6",
      pages: 328,
      field: "Business Management",
      description: "Explore proven strategies for successful digital transformation, including case studies from Fortune 500 companies and emerging startups.",
      fullDescription: `This book provides a comprehensive roadmap for organizations embarking on digital transformation journeys. Drawing from extensive research and real-world case studies, it offers practical frameworks and strategies for successful digital transformation.

      The book examines digital transformation through multiple lenses: strategic planning, organizational culture, technology adoption, and change management. Each chapter includes detailed case studies from both Fortune 500 companies and innovative startups, providing insights applicable to organizations of all sizes.

      Readers will learn how to develop digital strategies, build digital capabilities, manage organizational change, and measure transformation success.`,
      price: "$74.99",
      publisher: "IJAISM Press",
      language: "English",
      edition: "1st Edition",
      format: "Hardcover & eBook",
      tableOfContents: [
        { chapter: 1, title: "The Digital Transformation Imperative", pages: "1-28" },
        { chapter: 2, title: "Strategic Planning for Digital Change", pages: "29-68" },
        { chapter: 3, title: "Building Digital Capabilities", pages: "69-112" },
        { chapter: 4, title: "Technology Selection and Integration", pages: "113-156" },
        { chapter: 5, title: "Cultural Transformation", pages: "157-198" },
        { chapter: 6, title: "Change Management", pages: "199-242" },
        { chapter: 7, title: "Measuring Success", pages: "243-286" },
        { chapter: 8, title: "Case Studies", pages: "287-328" },
      ],
      previewPages: [
        {
          pageNumber: 1,
          content: `Chapter 1: The Digital Transformation Imperative

Digital transformation is no longer optional—it's essential for survival in today's rapidly evolving business landscape. This chapter explores why organizations must embrace digital transformation and what it means for their future success.

1.1 Understanding Digital Transformation

Digital transformation is the integration of digital technology into all areas of a business, fundamentally changing how you operate and deliver value to customers. It's also a cultural change that requires organizations to continually challenge the status quo, experiment, and get comfortable with failure...`
        }
      ],
      reviews: [
        {
          author: "CEO, Tech Startup",
          rating: 5,
          text: "Invaluable insights for anyone leading digital transformation initiatives."
        }
      ],
      relatedTopics: ["Digital Strategy", "Business Innovation", "Change Management", "Technology Leadership"]
    },
    "3": {
      id: 3,
      title: "Cybersecurity Fundamentals and Best Practices",
      authors: ["Dr. James Williams", "Dr. Lisa Anderson"],
      year: 2023,
      isbn: "978-1-234567-91-3",
      pages: 512,
      field: "Information Technology",
      description: "Essential cybersecurity knowledge for IT professionals, covering threat detection, incident response, and security architecture design.",
      fullDescription: `This comprehensive guide covers all aspects of modern cybersecurity, from fundamental concepts to advanced threat detection and response strategies. Written by leading cybersecurity experts, the book provides practical guidance for protecting organizations against evolving cyber threats.

      The book covers security architecture, threat modeling, vulnerability management, incident response, and security operations. It includes real-world examples, hands-on labs, and detailed case studies of major security incidents.

      Perfect for security professionals, IT managers, and students pursuing careers in cybersecurity.`,
      price: "$95.99",
      publisher: "IJAISM Press",
      language: "English",
      edition: "1st Edition",
      format: "Hardcover & eBook",
      tableOfContents: [
        { chapter: 1, title: "Introduction to Cybersecurity", pages: "1-42" },
        { chapter: 2, title: "Threat Landscape", pages: "43-98" },
        { chapter: 3, title: "Security Architecture", pages: "99-156" },
        { chapter: 4, title: "Network Security", pages: "157-214" },
        { chapter: 5, title: "Application Security", pages: "215-278" },
        { chapter: 6, title: "Cloud Security", pages: "279-342" },
        { chapter: 7, title: "Incident Response", pages: "343-412" },
        { chapter: 8, title: "Security Operations", pages: "413-478" },
        { chapter: 9, title: "Compliance and Governance", pages: "479-512" },
      ],
      previewPages: [
        {
          pageNumber: 1,
          content: `Chapter 1: Introduction to Cybersecurity

Cybersecurity has become one of the most critical concerns for organizations worldwide. This chapter introduces the fundamental concepts, principles, and challenges of modern cybersecurity.

1.1 The Cybersecurity Challenge

In today's interconnected world, cybersecurity threats are more sophisticated and prevalent than ever before. Organizations face attacks from nation-states, organized crime, hacktivists, and insider threats...`
        }
      ],
      reviews: [
        {
          author: "CISO, Fortune 500 Company",
          rating: 5,
          text: "Comprehensive and up-to-date. Essential reading for security professionals."
        }
      ],
      relatedTopics: ["Network Security", "Threat Detection", "Incident Response", "Security Operations", "Compliance"]
    },
    "4": {
      id: 4,
      title: "Leadership in the Age of AI",
      authors: ["Dr. Robert Brown"],
      year: 2023,
      isbn: "978-1-234567-92-0",
      pages: 284,
      field: "Business Management",
      description: "Navigate the challenges and opportunities of leading organizations in an AI-driven world, with practical frameworks and insights.",
      fullDescription: `This groundbreaking book explores how leadership must evolve in the age of artificial intelligence. As AI transforms business operations, decision-making, and competitive dynamics, leaders must adapt their approaches to remain effective.

      The book provides practical frameworks for leading AI-driven organizations, managing human-AI collaboration, and making strategic decisions about AI adoption. It addresses ethical considerations, workforce transformation, and cultural change required for AI integration.

      Based on interviews with 100+ AI leaders and extensive research, this book offers actionable insights for executives, managers, and aspiring leaders.`,
      price: "$69.99",
      publisher: "IJAISM Press",
      language: "English",
      edition: "1st Edition",
      format: "Hardcover & eBook",
      tableOfContents: [
        { chapter: 1, title: "Leadership in the AI Era", pages: "1-32" },
        { chapter: 2, title: "Understanding AI Capabilities", pages: "33-68" },
        { chapter: 3, title: "Strategic AI Adoption", pages: "69-112" },
        { chapter: 4, title: "Human-AI Collaboration", pages: "113-156" },
        { chapter: 5, title: "Ethical AI Leadership", pages: "157-198" },
        { chapter: 6, title: "Workforce Transformation", pages: "199-238" },
        { chapter: 7, title: "Cultural Change", pages: "239-268" },
        { chapter: 8, title: "Future of AI Leadership", pages: "269-284" },
      ],
      previewPages: [
        {
          pageNumber: 1,
          content: `Chapter 1: Leadership in the AI Era

Artificial intelligence is fundamentally changing how organizations operate, compete, and create value. Leaders must understand these changes and adapt their leadership approaches accordingly.

1.1 The AI Revolution

We are living through one of the most significant technological transformations in history. AI is not just another tool—it's reshaping entire industries, business models, and ways of working...`
        }
      ],
      reviews: [
        {
          author: "CTO, Global Corporation",
          rating: 5,
          text: "Essential reading for any leader navigating AI transformation."
        }
      ],
      relatedTopics: ["AI Strategy", "Digital Leadership", "Change Management", "Innovation", "Business Ethics"]
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

  // Get book or default to ID 1 if not found
  const book = books[id] || books["1"];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center text-sm text-gray-600">
            <Link href="/" className="hover:text-primary">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/books" className="hover:text-primary">Books</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 truncate">{book.title}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Book Cover and Details */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              {/* Book Cover */}
              <div className="w-full aspect-[2/3] bg-gradient-to-br from-primary to-blue-800 rounded-lg mb-6 flex items-center justify-center text-white font-bold text-center p-6">
                <div className="text-sm leading-tight">{book.title}</div>
              </div>

              {/* Price */}
              <div className="text-center mb-6">
                <p className="text-4xl font-bold text-accent mb-2">{book.price}</p>
                <p className="text-sm text-gray-600">{book.format}</p>
              </div>

              {/* Actions */}
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => alert("In production, this would add the book to cart and proceed to checkout.")}
                  className="w-full bg-accent hover:bg-accent-dark text-white px-6 py-3 rounded-lg font-bold transition-colors"
                >
                  Purchase Book
                </button>

                <button
                  onClick={() => setShowPreview(true)}
                  className="w-full border-2 border-primary text-primary hover:bg-primary/10 px-6 py-3 rounded-lg font-bold transition-colors"
                >
                  Preview
                </button>

                <button
                  onClick={() => alert("In production, this would add the book to your wishlist.")}
                  className="w-full border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg font-bold transition-colors"
                >
                  Add to Wishlist
                </button>
              </div>

              {/* Book Details */}
              <div className="border-t border-gray-200 pt-6 space-y-3">
                <div>
                  <p className="text-sm text-gray-600">ISBN</p>
                  <p className="font-semibold text-gray-800">{book.isbn}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Publisher</p>
                  <p className="font-semibold text-gray-800">{book.publisher}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Year</p>
                  <p className="font-semibold text-gray-800">{book.year}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pages</p>
                  <p className="font-semibold text-gray-800">{book.pages} pages</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Language</p>
                  <p className="font-semibold text-gray-800">{book.language}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Edition</p>
                  <p className="font-semibold text-gray-800">{book.edition}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Column */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-8">
              {/* Title and Authors */}
              <div className="mb-6">
                <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-4">
                  {book.field}
                </span>
                <h1 className="text-4xl font-bold text-primary mb-4">
                  {book.title}
                </h1>
                <p className="text-xl text-gray-700 mb-2">
                  by {book.authors.join(", ")}
                </p>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">About This Book</h2>
                <div className="text-gray-700 leading-relaxed space-y-4">
                  {book.fullDescription.split('\n\n').map((paragraph: string, index: number) => (
                    <p key={index}>{paragraph.trim()}</p>
                  ))}
                </div>
              </div>

              {/* Table of Contents */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Table of Contents</h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="space-y-2">
                    {book.tableOfContents.map((item: any) => (
                      <div key={item.chapter} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                        <div className="flex items-center">
                          <span className="text-primary font-bold mr-3">Chapter {item.chapter}</span>
                          <span className="text-gray-800">{item.title}</span>
                        </div>
                        <span className="text-gray-600 text-sm">{item.pages}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reviews */}
              {book.reviews && book.reviews.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Reviews</h2>
                  <div className="space-y-4">
                    {book.reviews.map((review: any, index: number) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-6">
                        <div className="flex items-center mb-2">
                          <div className="flex text-accent mr-2">
                            {[...Array(review.rating)].map((_, i) => (
                              <span key={i}>★</span>
                            ))}
                          </div>
                          <span className="font-semibold text-gray-800">{review.author}</span>
                        </div>
                        <p className="text-gray-700 italic">"{review.text}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Topics */}
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Related Topics</h2>
                <div className="flex flex-wrap gap-2">
                  {book.relatedTopics.map((topic: string, index: number) => (
                    <span
                      key={index}
                      className="inline-block bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8">
          <Link
            href="/books"
            className="inline-flex items-center text-primary hover:text-accent font-semibold"
          >
            ← Back to All Books
          </Link>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-800">Book Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-8">
              {book.previewPages.map((page: any, index: number) => (
                <div key={index} className="mb-8">
                  <div className="bg-gray-50 rounded-lg p-8">
                    <div className="prose max-w-none">
                      <pre className="whitespace-pre-wrap font-serif text-gray-800 leading-relaxed">
                        {page.content}
                      </pre>
                    </div>
                  </div>
                  <p className="text-center text-sm text-gray-600 mt-4">
                    Page {page.pageNumber} of {book.pages}
                  </p>
                </div>
              ))}
              <div className="text-center mt-8 p-6 bg-blue-50 rounded-lg">
                <p className="text-gray-700 mb-4">
                  This is a preview. Purchase the full book to read all {book.pages} pages.
                </p>
                <button
                  onClick={() => {
                    setShowPreview(false);
                    alert("In production, this would proceed to checkout.");
                  }}
                  className="bg-accent hover:bg-accent-dark text-white px-8 py-3 rounded-lg font-bold transition-colors"
                >
                  Purchase Full Book - {book.price}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
