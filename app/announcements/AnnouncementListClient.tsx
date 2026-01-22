"use client";

import { useState } from "react";
import Link from "next/link";
import { Announcement } from "@prisma/client";

interface AnnouncementListClientProps {
    announcements: Announcement[];
}

export default function AnnouncementListClient({ announcements }: AnnouncementListClientProps) {
    const [selectedCategory, setSelectedCategory] = useState("All");

    const categories = ["All", "Journal", "Conference", "Scholarship", "Guidelines", "Editorial", "Platform", "Partnership"];

    // Filter announcements based on selected category
    const filteredAnnouncements = selectedCategory === "All"
        ? announcements
        : announcements.filter(announcement => announcement.category === selectedCategory);

    return (
        <>
            {/* Filter Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Filter by Category</h2>
                <div className="flex flex-wrap gap-3">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${category === selectedCategory
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
                                        <div className="flex flex-col md:flex-row gap-6 mb-4">
                                            {announcement.thumbnailUrl && (
                                                <div className="flex-shrink-0 w-full md:w-48 h-32 relative rounded-lg overflow-hidden flex items-center justify-center bg-gray-100">
                                                    {/* Use standard img tag for simplicity with external URLs, or Next Image if domains configured */}
                                                    <img
                                                        src={announcement.thumbnailUrl}
                                                        alt={announcement.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <div className="flex flex-wrap items-center gap-3 mb-2">
                                                    {announcement.priority >= 2 && (
                                                        <span className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold uppercase">
                                                            Important
                                                        </span>
                                                    )}

                                                    {announcement.category && (
                                                        <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                                                            {announcement.category}
                                                        </span>
                                                    )}

                                                    <span className="text-sm text-gray-600">
                                                        {new Date(announcement.publishedAt || announcement.createdAt).toLocaleDateString("en-US", {
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
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </>
    );
}
