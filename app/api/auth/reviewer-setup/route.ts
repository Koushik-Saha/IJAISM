import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, generateToken } from '@/lib/auth';
import { z } from 'zod';
import rateLimit from '@/lib/rate-limit';
import { apiSuccess, apiError } from '@/lib/api-response';
import bcrypt from 'bcryptjs';

const limiter = rateLimit({
    interval: 60 * 1000,
    uniqueTokenPerInterval: 500,
});

const reviewerSetupSchema = z.object({
    email: z.string().email('Invalid email address'),
    tempPassword: z.string().min(1, 'Temporary password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get('x-forwarded-for') || 'anonymous';
        try {
            await limiter.check(NextResponse.next(), 50, ip);
        } catch {
            return apiError('Too many requests. Please try again later.', 429, undefined, 'RATE_LIMIT_EXCEEDED');
        }

        const body = await req.json();

        const validation = reviewerSetupSchema.safeParse(body);
        if (!validation.success) {
            return apiError(
                'Validation failed',
                400,
                validation.error.flatten().fieldErrors,
                'VALIDATION_ERROR'
            );
        }

        const { email, tempPassword, newPassword } = validation.data;

        // 1. Fetch User
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                passwordHash: true,
                name: true,
                university: true,
                role: true,
                isActive: true,
                forcePasswordChange: true,
            },
        });

        if (!user) {
            return apiError('Invalid email or temporary password', 401, undefined, 'INVALID_CREDENTIALS');
        }

        if (!user.isActive) {
            return apiError('Your account has been deactivated', 403, undefined, 'ACCOUNT_DEACTIVATED');
        }

        if (!user.forcePasswordChange) {
            return apiError('This account does not require setup. Please use the standard login page.', 400, undefined, 'SETUP_NOT_REQUIRED');
        }

        // 2. Validate Temporary Password
        const isTempPasswordValid = await comparePassword(tempPassword, user.passwordHash);

        if (!isTempPasswordValid) {
            return apiError('Invalid temporary password', 401, undefined, 'INVALID_CREDENTIALS');
        }

        // 3. Hash New Password
        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        // 4. Update User Profile (Crucially: isEmailVerified = true)
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash: newPasswordHash,
                forcePasswordChange: false,
                isEmailVerified: true,
                lastLoginAt: new Date()
            },
        });

        // 5. Issue Standard JWT
        const accessToken = generateToken({
            userId: updatedUser.id,
            email: updatedUser.email,
            role: updatedUser.role,
            forcePasswordChange: updatedUser.forcePasswordChange,
        });

        return apiSuccess(
            {
                user: {
                    id: updatedUser.id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    university: updatedUser.university,
                    role: updatedUser.role,
                    isEmailVerified: updatedUser.isEmailVerified,
                },
                accessToken,
            },
            'Setup complete. You are now logged in.'
        );
    } catch (error) {
        console.error('Reviewer Setup Error:', error);
        return apiError('An error occurred during account setup.', 500);
    }
}
