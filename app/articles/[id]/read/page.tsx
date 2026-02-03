import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const article = await prisma.article.findUnique({
        where: { id },
        select: { title: true },
    });

    return {
        title: `Reading: ${article?.title || 'Article'} - C5K`,
    };
}

export default async function ReadArticlePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const article = await prisma.article.findUnique({
        where: { id },
        select: {
            id: true,
            title: true,
            pdfUrl: true,
            journal: { select: { code: true } }
        }
    });

    if (!article || !article.pdfUrl) {
        return notFound();
    }

    // Determine PDF Source URL
    // If remote (http), use directly. If local, use the PDF API route which handles token auth if needed (or public access).
    // Ideally, for a "Reader", we want a raw view.
    // We'll use the API route for consistency if it's not a remote blob.
    // Always use the proxy API route. 
    // This accepts the Access Control checks (e.g. verified purchase, subscription) 
    // and serves the file from the same origin, avoiding CSP/CORS issues with direct Blob embeds.
    const pdfSource = `/api/articles/${article.id}/pdf`;

    return (
        <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
            {/* Reader Header */}
            <header className="bg-white border-b border-gray-200 h-14 flex items-center justify-between px-4 z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <Link
                        href={`/articles/${article.id}`}
                        className="text-gray-500 hover:text-gray-900 transition-colors"
                        title="Back to Article Details"
                    >
                        ← Back
                    </Link>
                    <div className="h-4 w-px bg-gray-300"></div>
                    <h1 className="font-semibold text-gray-800 truncate max-w-xl" title={article.title}>
                        {article.title}
                    </h1>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200 hidden sm:inline-block">
                        {article.journal.code}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {/* Annotation Placeholder - simulating interactive features */}
                    <button
                        className="text-sm p-2 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-50"
                        title="Highlight (Coming Soon)"
                        disabled
                    >
                        🖍️
                    </button>
                    <button
                        className="text-sm p-2 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-50"
                        title="Comment (Coming Soon)"
                        disabled
                    >
                        💬
                    </button>
                    <div className="h-4 w-px bg-gray-300 mx-1"></div>
                    <a
                        href={`${pdfSource}?download=true`}
                        className="text-sm bg-primary text-white px-3 py-1.5 rounded hover:bg-primary/90 transition-colors"
                    >
                        Download PDF
                    </a>
                </div>
            </header>

            {/* Main Reader Area */}
            <main className="flex-1 relative bg-gray-500">
                <iframe
                    src={`${pdfSource}#toolbar=0&navpanes=0&scrollbar=0`}
                    className="w-full h-full border-0"
                    title="PDF Reader"
                    allowFullScreen
                >
                </iframe>

                {/* Helper message if iframe block fails or for better UX */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/50 px-4 py-2 rounded-full text-xs opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                    Using Native Browser PDF Viewer
                </div>
            </main>
        </div>
    );
}
