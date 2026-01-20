"use client";

import { useState } from "react";
import Link from "next/link";

export default function AnnouncementsPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const announcements = [
    {
      id: 1,
      title: "New Special Issue: AI Ethics and Governance",
      date: "2024-01-15",
      category: "Journal",
      priority: "high",
      excerpt: "We are pleased to announce a special issue on AI Ethics and Governance in the Journal of Advanced Machine Learning and Artificial Intelligence (JAMLAI). Submission deadline: March 31, 2024.",
    },
    {
      id: 2,
      title: "ICAIML 2024 Conference Registration Now Open",
      date: "2024-01-10",
      category: "Conference",
      priority: "high",
      excerpt: "Early bird registration is now available for the International Conference on Artificial Intelligence and Machine Learning (ICAIML 2024) taking place June 15-17 in San Francisco.",
    },
    {
      id: 3,
      title: "IJAISM Research Scholarship Program Announced",
      date: "2024-01-05",
      category: "Scholarship",
      priority: "high",
      excerpt: "IJAISM is proud to launch a new scholarship program supporting doctoral researchers in information technology and business management. Applications open February 1, 2024.",
    },
    {
      id: 4,
      title: "Updated Author Guidelines for 2024",
      date: "2024-01-03",
      category: "Guidelines",
      priority: "medium",
      excerpt: "We have updated our author guidelines to include new formatting requirements and best practices. All authors should review the updated guidelines before submission.",
    },
    {
      id: 5,
      title: "New Editorial Board Members Appointed",
      date: "2023-12-28",
      category: "Editorial",
      priority: "medium",
      excerpt: "IJAISM welcomes five distinguished researchers to our editorial boards across multiple journals, strengthening our commitment to academic excellence.",
    },
    {
      id: 6,
      title: "Call for Papers: Business Analytics Special Issue",
      date: "2023-12-20",
      category: "Journal",
      priority: "high",
      excerpt: "The Journal of Business Value and Data Analytics is seeking submissions for a special issue on advanced business analytics applications. Deadline: April 15, 2024.",
    },
    {
      id: 7,
      title: "IJAISM Platform Update: Enhanced Features",
      date: "2023-12-15",
      category: "Platform",
      priority: "low",
      excerpt: "Our platform has been updated with new features including improved manuscript tracking, enhanced reviewer dashboard, and mobile responsiveness.",
    },
    {
      id: 8,
      title: "Partnership with Leading Universities",
      date: "2023-12-10",
      category: "Partnership",
      priority: "medium",
      excerpt: "IJAISM announces strategic partnerships with Stanford, MIT, and Oxford to promote open access research and collaborative publishing initiatives.",
    },
  ];

  const categories = ["All", "Journal", "Conference", "Scholarship", "Guidelines", "Editorial", "Platform", "Partnership"];

  // Filter announcements based on selected category
  const filteredAnnouncements = selectedCategory === "All"
    ? announcements
    : announcements.filter(announcement => announcement.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Announcements</h1>
          <p className="text-xl md:text-2xl text-gray-100 max-w-3xl">
            Stay updated with the latest news and updates from IJAISM
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Filter by Category</h2>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  category === selectedCategory
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Announcements List */}
        <div className="space-y-6">
          {filteredAnnouncements.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-600 text-lg">No announcements found in this category.</p>
            </div>
          ) : (
            filteredAnnouncements.map((announcement) => (
            <Link
              key={announcement.id}
              href={`/announcements/${announcement.id}`}
              className="block"
            >
              <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border-l-4 border-accent">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
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
                    <h3 className="text-2xl font-bold text-primary mb-3 hover:text-accent transition-colors">
                      {announcement.title}
                    </h3>
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed mb-4">
                  {announcement.excerpt}
                </p>
                <div className="flex items-center text-accent font-semibold hover:text-accent-dark">
                  Read more →
                </div>
              </div>
            </Link>
            ))
          )}
        </div>

        {/* Newsletter Subscription */}
        <div className="bg-gradient-to-r from-primary to-blue-800 text-white rounded-lg shadow-md p-8 mt-12">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Subscribe to Our Newsletter</h2>
            <p className="text-lg text-gray-100 mb-6">
              Get the latest announcements and updates delivered directly to your inbox
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <input
                type="email"
                placeholder="Enter your email address"
                className="px-4 py-3 rounded-lg text-gray-800 flex-1 max-w-md focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button className="bg-accent hover:bg-accent-dark text-white px-8 py-3 rounded-lg font-bold transition-colors whitespace-nowrap">
                Subscribe
              </button>
            </div>
            <p className="text-sm text-gray-200 mt-4">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
