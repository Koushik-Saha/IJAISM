import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // articleId
) {
    try {
        const { id: articleId } = await params;

        // Auth Check
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        // Restrict DOI editing to mother_admin and super_admin
        if (!decoded || !['super_admin', 'mother_admin'].includes(decoded.role)) {
            return NextResponse.json({ error: "Unauthorized - DOI updates restricted to Super Admins" }, { status: 403 });
        }

        const body = await request.json();
        const { doi } = body;

        if (doi === undefined) {
            return NextResponse.json({ error: "DOI is required" }, { status: 400 });
        }

        const existingArticle = await prisma.article.findUnique({
            where: { id: articleId },
            select: { id: true, doi: true }
        });

        if (!existingArticle) {
            return NextResponse.json({ error: "Article not found" }, { status: 404 });
        }

        // Update DOI and log activity
        const updatedArticle = await prisma.article.update({
            where: { id: articleId },
            data: {
                doi: doi,
                activityLogs: {
                    create: {
                        userId: decoded.userId,
                        action: 'doi_updated',
                        details: `DOI updated from "${existingArticle.doi || 'None'}" to "${doi}"`
                    }
                }
            }
        });

        return NextResponse.json({
            message: "DOI updated successfully",
            article: updatedArticle
        });

    } catch (error) {
        console.error("Error updating DOI:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
