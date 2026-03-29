import { redirect } from "next/navigation";

export default async function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // We have completely redesigned the public article view to the ScienceDirect layout
  // located at /articles/[id]/read. Rather than duplicate code, we redirect the old URL.
  redirect(`/articles/${id}/read`);
}
