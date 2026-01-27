
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import fs from 'fs';
import path from 'path';
import mime from 'mime';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // articleId
) {
    try {
        const { id: articleId } = await params;
        const url = new URL(request.url);
        const downloadParam = url.searchParams.get('download');

        // Allow token in query param for easier PDF viewer integration (if needed) 
        // OR rely on Authorization header. Standard is Header. 
        // If viewing in browser PDF viewer, headers are hard to pass unless using blob.
        // Let's check headers first.
        let token = request.headers.get('authorization')?.split(' ')[1];

        // Fallback to query param token if provided (useful for iframe/direct links)
        if (!token) {
            token = url.searchParams.get('token') || undefined;
        }

        let userRole = 'guest';
        let userId = '';

        if (token) {
            const decoded = verifyToken(token);
            if (decoded) {
                userRole = decoded.role;
                userId = decoded.userId;
            }
        }

        const article = await prisma.article.findUnique({
            where: { id: articleId },
            include: {
                reviews: true
            }
        });

        if (!article || !article.pdfUrl) {
            return NextResponse.json({ error: "PDF not found" }, { status: 404 });
        }

        // Access Control Logic
        let allowAccess = false;
        let forceInline = false;

        // 1. Author
        if (userId && article.authorId === userId) allowAccess = true;

        // 2. Editor / Admin
        if (['editor', 'super_admin', 'mother_admin'].includes(userRole)) allowAccess = true;

        // 3. Reviewer
        if (userId && userRole === 'reviewer') {
            const isAssigned = article.reviews.some(r => r.reviewerId === userId);
            if (isAssigned) {
                allowAccess = true;
                forceInline = true; // Reviewers MUST view inline
            }
        }

        // 4. Public (if published)
        if (article.status === 'published') {
            // Public can usually download, unless we want to restrict?
            // Requirement says "Reviewer can view only... no download".
            // If it's published, everyone can download.
            // But if the reviewer is reviewing, it implies it might NOT be published yet (Under Review).
            // So for unpublished papers, this logic holds.
            allowAccess = true;
        }

        if (!allowAccess) {
            return NextResponse.json({ error: "Access Denied" }, { status: 403 });
        }

        if (forceInline && downloadParam === 'true') {
            return NextResponse.json({ error: "Download is restricted for reviewers. View only." }, { status: 403 });
        }

        // Serve File
        // Handle local file path (e.g., /uploads/dummy.pdf)
        let filePath = article.pdfUrl;
        if (filePath.startsWith('/')) {
            // Remove leading slash for local fs path relative to process.cwd()
            // Assuming public folder structure
            if (filePath.startsWith('/uploads')) {
                filePath = path.join(process.cwd(), 'public', filePath);
            } else {
                filePath = path.join(process.cwd(), filePath);
            }
        }

        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: "File not found on server" }, { status: 404 });
        }

        const fileBuffer = fs.readFileSync(filePath);
        const contentType = mime.getType(filePath) || 'application/pdf';
        const fileName = path.basename(filePath);

        const disposition = (forceInline || downloadParam !== 'true') ? 'inline' : `attachment; filename="${fileName}"`;

        const response = new NextResponse(fileBuffer);
        response.headers.set('Content-Type', contentType);
        response.headers.set('Content-Disposition', disposition);

        return response;

    } catch (error: any) {
        console.error("PDF Serve Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
