
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SecureDownloadButton from "@/components/ui/SecureDownloadButton";

export const dynamic = "force-dynamic";

export default async function DissertationsPage(props: {
  searchParams: Promise<{ page?: string }>;
}) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams?.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  const [dissertations, total] = await Promise.all([
    prisma.dissertation.findMany({
      where: { status: "published" },
      include: {
        author: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: skip,
    }),
    prisma.dissertation.count({ where: { status: "published" } })
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Dissertation/Thesis</h1>
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
            C5K proudly hosts a curated collection of exceptional doctoral dissertations from
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
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Added Image Display */}
                    {dissertation.coverImageUrl && (
                      <div className="flex-shrink-0 w-full md:w-32 lg:w-40">
                        <img
                          src={dissertation.coverImageUrl}
                          alt={dissertation.title}
                          className="w-full h-auto object-cover rounded shadow-sm border border-gray-100"
                        />
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                        <div className="flex-1">
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
                        <p className="text-gray-800 font-semibold">
                          {/* Use authorName if available (from scrape), else relation name */}
                          {dissertation.authorName || dissertation.author.name}
                        </p>
                        <p className="text-gray-600">{dissertation.university}</p>
                      </div>
                      <p className="text-gray-700 leading-relaxed mb-4 line-clamp-3">
                        {dissertation.abstract}
                      </p>
                      <div className="flex gap-3 mt-auto">
                        <Link
                          href={`/dissertations/${dissertation.id}`}
                          className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded font-medium transition-colors"
                        >
                          View Full Dissertation
                        </Link>
                        {dissertation.pdfUrl && (
                          <SecureDownloadButton
                            pdfUrl={dissertation.pdfUrl}
                            label="Download PDF"
                            variant="link"
                            className="border border-primary text-primary hover:bg-primary/10 px-6 py-2 rounded font-medium transition-colors inline-block text-center cursor-pointer"
                          />
                        )}
                      </div>
                    </div>
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

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 border-t pt-8">
            <Link
              href={`/dissertations?page=${page - 1}`}
              className={`px-4 py-2 rounded border ${page <= 1 ? 'pointer-events-none opacity-50 bg-gray-100 text-gray-400' : 'bg-white hover:bg-gray-50 text-blue-600 border-blue-200'}`}
              aria-disabled={page <= 1}
            >
              ← Previous
            </Link>

            <span className="text-gray-600 font-medium">
              Page {page} of {totalPages}
            </span>

            <Link
              href={`/dissertations?page=${page + 1}`}
              className={`px-4 py-2 rounded border ${page >= totalPages ? 'pointer-events-none opacity-50 bg-gray-100 text-gray-400' : 'bg-white hover:bg-gray-50 text-blue-600 border-blue-200'}`}
              aria-disabled={page >= totalPages}
            >
              Next →
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
