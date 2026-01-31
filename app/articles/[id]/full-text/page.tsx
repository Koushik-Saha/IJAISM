
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import { sanitizeContent } from "@/lib/security/sanitizer";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const article = await prisma.article.findUnique({
        where: { id },
        select: { title: true },
    });

    if (!article) {
        return {
            title: "Article Not Found",
        };
    }

    return {
        title: `Full Text: ${article.title}`,
    };
}

export default async function ArticleFullTextPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const article = await prisma.article.findUnique({
        where: { id },
        include: {
            journal: true,
            author: {
                select: {
                    name: true,
                    university: true,
                    affiliation: true,
                },
            },
            coAuthors: true,
        },
    });

    if (!article) {
        notFound();
    }

    const allAuthors = [
        { name: article.author.name || "Unknown", affiliation: article.author.affiliation || article.author.university },
        ...article.coAuthors.map((ca) => ({ name: ca.name, affiliation: ca.university })),
    ];

    const publicationDate = article.publicationDate
        ? new Date(article.publicationDate).toISOString().split("T")[0]
        : "Not yet published";

    const fullText = (article as any).fullText || article.abstract;

    if (!fullText) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl w-full text-center">
                    <h1 className="text-2xl font-bold mb-4">Content Not Available</h1>
                    <p className="text-gray-600 mb-6">This article does not have any text content available.</p>
                    <Link href={`/articles/${id}`} className="px-6 py-2 bg-primary text-white rounded hover:bg-blue-700 transition">
                        Back to Article Details
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header / Nav */}
            <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div>
                        <Link href={`/articles/${id}`} className="text-sm font-medium text-gray-600 hover:text-black flex items-center gap-1">
                            ← Back to Article Details
                        </Link>
                    </div>
                    <div className="text-sm text-gray-500 hidden sm:block">
                        {article.journal.code}
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-white mt-8 shadow-sm rounded-lg min-h-[80vh]">

                {/* Article Header */}
                <header className="mb-12 border-b pb-8">
                    <h1 className="text-3xl md:text-5xl font-extrabold mb-6 text-gray-900 leading-tight">
                        {article.title}
                    </h1>

                    <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap gap-x-6 gap-y-2">
                            {allAuthors.map((author, index) => (
                                <div key={index} className="flex flex-col">
                                    <span className="font-bold text-gray-800 text-lg">{author.name}</span>
                                    {author.affiliation && (
                                        <span className="text-sm text-gray-500">{author.affiliation}</span>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="text-sm text-gray-500 mt-2">
                            Published: {publicationDate} • {article.journal.fullName}
                        </div>
                    </div>
                </header>

                {/* Full Text Content */}
                <article className="prose prose-lg max-w-none prose-headings:font-bold prose-a:text-blue-600 prose-img:rounded-xl">
                    <div
                        className="whitespace-pre-wrap leading-relaxed text-gray-800"
                        dangerouslySetInnerHTML={{ __html: sanitizeContent(fullText) }}
                    />
                </article>

            </div>
        </div>
    );
}
