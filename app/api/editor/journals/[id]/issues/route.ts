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
