
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string; issueId: string }> }
) {
    try {
        const { id: journalId, issueId } = await params;

        // Auth
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const decoded = verifyToken(authHeader.split(' ')[1]);
        if (!decoded || !['editor', 'super_admin'].includes(decoded.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { volume, issue, year, title, isSpecial, isCurrent, coverUrl } = body;

        const updatedIssue = await prisma.journalIssue.update({
            where: { id: issueId },
            data: {
                volume: volume ? parseInt(volume) : undefined,
                issue: issue ? parseInt(issue) : undefined,
                year: year ? parseInt(year) : undefined,
                title,
                isSpecial,
                isCurrent,
                coverUrl
            }
        });

        // Loophole: If isCurrent is true, we might want to unset others?
        // But for simplicity, we let multiple curr exist or handle it in specific logic if needed. 
        // Typically only one current issue.
        if (isCurrent) {
            await prisma.journalIssue.updateMany({
                where: {
                    journalId,
                    id: { not: issueId }
                },
                data: { isCurrent: false }
            });
        }

        return NextResponse.json({ success: true, issue: updatedIssue });

    } catch (error: any) {
        console.error("Error updating issue:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string; issueId: string }> }
) {
    try {
        const { issueId } = await params;

        // Auth
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const decoded = verifyToken(authHeader.split(' ')[1]);
        if (!decoded || !['editor', 'super_admin'].includes(decoded.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await prisma.journalIssue.delete({
            where: { id: issueId }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Error deleting issue:", error);
        // Prisma error P2003 (Foreign Key Constraint) likely if articles refer to it.
        // Assuming articles link to Issue via Int fields (volume/issue) not Foreign Key in current schema?
        // Checked Schema: Article has `volume`, `issue` as Int. No direct relation to `JournalIssue` model.
        // So deletion is safe but `Article` data might point to non-existent issue logical entity.
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
