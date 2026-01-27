import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // journalId
) {
    try {
        const { id: journalId } = await params;

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

        const issues = await prisma.journalIssue.findMany({
            where: { journalId },
            orderBy: [
                { year: 'desc' },
                { volume: 'desc' },
                { issue: 'desc' }
            ],
            select: {
                id: true,
                title: true,
                volume: true,
                issue: true,
                year: true,
                isCurrent: true,
                isSpecial: true
            }
        });

        return NextResponse.json({ issues });
    } catch (error) {
        console.error("Error fetching issues:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: journalId } = await params;

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
        const { volume, issue, year, title, isSpecial, isCurrent, coverUrl } = body;

        // Validation
        if (!volume || !issue || !year) {
            return NextResponse.json({ error: "Volume, Issue and Year are required" }, { status: 400 });
        }

        // Check if issue exists
        const existing = await prisma.journalIssue.findFirst({
            where: {
                journalId,
                volume: parseInt(volume),
                issue: parseInt(issue)
            }
        });

        if (existing) {
            return NextResponse.json({ error: "Issue already exists for this volume/issue number" }, { status: 400 });
        }

        const newIssue = await prisma.journalIssue.create({
            data: {
                journalId,
                volume: parseInt(volume),
                issue: parseInt(issue),
                year: parseInt(year),
                title,
                isSpecial: isSpecial || false,
                isCurrent: isCurrent || false,
                coverUrl
            }
        });

        return NextResponse.json({ success: true, issue: newIssue });

    } catch (error: any) {
        console.error("Error creating issue:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
