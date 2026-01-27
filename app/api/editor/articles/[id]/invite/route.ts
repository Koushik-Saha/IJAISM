
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { sendEmail, sendReviewerInvitationEmail } from "@/lib/email/send";
import crypto from 'crypto';

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
        const decoded = verifyToken(authHeader.split(' ')[1]);
        if (!decoded || !['editor', 'super_admin'].includes(decoded.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { email, name } = body;

        if (!email || !name) {
            return NextResponse.json({ error: "Name and Email are required" }, { status: 400 });
        }

        // 1. Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            // If user exists, assign them directly
            // First check if already assigned
            const existingReview = await prisma.review.findFirst({
                where: {
                    articleId,
                    reviewerId: existingUser.id
                }
            });

            if (existingReview) {
                return NextResponse.json({ error: "User is already a reviewer for this article" }, { status: 400 });
            }

            // Assign
            const nextReviewerNumber = await prisma.review.count({ where: { articleId } }) + 1;

            await prisma.review.create({
                data: {
                    articleId,
                    reviewerId: existingUser.id,
                    reviewerNumber: nextReviewerNumber,
                    status: 'invited',
                    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days default
                }
            });

            // Ensure they have reviewer role?
            if (existingUser.role === 'user' || existingUser.role === 'author') {
                // Upgrade to reviewer
                await prisma.user.update({
                    where: { id: existingUser.id },
                    data: { role: 'reviewer' }
                });
            }

            // Send Notification Email (Standard Assignment)
            await sendReviewerInvitationEmail(email, name, `Article #${articleId.substring(0, 8)}`, 'C5K Platform', 'EXISTING_USER_LOGIN');

            return NextResponse.json({ success: true, message: "User existed. Assigned as reviewer directly." });
        }

        // 2. If User does NOT exist -> Create Invitation
        // Check existing pending invitation
        const existingInv = await prisma.reviewerInvitation.findFirst({
            where: { email, articleId, status: 'pending' }
        });

        if (existingInv) {
            return NextResponse.json({ error: "Invitation already sent to this email." }, { status: 400 });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

        const invitation = await prisma.reviewerInvitation.create({
            data: {
                articleId,
                email,
                name,
                token,
                status: 'pending',
                expiresAt
            }
        });

        // 3. Send Invitation Email with Registration Link
        // Fetch article details for email
        const article = await prisma.article.findUnique({
            where: { id: articleId },
            include: { journal: true }
        });

        await sendReviewerInvitationEmail(
            email,
            name,
            article?.title || 'Unknown Title',
            article?.journal?.fullName || 'C5K Journal',
            token
        );

        return NextResponse.json({ success: true, message: "Invitation sent successfully", invitation });

    } catch (error: any) {
        console.error("Invite Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
