import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: articleId } = await params;

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized - Invalid token" }, { status: 401 });
    }

    if (!["super_admin", "mother_admin"].includes(decoded.role)) {
      return NextResponse.json(
        { error: "Forbidden - Only Super Admin or Mother Admin can edit articles" },
        { status: 403 }
      );
    }

    const existingArticle = await prisma.article.findUnique({
      where: { id: articleId },
      select: { id: true, doi: true, title: true, status: true },
    });

    if (!existingArticle) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    if (decoded.role === "super_admin" && existingArticle.doi) {
      return NextResponse.json(
        { error: "Article is locked – a DOI has been assigned. Only Mother Admin can edit at this stage." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      abstract,
      keywords,
      articleType,
      journalId,
      volume,
      issue,
      pageStart,
      pageEnd,
      status,
      language,
      isOpenAccess,
      isBestPaper,
      pdfUrl,
      submissionDate,
      acceptanceDate,
      publicationDate,
      coAuthors,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!abstract || !abstract.trim()) {
      return NextResponse.json({ error: "Abstract is required" }, { status: 400 });
    }
    if (!journalId) {
      return NextResponse.json({ error: "Journal selection is required" }, { status: 400 });
    }

    const parseDate = (val: string | null | undefined): Date | null => {
      if (!val) return null;
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    };

    const parseIntOrNull = (val: any): number | null => {
      if (val === "" || val === null || val === undefined) return null;
      const n = parseInt(String(val));
      return isNaN(n) ? null : n;
    };

    // Update article core fields
    const updatedArticle = await prisma.article.update({
      where: { id: articleId },
      data: {
        title: title.trim(),
        abstract: abstract.trim(),
        keywords: Array.isArray(keywords) ? keywords.map((k: string) => k.trim()).filter(Boolean) : [],
        articleType: articleType || "Research Article",
        journalId,
        volume: parseIntOrNull(volume),
        issue: parseIntOrNull(issue),
        pageStart: parseIntOrNull(pageStart),
        pageEnd: parseIntOrNull(pageEnd),
        status: status || "submitted",
        language: language || "en",
        isOpenAccess: isOpenAccess !== undefined ? !!isOpenAccess : true,
        isBestPaper: isBestPaper !== undefined ? !!isBestPaper : false,
        pdfUrl: pdfUrl?.trim() || null,
        submissionDate: parseDate(submissionDate),
        acceptanceDate: parseDate(acceptanceDate),
        publicationDate: parseDate(publicationDate),
        activityLogs: {
          create: {
            userId: decoded.userId,
            action: "ARTICLE_METADATA_UPDATED",
            details: `Article metadata updated by ${decoded.role}`,
          },
        },
      },
    });

    // Reconcile co-authors if provided
    if (Array.isArray(coAuthors)) {
      // Delete existing co-authors
      await prisma.coAuthor.deleteMany({ where: { articleId } });

      // Recreate from provided list (skip empty-name entries)
      const validAuthors = coAuthors.filter(
        (a: any) => a.name && String(a.name).trim().length > 0
      );

      if (validAuthors.length > 0) {
        await prisma.coAuthor.createMany({
          data: validAuthors.map((a: any, idx: number) => ({
            articleId,
            name: String(a.name).trim(),
            email: a.email ? String(a.email).trim() : null,
            university: a.university ? String(a.university).trim() : null,
            isMain: !!a.isMain,
            isCorresponding: !!a.isCorresponding,
            order: a.order ?? idx,
          })),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Article updated successfully",
      article: updatedArticle,
    });
  } catch (error: any) {
    console.error("Error updating article metadata:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update article metadata" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: articleId } = await params;

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized - Invalid token" }, { status: 401 });
    }

    if (decoded.role !== "mother_admin") {
      return NextResponse.json(
        { error: "Forbidden - Only Mother Admin can delete articles" },
        { status: 403 }
      );
    }

    const existingArticle = await prisma.article.findUnique({
      where: { id: articleId, deletedAt: null },
    });

    if (!existingArticle) {
      return NextResponse.json({ error: "Article not found or already deleted" }, { status: 404 });
    }

    // Soft delete article
    await prisma.article.update({
      where: { id: articleId },
      data: {
        deletedAt: new Date(),
        activityLogs: {
          create: {
            userId: decoded.userId,
            action: "ARTICLE_DELETED",
            details: `Article soft-deleted by Mother Admin`,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Article deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting article:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete article" },
      { status: 500 }
    );
  }
}
