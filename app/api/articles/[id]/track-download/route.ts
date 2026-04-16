import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const article = await prisma.article.update({
            where: { id },
            data: { downloadCount: { increment: 1 } },
            select: { pdfUrl: true }
        });
        
        if (!article.pdfUrl) {
            return new NextResponse("PDF not found", { status: 404 });
        }
        
        const urlToRedirect = article.pdfUrl.startsWith('http') 
            ? article.pdfUrl 
            : new URL(article.pdfUrl, request.url).toString();
            
        return NextResponse.redirect(urlToRedirect);
    } catch (e) {
        console.error("Error tracking download", e);
        return new NextResponse("Error tracking download", { status: 500 });
    }
}
