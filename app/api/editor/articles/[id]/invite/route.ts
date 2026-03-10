import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { sendEmail, sendReviewerInvitationEmail, sendReviewerTempPasswordEmail } from "@/lib/email/send";
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

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
        const { email, name, tempPassword } = body;

        if (!email || !name) {
            return NextResponse.json({ error: "Name and Email are required" }, { status: 400 });
        }

        // Fetch article details early for emails
        const article = await prisma.article.findUnique({
            where: { id: articleId },
            include: { journal: true }
        });

        if (!article) {
            return NextResponse.json({ error: "Article not found" }, { status: 404 });
        }

        // 1. Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
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

            const newReview = await prisma.review.create({
                data: {
                    articleId,
                    reviewerId: existingUser.id,
                    reviewerNumber: nextReviewerNumber,
                    status: 'invited',
                    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days default
                }
            });

            // Ensure they have reviewer role
            if (existingUser.role === 'user' || existingUser.role === 'author') {
                await prisma.user.update({
                    where: { id: existingUser.id },
                    data: { role: 'reviewer' }
                });
            }

            // Send Notification Email (Standard Assignment with Accept/Decline Link)
            await sendReviewerInvitationEmail(
                email,
                name,
                article.title,
                article.abstract,
                article.journal.fullName,
                newReview.id
            );

            return NextResponse.json({ success: true, message: "User existed. Assigned as reviewer and invitation portal link sent." });
        }

        // 2. If User does NOT exist -> Create Account instantly with tempPassword
        if (tempPassword) {
            const passwordHash = await bcrypt.hash(tempPassword, 10);
            const newUser = await prisma.user.create({
                data: {
                    email,
                    name,
                    passwordHash,
                    university: 'Pending',
                    role: 'reviewer',
                    forcePasswordChange: true,
                }
            });

            const nextReviewerNumber = await prisma.review.count({ where: { articleId } }) + 1;

            const newReview = await prisma.review.create({
                data: {
                    articleId,
                    reviewerId: newUser.id,
                    reviewerNumber: nextReviewerNumber,
                    status: 'invited',
                    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
                }
            });

            await sendReviewerTempPasswordEmail(
                email,
                name,
                article.title,
                article.abstract,
                article.journal.fullName,
                tempPassword,
                newReview.id
            );

            return NextResponse.json({ success: true, message: "Reviewer account created and invitation portal link sent with temporary credentials." });
        }

        return NextResponse.json({ error: "A temporary password must be provided for new reviewers." }, { status: 400 });

    } catch (error: any) {
        console.error("Invite Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
