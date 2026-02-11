import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import BookClient from "./BookClient";

export const dynamic = "force-dynamic";

export default async function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const book = await prisma.book.findUnique({
    where: { id },
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
        tableOfContents,
        previewPages,
        reviews,
      }}
    />
  );
}
