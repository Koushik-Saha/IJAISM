
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api-response";
import { z } from "zod";

const updateBookSchema = z.object({
    title: z.string().min(1).optional(),
    authors: z.array(z.string()).min(1).optional(),
    year: z.number().int().min(1000).max(new Date().getFullYear() + 5).optional(),
    isbn: z.string().min(1).optional(),
    pages: z.number().int().positive().optional(),
    field: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    fullDescription: z.string().min(1).optional(),
    price: z.string().min(1).optional(),
    publisher: z.string().min(1).optional(),
    language: z.string().optional(),
    edition: z.string().optional(),
    format: z.string().optional(),
    coverImageUrl: z.string().url().optional().or(z.literal("")),
});

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return apiError("Unauthorized", 401);
        }
        const token = authHeader.split(" ")[1];
        const auth = verifyToken(token);

        if (!auth || !["super_admin", "mother_admin"].includes(auth.role)) {
            return apiError("Forbidden: Insufficient permissions", 403);
        }

        const { id } = await params;

        const book = await prisma.book.findUnique({
            where: { id },
        });

        if (!book) {
            return apiError("Book not found", 404);
        }

        return apiSuccess({ book });

    } catch (error: any) {
        return apiError(error.message, 500);
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return apiError("Unauthorized", 401);
        }
        const token = authHeader.split(" ")[1];
        const auth = verifyToken(token);

        if (!auth || !["super_admin", "mother_admin"].includes(auth.role)) {
            return apiError("Forbidden: Insufficient permissions", 403);
        }

        const { id } = await params;
        const body = await req.json();
        const validated = updateBookSchema.parse(body);

        const book = await prisma.book.update({
            where: { id },
            data: validated,
        });

        return apiSuccess({ book }, "Book updated successfully", 200);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return apiError("Validation Error", 400, error.issues);
        }
        return apiError(error.message, 500);
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return apiError("Unauthorized", 401);
        }
        const token = authHeader.split(" ")[1];
        const auth = verifyToken(token);

        if (!auth || !["super_admin", "mother_admin"].includes(auth.role)) {
            return apiError("Forbidden: Insufficient permissions", 403);
        }

        const { id } = await params;

        // Hard Delete
        await prisma.book.delete({
            where: { id },
        });

        return apiSuccess(null, "Book deleted successfully", 200);
    } catch (error: any) {
        return apiError(error.message, 500);
    }
}
