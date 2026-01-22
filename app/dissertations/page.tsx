import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SecureDownloadButton from "@/components/ui/SecureDownloadButton";

export const dynamic = "force-dynamic";

export default async function DissertationsPage() {
  const dissertations = await prisma.dissertation.findMany({
    where: { status: "published" },
    include: {
      author: {
        select: { name: true }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 20
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Dissertations</h1>
          <p className="text-xl md:text-2xl text-gray-100 max-w-3xl">
            Explore groundbreaking doctoral research from leading universities worldwide
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Info Section */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-primary mb-4">About Our Dissertation Collection</h2>
          <p className="text-lg text-gray-700 mb-4 leading-relaxed">
            IJAISM proudly hosts a curated collection of exceptional doctoral dissertations from
            leading academic institutions worldwide. Our platform provides researchers with access
            to cutting-edge doctoral research in information technology, business management, and
            related disciplines.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            All dissertations undergo rigorous review and are made freely available to advance
            global knowledge and foster academic collaboration.
          </p>
        </div>

        {/* Submit Dissertation CTA */}
        <div className="bg-accent text-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h3 className="text-2xl font-bold mb-2">Submit Your Dissertation</h3>
              <p className="text-gray-100">
                Share your doctoral research with the global academic community
              </p>
            </div>
            <Link
              href="/dashboard/submit-dissertation"
              className="bg-white text-accent hover:bg-gray-100 px-8 py-3 rounded-lg font-bold transition-colors whitespace-nowrap"
            >
              Submit Now
            </Link>
          </div>
        </div>

        {/* Dissertations Grid */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-primary mb-6">Recent Dissertations</h2>
          <div className="grid gap-6">
            {dissertations.length > 0 ? (
              dissertations.map((dissertation) => (
                <div
                  key={dissertation.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                    <div className="flex-1">
                      {/* We don't have a specific dissertation detail page yet, usually it's just a PDF download or a simple view. 
                           For now, let's link to the same page or a detail page if it existed. 
                           Assuming /dissertations/[id] exists or should exist. If not, I'll link to # for now.
                        */}
                      <Link href={`/dissertations/${dissertation.id}`}>
                        <h3 className="text-xl font-bold text-primary mb-2 hover:text-accent transition-colors cursor-pointer">
                          {dissertation.title}
                        </h3>
                      </Link>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                          {dissertation.degreeType === 'phd' ? 'PhD' : 'Masters'}
                        </span>
                        {dissertation.defenseDate && (
                          <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                            {new Date(dissertation.defenseDate).getFullYear()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <p className="text-gray-800 font-semibold">{dissertation.author.name}</p>
                    <p className="text-gray-600">{dissertation.university}</p>
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-4 line-clamp-3">
                    {dissertation.abstract}
                  </p>
                  <div className="flex gap-3">
                    <Link
                      href={`/dissertations/${dissertation.id}`}
                      className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded font-medium transition-colors"
                    >
                      View Full Dissertation
                    </Link>
                    {dissertation.pdfUrl && (
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          const token = localStorage.getItem('token');
                          if (!token) {
                            window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
                            return;
                          }
                          const path = dissertation.pdfUrl?.replace(/^\/uploads\//, '');
                          window.open(`/api/files/download/${path}?token=${token}`, '_blank');
                        }}
                        className="border border-primary text-primary hover:bg-primary/10 px-6 py-2 rounded font-medium transition-colors"
                      >
                        Download PDF
                      </a>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500 text-lg">No published dissertations available at the moment.</p>
              </div>
            )}
          </div>
        </div>

        {/* Guidelines Section */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-3xl font-bold text-primary mb-6">Submission Guidelines</h2>
          <div className="space-y-4">
            <div className="border-l-4 border-accent pl-4">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Format Requirements</h3>
              <p className="text-gray-700">
                Dissertations must be submitted in PDF format with complete citations and references.
              </p>
            </div>
            <div className="border-l-4 border-accent pl-4">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Copyright</h3>
              <p className="text-gray-700">
                Authors retain copyright while granting IJAISM permission for online distribution.
              </p>
            </div>
            <div className="border-l-4 border-accent pl-4">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Review Process</h3>
              <p className="text-gray-700">
                All dissertations are reviewed for academic quality and adherence to standards.
              </p>
            </div>
            <div className="border-l-4 border-accent pl-4">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Access</h3>
              <p className="text-gray-700">
                Published dissertations are freely accessible to the global research community.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
