import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    // Parse form data
    const formData = await req.formData();
    
    // Validate Article
    const article = await prisma.article.findUnique({
      where: { id },
      include: { author: true }
    });

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Only allow if proof_requested
    if (article.status !== 'proof_requested') {
      return NextResponse.json({ error: 'Proofing is not currently requested for this article' }, { status: 400 });
    }

    // Must be author or an admin acting on behalf
    if (article.authorId !== decoded.userId && decoded.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const title = formData.get('title') as string;
    const abstract = formData.get('abstract') as string;
    const keywords = JSON.parse(formData.get('keywords') as string || '[]');
    const coAuthors = JSON.parse(formData.get('coAuthors') as string || '[]');

    // Upload files if any (simulated here for MVP to keep simplicity, relying on standard backend S3 handlers if implemented, else just keeping existing URLs)
    // For a real production system, you'd process the File objects in formData
    const newPdfUrl = formData.get('pdfUrl') as string | null;
    const newCoverLetterUrl = formData.get('coverLetterUrl') as string | null;

    // Update Article Core Text
    await prisma.article.update({
      where: { id },
      data: {
        title: title || article.title,
        abstract: abstract || article.abstract,
        keywords: keywords.length > 0 ? keywords : article.keywords,
        status: 'proof_resubmitted',
        ...(newPdfUrl && { pdfUrl: newPdfUrl }),
        ...(newCoverLetterUrl && { coverLetterUrl: newCoverLetterUrl }),
      }
    });

    // Update CoAuthors (Wipe and replace for simplicity)
    await prisma.coAuthor.deleteMany({
      where: { articleId: id }
    });

    if (coAuthors.length > 0) {
      await prisma.coAuthor.createMany({
        data: coAuthors.map((c: any, index: number) => ({
          articleId: id,
          name: c.name,
          email: c.email || null,
          university: c.university || null,
          isMain: false,
          order: index + 1
        }))
      });
    }

    // Optionally update main author's university if provided
    const mainAuthorUniversity = formData.get('mainAuthorUniversity') as string | null;
    if (mainAuthorUniversity) {
       await prisma.user.update({
           where: { id: article.authorId },
           data: { university: mainAuthorUniversity }
       });
    }

    return NextResponse.json({ success: true, message: 'Proof submitted successfully' });

  } catch (error: any) {
    console.error('Submit proof error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit proof' },
      { status: 500 }
    );
  }
}
