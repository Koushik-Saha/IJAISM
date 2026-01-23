
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";

export const dynamic = 'force-dynamic';

export default async function AboutPage() {
  const journals = await prisma.journal.findMany({
    take: 3,
    orderBy: { fullName: 'asc' },
    select: {
      id: true,
      fullName: true,
      code: true,
      coverImageUrl: true,
      description: true
    }
  });

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <div className="bg-[#c05621] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold font-serif mb-6">About C5K</h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto opacity-90">
            Leading the Future of Scholarly Research in IT and Business Management
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">

        {/* Mission */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6 font-serif border-b-4 border-[#006d77] inline-block pb-2">Our Mission</h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              At C5K, we are dedicated to publishing groundbreaking research and promoting innovative ideas in the fields of information technology, business management, and related disciplines.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              Our goal is to minimize the delay in sharing new ideas and discoveries with the world, making high-quality, peer-reviewed journals available online. We strive to bridge the gap between theoretical knowledge and real-world application.
            </p>
          </div>
          <div className="bg-gray-100 rounded-lg p-8 shadow-inner flex items-center justify-center">
            {/* Placeholder for an About Image if needed, or just a decorative block */}
            <div className="text-center">
              <span className="text-6xl mb-4 block">🎓</span>
              <p className="text-xl font-bold text-gray-800">Excellence in Publishing</p>
            </div>
          </div>
        </section>

        {/* Focus Areas */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center font-serif">Focus Areas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              "Information Technology & Management",
              "Computing, Machine Learning & AI",
              "Business Management & Social Development",
              "Entrepreneurship & Marketing",
              "Internet Security & Protocols",
              "Banking, Finance & Leadership"
            ].map((area, idx) => (
              <div key={idx} className="bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow border-l-4 border-l-[#006d77]">
                <h3 className="text-lg font-bold text-gray-800">{area}</h3>
              </div>
            ))}
          </div>
        </section>

        {/* Reviewer Expertise via text match */}
        <section className="bg-gray-50 rounded-xl p-10">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 font-serif">Reviewer Expertise</h2>
            <p className="text-gray-600 text-lg">Our journals are supported by a team of highly skilled reviewers, each an expert in their field, ensuring the integrity and quality of every publication.</p>
          </div>
          {/* Note: Real user data would come from DB, but matching static content for now as requested */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">👨‍💻</div>
              <h3 className="font-bold text-lg text-gray-900">Information Technology</h3>
              <p className="text-gray-600 text-sm mt-2">Expert oversight on systems, security, and protocols.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🤖</div>
              <h3 className="font-bold text-lg text-gray-900">Machine Learning & AI</h3>
              <p className="text-gray-600 text-sm mt-2">Specialized review for algorithms and intelligent systems.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">📊</div>
              <h3 className="font-bold text-lg text-gray-900">Business Management</h3>
              <p className="text-gray-600 text-sm mt-2">Strategic insights into marketing, finance, and leadership.</p>
            </div>
          </div>
        </section>

        {/* 3 Journals Display */}
        <section>
          <div className="flex justify-between items-center mb-10 border-b pb-4">
            <h2 className="text-3xl font-bold text-gray-900 font-serif">Featured Journals</h2>
            <Link href="/journals" className="text-[#006d77] font-semibold hover:underline">View All Journals →</Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {journals.map(journal => (
              <div key={journal.id} className="bg-white border rounded-lg shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                <div className="h-48 bg-gray-200 relative">
                  {journal.coverImageUrl ? (
                    <img src={journal.coverImageUrl} alt={journal.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 font-bold text-xl">
                      {journal.code}
                    </div>
                  )}
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                    <Link href={`/journals/${journal.code}/overview`} className="hover:text-[#c05621]">
                      {journal.fullName}
                    </Link>
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">{journal.description || "A premier journal for research and academic excellence."}</p>
                  <Link
                    href={`/journals/${journal.code}/overview`}
                    className="mt-auto inline-block text-center w-full py-2 border border-[#006d77] text-[#006d77] font-bold rounded hover:bg-[#006d77] hover:text-white transition-colors"
                  >
                    View Journal
                  </Link>
                </div>
              </div>
            ))}
            {journals.length === 0 && (
              <div className="col-span-3 text-center py-10 text-gray-500 italic">No journals found.</div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
