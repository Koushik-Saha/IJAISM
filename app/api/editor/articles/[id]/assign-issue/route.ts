import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function POST(
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

        if (!decoded || !['editor', 'super_admin'].includes(decoded.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { issueId } = body;

        if (!issueId) {
            return NextResponse.json({ error: "Issue ID is required" }, { status: 400 });
        }

        // Check permission if already assigned
        const existingArticle = await prisma.article.findUnique({
            where: { id: articleId },
            select: { issueId: true }
        });

        if (!existingArticle) {
            return NextResponse.json({ error: "Article not found" }, { status: 404 });
        }

        if (existingArticle.issueId && decoded.role !== 'super_admin') {
            return NextResponse.json({
                error: "Permission Denied: Only Super Admin can re-assign issues."
            }, { status: 403 });
        }

        const issue = await prisma.journalIssue.findUnique({
            where: { id: issueId }
        });

        if (!issue) {
            return NextResponse.json({ error: "Issue not found" }, { status: 404 });
        }

        // Assign article to issue and update metadata
        const updatedArticle = await prisma.article.update({
            where: { id: articleId },
            data: {
                issueId: issue.id,
                volume: issue.volume,
                issue: issue.issue,
            }
        });

        return NextResponse.json({
            message: "Article assigned to issue successfully",
            article: updatedArticle
        });

    } catch (error) {
        console.error("Error assigning issue:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
