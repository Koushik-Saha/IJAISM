import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';

interface Props {
  params: Promise<{ slug: string[] }>;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default async function DoiResolverPage({ params }: Props) {
  const { slug } = await params;
  if (!slug || slug.length === 0) {
    notFound();
  }

  const rawSlug = slug.join('/');

  // 1. Search in Books (by doi, isbn, id, or slugified title)
  const book = await prisma.book.findFirst({
    where: {
      OR: [
        { doi: { contains: rawSlug, mode: 'insensitive' } },
        { id: rawSlug },
        { isbn: rawSlug },
      ]
    },
    select: { id: true, title: true }
  });

  if (book) {
    const bookSlug = slugify(book.title);
    redirect(`/books/${bookSlug}`);
  }

  // Check fuzzy book title match if slug is e.g. "books/5"
  const allBooks = await prisma.book.findMany({ select: { id: true, title: true, doi: true } });
  for (const b of allBooks) {
    if (b.doi && b.doi.toLowerCase().includes(rawSlug.toLowerCase())) {
      redirect(`/books/${slugify(b.title)}`);
    }
  }

  // 2. Search in Articles (by doi or id)
  const article = await prisma.article.findFirst({
    where: {
      OR: [
        { doi: { contains: rawSlug, mode: 'insensitive' } },
        { id: rawSlug },
      ],
      deletedAt: null
    },
    select: { id: true }
  });

  if (article) {
    redirect(`/articles/${article.id}/read`);
  }

  // 3. Search in Dissertations (by doi or id)
  const dissertation = await prisma.dissertation.findFirst({
    where: {
      OR: [
        { doi: { contains: rawSlug, mode: 'insensitive' } },
        { id: rawSlug },
      ]
    },
    select: { id: true }
  });

  if (dissertation) {
    redirect(`/dissertations/${dissertation.id}`);
  }

  notFound();
}
