import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';

interface Props {
  params: Promise<{ articleId: string }>;
}

export default async function ArticleRedirectPage({ params }: Props) {
  const { articleId } = await params;

  const article = await prisma.article.findFirst({
    where: {
      doi: { endsWith: `/${articleId}` },
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!article) {
    notFound();
  }

  redirect(`/articles/${article.id}/read`);
}
