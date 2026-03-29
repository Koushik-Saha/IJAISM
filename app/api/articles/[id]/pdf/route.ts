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

        if (!article) {
            return NextResponse.json({ error: "Article not found" }, { status: 404 });
        }

        const type = url.searchParams.get('type') || 'pdf';
        const index = parseInt(url.searchParams.get('index') || '0', 10);

        let targetUrl = article.pdfUrl;
        if (type === 'coverLetter') {
            targetUrl = article.coverLetterUrl;
        } else if (type === 'supplementary') {
            const suppFiles = (article as any).supplementaryFiles || [];
            if (suppFiles.length > index) {
                targetUrl = suppFiles[index];
            } else {
                targetUrl = null;
            }
        }

        if (!targetUrl) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        // Access Control Logic
        let isStaffOrAuthor = false;

        // 1. Author
        if (userId && article.authorId === userId) isStaffOrAuthor = true;

        // 2. Editor / Admin
        if (['editor', 'super_admin', 'mother_admin'].includes(userRole)) isStaffOrAuthor = true;

        // 3. Reviewer
        if (userId && userRole === 'reviewer') {
            const isAssigned = article.reviews.some(r => r.reviewerId === userId);
            if (isAssigned) {
                isStaffOrAuthor = true;
            }
        }

        let allowAccess = false;
        let requiresCredits = false;

        // 4. Public (if published)
        if (isStaffOrAuthor) {
            allowAccess = true;
        } else if (article.status === 'published') {
            if (!userId) {
                // Temporary redirect to login if guest attempts to download
                // Using standard redirect to `/login` since this is often triggered via window.location.href or direct linking
                return NextResponse.redirect(`${url.origin}/login?redirect=/articles/${articleId}`);
            }
            requiresCredits = true;
            allowAccess = true;
        }

        if (!allowAccess) {
            return NextResponse.json({ error: "Access Denied" }, { status: 403 });
        }

        if (requiresCredits && userId) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: { membership: true }
            });

            if (!user) {
                return NextResponse.redirect(`${url.origin}/login`);
            }

            let tier = 'free';
            if (user.membership && user.membership.status === 'active' && user.membership.endDate > new Date()) {
                tier = user.membership.tier.toLowerCase();
            }

            let limit = 0;
            if (tier === 'free') limit = 3;
            else if (tier === 'basic') limit = 10;
            else if (tier === 'premium' || tier === 'institutional') limit = Infinity;

            if (limit !== Infinity) {
                const startOfMonth = new Date();
                startOfMonth.setDate(1);
                startOfMonth.setHours(0, 0, 0, 0);

                const downloads = await prisma.downloadLog.findMany({
                    where: { 
                        userId, 
                        resourceType: { startsWith: 'article' }, 
                        downloadedAt: { gte: startOfMonth } 
                    },
                    select: { resourceId: true },
                    distinct: ['resourceId']
                });

                const hasDownloadedBefore = downloads.some(d => d.resourceId === articleId);

                if (!hasDownloadedBefore) {
                    if (downloads.length >= limit) {
                        return NextResponse.redirect(`${url.origin}/membership?upgrade=true&reason=limit_reached`);
                    }
                }
            }
        }

        // Always log download if we know who the user is for analytics (including authors)
        if (userId) {
            const isDownload = url.searchParams.get('download') === 'true';
            await prisma.downloadLog.create({
                data: {
                    userId,
                    resourceId: articleId,
                    resourceType: isDownload ? 'article_download' : 'article_view',
                    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
                }
            });
        }

        // Always update global download count
        await prisma.article.update({
            where: { id: articleId },
            data: { downloadCount: { increment: 1 } }
        });

        // Generate Signed Token
        // Valid for 1 hour
        const signedToken = generateSignedFileToken(targetUrl, 3600);

        // Construct Secure URL
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || url.origin;
        const secureUrl = `${appUrl}/api/secure-file?token=${signedToken}`;

        // Redirect
        return NextResponse.redirect(secureUrl);

    } catch (error: any) {
        console.error("PDF Serve Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
