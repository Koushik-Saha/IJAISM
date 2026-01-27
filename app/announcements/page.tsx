import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AnnouncementListClient from "./AnnouncementListClient";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const announcements = await prisma.announcement.findMany({
    where: {
      publishedAt: { lte: new Date() }
    },
    orderBy: [
      { priority: 'desc' },
      { publishedAt: 'desc' }
    ]
  });

  // Calculate unique categories from DB or use predefined set if we want fixed filters
  // Database might have varying categories.
  // We'll stick to fixed categories + any from DB?
  // Let's passed the data to client component.

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Announcements</h1>
          <p className="text-xl md:text-2xl text-gray-100 max-w-3xl">
            Stay updated with the latest news and updates from C5K
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <AnnouncementListClient announcements={announcements} />

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
