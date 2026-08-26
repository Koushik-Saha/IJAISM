import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import BookClient from "./BookClient";
import { Metadata } from "next";

export const revalidate = 300;

function getAbsoluteImageUrl(url: string | null, baseUrl: string): string {
  if (!url) return `${baseUrl}/logo.png`;
  if (url.startsWith('http')) return url;
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const book = await prisma.book.findUnique({
    where: { id },
  });

  if (!book) return {};

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.c5k.com';

  // Format the publication date in YYYY/MM/DD or YYYY format
  const pubDate = book.publicationDate 
    ? new Date(book.publicationDate).toISOString().split('T')[0].replace(/-/g, '/') 
    : book.year?.toString() || '';

  const authors = book.authors && book.authors.length > 0 ? book.authors : ['C5K Scholar'];
  const coverUrl = getAbsoluteImageUrl(book.coverImageUrl, baseUrl);

  return {
    title: `${book.title} | C5K Books`,
    description: book.description || `A book on ${book.title}`,
    openGraph: {
      title: `${book.title} | C5K Books`,
      description: book.description || `A book on ${book.title}`,
      images: [
        {
          url: coverUrl,
          width: 800,
          height: 600,
          alt: book.title,
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: `${book.title} | C5K Books`,
      description: book.description || `A book on ${book.title}`,
      images: [coverUrl],
    },
    other: {
      'citation_title': book.title,
      'citation_author': authors,
      'citation_publication_date': pubDate,
      'citation_publisher': book.publisher || 'C5K Publishing',
      'citation_isbn': book.isbn || '',
      'citation_pdf_url': book.pdfUrl ? `${baseUrl}${book.pdfUrl}` : '',
    },
  };
}

export default async function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const book = await prisma.book.findUnique({
    where: { id },
    include: { chapters: true }
  });

  if (!book) {
    notFound();
  }

  // Parse JSON fields safely and cast to expected types for Client Component
  const tableOfContents = (book.tableOfContents as any[]) || [];
  const previewPages = (book.previewPages as any[]) || [];
  const reviews = (book.reviews as any[]) || [];

  return (
    <BookClient
      book={{
        ...book,
        createdAt: book.createdAt.toISOString(),
        updatedAt: book.updatedAt.toISOString(),
        publicationDate: book.publicationDate ? book.publicationDate.toISOString() : null,
        tableOfContents,
        previewPages,
        reviews,
        chapters: book.chapters // Passthrough
      }}
    />
  );
}
