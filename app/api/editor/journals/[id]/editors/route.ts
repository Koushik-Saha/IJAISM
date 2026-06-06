import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// GET: Fetch all editors for a journal
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: journalId } = await params;

    // Verify authentication and access
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized - Invalid token" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true }
    });
    if (!user || !["super_admin", "mother_admin", "editor"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const journal = await prisma.journal.findUnique({
      where: { id: journalId }
    });
    if (!journal) {
      return NextResponse.json({ error: "Journal not found" }, { status: 404 });
    }

    const editors = await prisma.journalEditor.findMany({
      where: { journalId },
      include: {
        user: {
          select: { id: true, name: true, email: true, university: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, editors });
  } catch (error: any) {
    console.error("Error fetching journal editors:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Add or update an editor's role on the journal
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: journalId } = await params;

    // Verify admin access
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded || !["super_admin", "mother_admin"].includes(decoded.role)) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: "User ID and Role are required" }, { status: 400 });
    }

    if (!["editor_in_chief", "assistant_editor", "editorial_board_member"].includes(role)) {
      return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
    }

    const journal = await prisma.journal.findUnique({
      where: { id: journalId }
    });
    if (!journal) {
      return NextResponse.json({ error: "Journal not found" }, { status: 404 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true }
    });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Upsert the editor assignment
    const journalEditor = await prisma.journalEditor.upsert({
      where: {
        journalId_userId: { journalId, userId }
      },
      update: { role },
      create: { journalId, userId, role }
    });

    // If EIC, optionally sync to legacy editorId field for backward compatibility
    if (role === "editor_in_chief") {
      await prisma.journal.update({
        where: { id: journalId },
        data: { editorId: userId }
      });
    }

    return NextResponse.json({
      success: true,
      message: "Journal editor assigned successfully",
      data: journalEditor
    });
  } catch (error: any) {
    console.error("Error assigning journal editor:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE: Remove an editor from the journal
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: journalId } = await params;

    // Verify admin access
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded || !["super_admin", "mother_admin"].includes(decoded.role)) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Delete the editor assignment
    await prisma.journalEditor.deleteMany({
      where: { journalId, userId }
    });

    // If deleting EIC, clear legacy editorId field
    const journal = await prisma.journal.findUnique({
      where: { id: journalId },
      select: { editorId: true }
    });
    if (journal && journal.editorId === userId) {
      await prisma.journal.update({
        where: { id: journalId },
        data: { editorId: null }
      });
    }

    return NextResponse.json({
      success: true,
      message: "Journal editor removed successfully"
    });
  } catch (error: any) {
    console.error("Error removing journal editor:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
