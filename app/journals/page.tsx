import Link from "next/link";
import Card from "@/components/ui/Card";
import { prisma } from "@/lib/prisma";
import JournalSearch from "@/components/journals/JournalSearch";

export const dynamic = "force-dynamic";

async function getJournals(query?: string) {
  const where: any = { isActive: true };

  if (query) {
    where.OR = [
      { fullName: { contains: query, mode: 'insensitive' } },
      { code: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
    ];
  }

  return prisma.journal.findMany({
    where,
    orderBy: { displayOrder: "asc" },
    select: {
      id: true,
      code: true,
      fullName: true,
      description: true,
      coverImageUrl: true,
      issn: true,
      impactFactor: true,
    },
  });
}

export default async function JournalsPage(props: {
  searchParams: Promise<{ q?: string }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams?.q;
  const journals = await getJournals(query);

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
              Browse our collection of 12 prestigious academic journals covering various disciplines
            </p>

            <JournalSearch />
          </div>
        </div>
      </div>

      {/* Journals Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {journals.length > 0 ? (
            journals.map((journal) => (
              <Link key={journal.code} href={`/journals/${journal.code.toLowerCase()}`}>
                <Card className="h-full">
                  {journal.coverImageUrl ? (
                    <img
                      src={journal.coverImageUrl}
                      alt={journal.code}
                      className="h-48 w-full object-cover rounded-lg mb-4"
                    />
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-primary-light to-primary rounded-lg mb-4 flex items-center justify-center">
                      <span className="text-white text-4xl font-bold">{journal.code}</span>
                    </div>
                  )}
                  <h2 className="text-xl font-bold mb-2 text-primary">{journal.fullName}</h2>
                  <p className="text-gray-600 mb-4">
                    {journal.description || "No description available."}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    {journal.issn && <span>ISSN: {journal.issn}</span>}
                    {journal.impactFactor && (
                      <span className="bg-accent text-white px-2 py-1 rounded">
                        IF: {journal.impactFactor}
                      </span>
                    )}
                  </div>
                </Card>
              </Link>
            ))
          ) : (
            <div className="col-span-3 text-center text-gray-500">
              No journals available at this time.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
