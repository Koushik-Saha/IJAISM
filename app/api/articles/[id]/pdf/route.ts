import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { generateSignedFileToken } from "@/lib/security/url-signer";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // articleId
) {
    try {
        const { id: articleId } = await params;
        const url = new URL(request.url);

        // Auhtentication
        let token = request.headers.get('authorization')?.split(' ')[1];
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

        // 1. Author
        if (userId && article.authorId === userId) allowAccess = true;

        // 2. Editor / Admin
        if (['editor', 'super_admin', 'mother_admin'].includes(userRole)) allowAccess = true;

        // 3. Reviewer
        if (userId && userRole === 'reviewer') {
            const isAssigned = article.reviews.some(r => r.reviewerId === userId);
            if (isAssigned) {
                allowAccess = true;
            }
        }

        // 4. Public (if published)
        if (article.status === 'published') {
            allowAccess = true;
        }

        if (!allowAccess) {
            return NextResponse.json({ error: "Access Denied" }, { status: 403 });
        }

        // Generate Signed Token
        // Valid for 1 hour
        const signedToken = generateSignedFileToken(article.pdfUrl, 3600);

        // Construct Secure URL
        // We need the base URL to redirect correctly? 
        // Or relative redirect works in Next.js NextResponse.redirect? Yes, but usually needs absolute.
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || url.origin; // Usage of origin is safer for dynamic envs
        const secureUrl = `${appUrl}/api/secure-file?token=${signedToken}`;

        // Redirect
        return NextResponse.redirect(secureUrl);

    } catch (error: any) {
        console.error("PDF Serve Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
