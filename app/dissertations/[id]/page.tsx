import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import SecureDownloadButton from "@/components/ui/SecureDownloadButton";
import DissertationActions from "./DissertationActions";

export const dynamic = "force-dynamic";

export default async function DissertationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const dissertation = await prisma.dissertation.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          name: true,
          university: true,
        }
      }
    }
  });

  if (!dissertation) {
    notFound();
  }

  // Handle PDF download link logic - checking if URL exists
  const hasPdf = !!dissertation.pdfUrl;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center text-sm text-gray-600">
            <Link href="/" className="hover:text-primary">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/dissertations" className="hover:text-primary">Dissertation/Thesis</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 truncate">{dissertation.title}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-8">
              {/* Title and Badges */}
              <div className="mb-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="inline-block bg-accent/10 text-accent px-3 py-1 rounded-full text-sm font-medium">
                    {dissertation.degreeType === 'phd' ? 'PhD' : 'Masters'}
                  </span>
                  {dissertation.submissionDate && (
                    <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                      {new Date(dissertation.submissionDate).getFullYear()}
                    </span>
                  )}
                </div>
                <h1 className="text-4xl font-bold text-primary mb-4">
                  {dissertation.title}
                </h1>
              </div>

              {/* Cover Image - Added */}
              {dissertation.coverImageUrl && (
                <div className="mb-8 p-4 bg-gray-50 rounded-lg flex justify-center">
                  <img
                    src={dissertation.coverImageUrl}
                    alt={dissertation.title}
                    className="max-h-[400px] w-auto object-contain rounded shadow-sm"
                  />
                </div>
              )}

              {/* Author Info */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Author</p>
                    <p className="text-lg font-bold text-gray-800">
                      {dissertation.authorName || dissertation.author.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Supervisor</p>
                    <p className="text-lg font-semibold text-gray-800">{dissertation.supervisorName || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">University</p>
                    <p className="text-lg font-semibold text-gray-800">{dissertation.university}</p>
                  </div>
                  {dissertation.department && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Department</p>
                      <p className="text-lg font-semibold text-gray-800">{dissertation.department}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Abstract */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Abstract</h2>
                <div className="text-gray-700 leading-relaxed space-y-4 whitespace-pre-wrap">
                  {dissertation.abstract}
                </div>
              </div>

              {/* Keywords */}
              {dissertation.keywords.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Keywords</h2>
                  <div className="flex flex-wrap gap-2">
                    {dissertation.keywords.map((keyword: string, index: number) => (
                      <span
                        key={index}
                        className="inline-block bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Citation */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="font-bold text-gray-800 mb-2">How to Cite</h3>
                <p className="text-sm text-gray-700 font-mono">
                  {dissertation.authorName || dissertation.author.name} ({dissertation.defenseDate ? new Date(dissertation.defenseDate).getFullYear() : new Date().getFullYear()}). <em>{dissertation.title}</em>.
                  {dissertation.degreeType === 'phd' ? ' Doctoral dissertation' : ' Master\'s thesis'}, {dissertation.university}{dissertation.department ? `, ${dissertation.department}` : ''}.
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Details</h3>

              <div className="space-y-4 mb-6">
                {dissertation.defenseDate && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Defense Date</p>
                    <p className="font-semibold text-gray-800">
                      {new Date(dissertation.defenseDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
                {dissertation.submissionDate && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Submission Date</p>
                    <p className="font-semibold text-gray-800">
                      {new Date(dissertation.submissionDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <DissertationActions pdfUrl={dissertation.pdfUrl} title={dissertation.title} />
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8">
          <Link
            href="/dissertations"
            className="inline-flex items-center text-primary hover:text-accent font-semibold"
          >
            ← Back to All Dissertations
          </Link>
        </div>
      </div>
    </div>
  );
}
