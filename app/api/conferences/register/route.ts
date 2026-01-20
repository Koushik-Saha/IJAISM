import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { conferenceId, name, email, organization, type, attendance } = body;

        if (!conferenceId || !name || !email) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Try to find user by email
        let user = await prisma.user.findUnique({
            where: { email },
        });

        // If user doesn't exist, we can't register them because of database constraints (userId required)
        // We could auto-create, but that requires password handling.
        // For now, return error if not found.
        if (!user) {
            return NextResponse.json(
                { error: 'No account found with this email. Please register for an account first.' },
                { status: 400 }
            );
        }

        // Check if already registered
        const existingRegistration = await prisma.conferenceRegistration.findFirst({
            where: {
                conferenceId,
                userId: user.id
            }
        });

        if (existingRegistration) {
            return NextResponse.json({
                success: true,
                message: 'You are already registered for this conference.',
                registration: existingRegistration
            });
        }

        // Create registration
        const registration = await prisma.conferenceRegistration.create({
            data: {
                conferenceId,
                userId: user.id,
                registrationType: type || 'standard',
                // attendance isn't in schema, ignored
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Registration successful!',
            registration
        });

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Failed to process registration' }, { status: 500 });
    }
}
