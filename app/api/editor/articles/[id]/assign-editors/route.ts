import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: articleId } = await params;

    // 1. Verify authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized - Invalid token" }, { status: 401 });
    }

    // 2. Fetch the user and article
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: { id: true, journalId: true }
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // 3. Verify access control: super_admin, mother_admin or editor_in_chief of this journal
    const isAdmin = ["super_admin", "mother_admin"].includes(user.role);
    let isAuthorized = isAdmin;

    if (!isAuthorized) {
      // Check if EIC for the journal
      const journalEditor = await prisma.journalEditor.findFirst({
        where: {
          journalId: article.journalId,
          userId: decoded.userId,
          role: "editor_in_chief"
        }
      });

      if (journalEditor) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Forbidden - You do not have permission to assign editors to this paper" },
        { status: 403 }
      );
    }

    // 4. Parse request body
    const body = await req.json();
    const { userIds } = body;

    if (!Array.isArray(userIds)) {
      return NextResponse.json({ error: "userIds must be an array" }, { status: 400 });
    }

    // Validate that all assigned users exist in JournalEditor for this journal
    const journalEditors = await prisma.journalEditor.findMany({
      where: {
        journalId: article.journalId,
        userId: { in: userIds }
      },
      select: { userId: true, role: true }
    });

    const validUserIds = journalEditors.map(je => je.userId);
    const invalidUserIds = userIds.filter(id => !validUserIds.includes(id));

    if (invalidUserIds.length > 0) {
      // Validate that these invalidUserIds are valid system users with editor roles
      const systemEditors = await prisma.user.findMany({
        where: {
          id: { in: invalidUserIds },
          role: { in: ["editor", "sub_editor", "super_admin", "mother_admin"] },
          deletedAt: null
        },
        select: { id: true }
      });

      const validSystemEditorIds = systemEditors.map(u => u.id);
      const invalidSystemEditorIds = invalidUserIds.filter(id => !validSystemEditorIds.includes(id));

      if (invalidSystemEditorIds.length > 0) {
        return NextResponse.json(
          { error: `Users ${invalidSystemEditorIds.join(", ")} are not valid editors in the system` },
          { status: 400 }
        );
      }

      // Automatically assign them to the journal as editorial_board_member
      await prisma.journalEditor.createMany({
        data: validSystemEditorIds.map(userId => ({
          journalId: article.journalId,
          userId,
          role: "editorial_board_member"
        })),
        skipDuplicates: true
      });
    }

    // If not super/mother admin, EIC cannot assign another EIC or anyone with other roles
    if (!isAdmin) {
      const invalidRoles = journalEditors.filter(je => je.role !== "assistant_editor" && je.role !== "editorial_board_member");
      if (invalidRoles.length > 0) {
        return NextResponse.json(
          { error: "Forbidden - As Editorial Chief, you can only assign Assistant Editors or Editorial Board Members under your journal." },
          { status: 403 }
        );
      }
    }

    // 5. Update assignments
    // Fetch current ArticleEditors comments so we don't lose them
    const currentAssignments = await prisma.articleEditor.findMany({
      where: { articleId }
    });

    const commentsMap = new Map<string, string>();
    for (const assignment of currentAssignments) {
      if (assignment.comments) {
        commentsMap.set(assignment.userId, assignment.comments);
      }
    }

    await prisma.$transaction([
      prisma.articleEditor.deleteMany({
        where: { articleId }
      }),
      prisma.articleEditor.createMany({
        data: userIds.map(userId => ({
          articleId,
          userId,
          comments: commentsMap.get(userId) || null
        }))
      })
    ]);

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: decoded.userId,
        articleId,
        action: "ARTICLE_EDITORS_ASSIGNED",
        details: `Assigned editors: ${userIds.join(", ")}`
      }
    });

    return NextResponse.json({
      success: true,
      message: "Editors assigned successfully"
    });
  } catch (error: any) {
    console.error("Error assigning paper editors:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
