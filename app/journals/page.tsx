import Link from "next/link";
import JournalCoverImage from "@/components/journals/JournalCoverImage";
import Card from "@/components/ui/Card";
import { prisma } from "@/lib/prisma";
import JournalSearch from "@/components/journals/JournalSearch";

export const dynamic = "force-dynamic";

async function getJournals(page: number, limit: number, query?: string) {
  const where: any = { isActive: true };

  if (query) {
    where.OR = [
      { fullName: { contains: query, mode: 'insensitive' } },
      { code: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [journals, total] = await Promise.all([
    prisma.journal.findMany({
      where,
      orderBy: { fullName: "asc" }, // Consistent sorting for pagination
      skip,
      take: limit,
      select: {
        id: true,
        code: true,
        fullName: true,
        description: true,
        coverImageUrl: true,
        issn: true,
        eIssn: true,
        frequency: true,
        citeScore: true,
        impactFactor: true,
      },
    }),
    prisma.journal.count({ where })
  ]);

  return { journals, total, totalPages: Math.ceil(total / limit) };
}

export default async function JournalsPage(props: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams?.q || "";
  const page = Number(searchParams?.page) || 1;
  const limit = 10;

  const { journals, total, totalPages } = await getJournals(page, limit, query);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary text-white py-12 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-4">Academic Journals</h1>
            <p className="text-xl text-gray-100 mb-8">
              Browse our collection of {total} prestigious academic journals covering various disciplines
            </p>

            <JournalSearch />
          </div>
        </div>
      </div>

      {/* Journals Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {journals.length > 0 ? (
            journals.map((journal) => (
              <Link key={journal.id} href={`/journals/${journal.code.toLowerCase()}`} className="block">
                <Card className="hover:shadow-lg transition-shadow duration-300 overflow-hidden h-full flex flex-col">
                  <div className="flex flex-col md:flex-row gap-6 h-full">
                    <div className="md:w-48 flex-shrink-0 h-48 md:h-auto">
                      <JournalCoverImage code={journal.code} coverImageUrl={journal.coverImageUrl} />
                    </div>
                    <div className="flex-1 py-2 flex flex-col">
                      <h2 className="text-2xl font-bold mb-3 text-blue-600 hover:text-blue-800 transition-colors">
                        {journal.fullName}
                      </h2>

                      <div className="flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-700">
                          {journal.issn && (
                            <div className="font-medium">
                              <span className="font-bold text-gray-900">ISSN:</span> {journal.issn} (print)
                            </div>
                          )}
                          {journal.eIssn && (
                            <div className="font-medium">
                              <span className="font-bold text-gray-900">ISSN:</span> {journal.eIssn} (online)
                            </div>
                          )}
                          {journal.frequency && (
                            <div className="font-medium">
                              <span className="font-bold text-gray-900">Freq:</span> {journal.frequency}
                            </div>
                          )}
                          {(journal.citeScore !== null && journal.citeScore !== undefined) && (
                            <div className="font-medium">
                              <span className="font-bold text-gray-900">Citescore:</span> {journal.citeScore}
                            </div>
                          )}
                          {journal.impactFactor !== null && (
                            <div className="font-medium">
                              <span className="font-bold text-gray-900">IF:</span> {journal.impactFactor}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))
          ) : (
            <div className="col-span-2 text-center text-gray-500 py-12">
              No journals found matching your criteria.
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 border-t pt-8">
            <Link
              href={`/journals?page=${page - 1}${query ? `&q=${query}` : ''}`}
              className={`px-4 py-2 rounded border ${page <= 1 ? 'pointer-events-none opacity-50 bg-gray-100 text-gray-400' : 'bg-white hover:bg-gray-50 text-blue-600 border-blue-200'}`}
              aria-disabled={page <= 1}
            >
              ← Previous
            </Link>

            <span className="text-gray-600 font-medium">
              Page {page} of {totalPages}
            </span>

            <Link
              href={`/journals?page=${page + 1}${query ? `&q=${query}` : ''}`}
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
