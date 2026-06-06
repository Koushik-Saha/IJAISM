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

    // 3. Verify access control: super_admin, mother_admin or editor_in_chief assigned to this paper
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
        // Must also be assigned to the paper
        const articleEditor = await prisma.articleEditor.findFirst({
          where: {
            articleId,
            userId: decoded.userId
          }
        });
        if (articleEditor) {
          isAuthorized = true;
        }
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
      select: { userId: true }
    });

    const validUserIds = journalEditors.map(je => je.userId);
    const invalidUserIds = userIds.filter(id => !validUserIds.includes(id));

    if (invalidUserIds.length > 0) {
      return NextResponse.json(
        { error: `Users ${invalidUserIds.join(", ")} are not editors of this journal` },
        { status: 400 }
      );
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
