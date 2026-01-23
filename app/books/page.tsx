
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function BooksPage(props: {
  searchParams: Promise<{ page?: string }>;
}) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams?.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  const [books, total] = await Promise.all([
    prisma.book.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: skip,
    }),
    prisma.book.count()
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Academic Books</h1>
          <p className="text-xl md:text-2xl text-gray-100 max-w-3xl">
            Comprehensive scholarly works advancing knowledge in IT and business
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Info Section */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-primary mb-4">IJAISM Academic Books</h2>
          <p className="text-lg text-gray-700 mb-4 leading-relaxed">
            IJAISM publishes high-quality academic books that provide comprehensive coverage of
            cutting-edge topics in information technology, business management, and related fields.
            Our books are authored by leading experts and undergo rigorous peer review.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            Whether you're a researcher, practitioner, or student, our collection offers
            authoritative resources to advance your knowledge and professional development.
          </p>
        </div>

        {/* Publishing CTA */}
        <div className="bg-gradient-to-r from-accent to-orange-600 text-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h3 className="text-2xl font-bold mb-2">Publish Your Book with IJAISM</h3>
              <p className="text-gray-100">
                Join our prestigious list of authors and reach a global audience
              </p>
            </div>
            <Link
              href="/book-publishing"
              className="bg-white text-accent hover:bg-gray-100 px-8 py-3 rounded-lg font-bold transition-colors whitespace-nowrap"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Books Grid */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-primary mb-6">Recent Publications</h2>

          {books.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {books.map((book) => (
                <div
                  key={book.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200"
                >
                  <div className="flex gap-4 mb-4">
                    {/* Book Cover Placeholder or Image */}
                    {book.coverImageUrl ? (
                      <img
                        src={book.coverImageUrl}
                        alt={book.title}
                        className="flex-shrink-0 w-32 h-auto object-cover rounded shadow-sm border border-gray-100"
                      />
                    ) : (
                      <div className="flex-shrink-0 w-32 h-48 bg-gradient-to-br from-primary to-blue-800 rounded flex items-center justify-center text-white font-bold text-center p-4 shadow-sm">
                        <div className="text-xs leading-tight">{book.title}</div>
                      </div>
                    )}

                    {/* Book Details */}
                    <div className="flex-1">
                      <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-2">
                        {book.field}
                      </span>
                      <Link href={`/books/${book.id}`}>
                        <h3 className="text-xl font-bold text-primary mb-2 hover:text-accent transition-colors cursor-pointer">
                          {book.title}
                        </h3>
                      </Link>
                      <p className="text-gray-700 font-medium mb-1">
                        {book.authors.join(", ")}
                      </p>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>ISBN: {book.isbn}</p>
                        <p>{book.pages} pages • {book.year}</p>
                        <p className="text-lg font-bold text-accent mt-2">{book.price}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-700 leading-relaxed mb-4 line-clamp-3">
                    {book.description}
                  </p>

                  <div className="flex gap-3">
                    <Link
                      href={`/books/${book.id}`}
                      className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded font-medium transition-colors flex-1 text-center"
                    >
                      View Details
                    </Link>
                    <Link
                      href={`/books/${book.id}`}
                      className="border border-primary text-primary hover:bg-primary/10 px-6 py-2 rounded font-medium transition-colors text-center"
                    >
                      Preview
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500 text-lg">No books available at the moment.</p>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 border-t pt-8">
            <Link
              href={`/books?page=${page - 1}`}
              className={`px-4 py-2 rounded border ${page <= 1 ? 'pointer-events-none opacity-50 bg-gray-100 text-gray-400' : 'bg-white hover:bg-gray-50 text-blue-600 border-blue-200'}`}
              aria-disabled={page <= 1}
            >
              ← Previous
            </Link>

            <span className="text-gray-600 font-medium">
              Page {page} of {totalPages}
            </span>

            <Link
              href={`/books?page=${page + 1}`}
              className={`px-4 py-2 rounded border ${page >= totalPages ? 'pointer-events-none opacity-50 bg-gray-100 text-gray-400' : 'bg-white hover:bg-gray-50 text-blue-600 border-blue-200'}`}
              aria-disabled={page >= totalPages}
            >
              Next →
            </Link>
          </div>
        )}

        {/* Categories Section */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8 mt-12">
          <h2 className="text-3xl font-bold text-primary mb-6">Book Categories</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border-l-4 border-accent pl-4">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Information Technology</h3>
              <ul className="text-gray-700 space-y-1">
                <li>• Machine Learning & AI</li>
                <li>• Cybersecurity</li>
                <li>• Cloud Computing</li>
                <li>• Data Science</li>
              </ul>
            </div>
            <div className="border-l-4 border-accent pl-4">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Business Management</h3>
              <ul className="text-gray-700 space-y-1">
                <li>• Digital Transformation</li>
                <li>• Leadership</li>
                <li>• Innovation Management</li>
                <li>• Strategic Planning</li>
              </ul>
            </div>
            <div className="border-l-4 border-accent pl-4">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Interdisciplinary</h3>
              <ul className="text-gray-700 space-y-1">
                <li>• Technology & Society</li>
                <li>• Digital Ethics</li>
                <li>• Innovation Economics</li>
                <li>• Research Methods</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-3xl font-bold text-primary mb-6">Why Choose IJAISM Books?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center font-bold text-lg mr-4">
                ✓
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Expert Authors</h3>
                <p className="text-gray-700">
                  Books written by leading researchers and practitioners in their fields.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center font-bold text-lg mr-4">
                ✓
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Rigorous Review</h3>
                <p className="text-gray-700">
                  All publications undergo thorough peer review for quality assurance.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center font-bold text-lg mr-4">
                ✓
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Digital Access</h3>
                <p className="text-gray-700">
                  Available in both print and digital formats for flexible reading.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center font-bold text-lg mr-4">
                ✓
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Global Reach</h3>
                <p className="text-gray-700">
                  Distributed worldwide to academic institutions and libraries.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
