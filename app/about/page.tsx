
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import SafeJournalCover from "@/components/journals/SafeJournalCover";

export const dynamic = 'force-dynamic';

export default async function AboutPage() {
  const settingsRecords = await prisma.globalSettings.findMany({
    where: {
      key: { in: ['site_name', 'site_mission', 'site_vision', 'site_location', 'site_contact_email'] }
    }
  });

  const settings: Record<string, string> = {
    site_name: 'C5K',
    site_mission: 'At C5K, we are dedicated to publishing groundbreaking research and promoting innovative ideas in the fields of information technology, business management, and related disciplines.',
    site_vision: 'To be a leading global platform for scholarly research.',
  };
  settingsRecords.forEach(s => settings[s.key] = s.value);

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
          <h1 className="text-4xl md:text-5xl font-bold font-serif mb-6">About {settings.site_name}</h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto opacity-90">
            Leading the Future of Scholarly Research
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">

        {/* Mission & Vision */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6 font-serif border-b-4 border-[#006d77] inline-block pb-2">Our Mission</h2>
            <div 
              className="text-lg text-gray-700 leading-relaxed mb-10 prose prose-blue max-w-none"
              dangerouslySetInnerHTML={{ __html: settings.site_mission }}
            />
            
            <h2 className="text-3xl font-bold text-gray-900 mb-6 font-serif border-b-4 border-[#006d77] inline-block pb-2">Our Vision</h2>
            <div 
              className="text-lg text-gray-700 leading-relaxed prose prose-blue max-w-none"
              dangerouslySetInnerHTML={{ __html: settings.site_vision }}
            />
          </div>
          <div className="bg-gray-100 rounded-lg p-8 shadow-inner flex items-center justify-center sticky top-24">
            <div className="text-center">
              <span className="text-6xl mb-4 block">🎓</span>
              <p className="text-xl font-bold text-gray-800">Excellence in Publishing</p>
              <p className="text-gray-600 mt-2">Serving the academic community since {new Date().getFullYear() - 2}</p>
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
            <div className="bg-white p-6 rounded-lg shadow-sm text-center border-t-4 border-t-blue-500">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">👨‍💻</div>
              <h3 className="font-bold text-lg text-gray-900">Dr. John Doe</h3>
              <p className="text-gray-600 text-sm mt-2 font-medium">Information Technology & Management</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center border-t-4 border-t-teal-500">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🤖</div>
              <h3 className="font-bold text-lg text-gray-900">Dr. Jane Smith</h3>
              <p className="text-gray-600 text-sm mt-2 font-medium">Machine Learning & AI</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center border-t-4 border-t-orange-500">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">📊</div>
              <h3 className="font-bold text-lg text-gray-900">Prof. Alan Brown</h3>
              <p className="text-gray-600 text-sm mt-2 font-medium">Business Management</p>
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
                  <SafeJournalCover
                    code={journal.code}
                    coverImageUrl={journal.coverImageUrl}
                    className="w-full h-full object-cover"
                    fallbackClassName="w-full h-full flex items-center justify-center bg-[#006d77] text-white font-bold text-3xl"
                    themeColor="#006d77"
                  />
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

        {/* Location Section */}
        <section className="bg-white border rounded-xl p-10 shadow-sm mt-16">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 font-serif">Location</h2>
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-3xl">📍</div>
              <div>
                <p className="text-xl font-bold text-gray-800">{settings.site_name} Academic Publishing</p>
                <div className="text-lg text-gray-600 mt-2 whitespace-pre-line">
                  {settings.site_location}
                </div>
              </div>
              <a href={`mailto:${settings.site_contact_email}`} className="mt-4 px-6 py-2 bg-[#006d77] text-white rounded font-bold hover:bg-[#005a63] transition-colors">
                Contact & Support
              </a>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
