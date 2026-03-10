import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReviewerResponseNotification } from "@/lib/email/send";

// GET /api/invitations/[id]
// Public endpoint to fetch basic invitation details (Article Title, Abstract, Review Status)
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // reviewId
) {
    try {
        const { id } = await params;

        const review = await prisma.review.findUnique({
            where: { id },
            include: {
                article: {
                    include: {
                        journal: true
                    }
                },
                reviewer: true
            }
        });

        if (!review) {
            return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
        }

        return NextResponse.json({
            reviewId: review.id,
            status: review.status,
            reviewerName: review.reviewer.name,
            article: {
                title: review.article.title,
                abstract: review.article.abstract,
                journalName: review.article.journal?.fullName || "C5K Journal"
            }
        });

    } catch (error: any) {
        console.error("Fetch Invitation Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/invitations/[id]
// Public endpoint to Accept or Decline a review invitation
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // reviewId
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { action } = body; // 'accept' or 'decline'

        if (!['accept', 'decline'].includes(action)) {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        const review = await prisma.review.findUnique({
            where: { id },
            include: { reviewer: true }
        });

        if (!review) {
            return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
        }

        if (review.status !== 'invited') {
            return NextResponse.json({ error: "This invitation has already been processed" }, { status: 400 });
        }

        const newStatus = action === 'accept' ? 'accepted' : 'declined';

        const updatedReview = await prisma.review.update({
            where: { id },
            data: {
                status: newStatus
            }
        });

        // Notify the Editor
        try {
            const article = await prisma.article.findUnique({
                where: { id: review.articleId },
                include: {
                    journal: {
                        include: { editor: true }
                    }
                }
            });

            if (article) {
                let editorEmail = article.journal?.editor?.email;
                let editorName = article.journal?.editor?.name || "Editor";

                if (!editorEmail) {
                    const fallbackAdmin = await prisma.user.findFirst({
                        where: { role: 'admin', isActive: true },
                        orderBy: { createdAt: 'asc' }
                    });
                    if (fallbackAdmin) {
                        editorEmail = fallbackAdmin.email;
                        editorName = fallbackAdmin.name || "Admin";
                    }
                }

                if (editorEmail) {
                    await sendReviewerResponseNotification(
                        editorEmail,
                        editorName,
                        review.reviewer?.name || "A reviewer",
                        article.title,
                        article.journal?.fullName || "C5K Journal",
                        newStatus as 'accepted' | 'declined',
                        article.id
                    );
                }
            }
        } catch (emailError) {
            console.error("Failed to send editor notification:", emailError);
            // Non-blocking: We still return success to the reviewer
        }

        return NextResponse.json({
            success: true,
            status: updatedReview.status,
            message: `Invitation successfully ${newStatus}.`,
            reviewerEmail: review.reviewer?.email,
            isNewReviewer: review.reviewer?.forcePasswordChange || false
        });

    } catch (error: any) {
        console.error("Update Invitation Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
