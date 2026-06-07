import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function PATCH(
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

    // 2. Fetch user role
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3. Find article
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: { id: true }
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // 4. Access control: Must be assigned editor OR admin
    const isAdmin = ["super_admin", "mother_admin"].includes(user.role);
    const assignment = await prisma.articleEditor.findUnique({
      where: {
        articleId_userId: {
          articleId,
          userId: decoded.userId
        }
      }
    });

    if (!assignment && !isAdmin) {
      return NextResponse.json(
        { error: "Forbidden - You must be an assigned editor to comment on this paper" },
        { status: 403 }
      );
    }

    // 5. Parse body
    const body = await req.json();
    const { comments } = body;

    // 6. Upsert comment in ArticleEditor
    const updatedAssignment = await prisma.articleEditor.upsert({
      where: {
        articleId_userId: {
          articleId,
          userId: decoded.userId
        }
      },
      update: {
        comments
      },
      create: {
        articleId,
        userId: decoded.userId,
        comments
      }
    });

    return NextResponse.json({
      success: true,
      message: "Comment updated successfully",
      data: updatedAssignment
    });

  } catch (error: any) {
    console.error("Error updating editor comment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
