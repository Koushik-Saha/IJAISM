import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api-response";
import { z } from "zod";

const updateDissertationSchema = z.object({
    title: z.string().min(1).optional(),
    abstract: z.string().min(1).optional(),
    authorId: z.string().uuid().optional(),
    university: z.string().min(1).optional(),
    degreeType: z.string().min(1).optional(),
    year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
    status: z.enum(["pending", "approved", "rejected"]).optional(),
    department: z.string().optional(),
    supervisorName: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    pdfUrl: z.string().url().optional().or(z.literal("")),
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

        const dissertation = await prisma.dissertation.findUnique({
            where: { id },
            include: { author: { select: { name: true, email: true } } }
        });

        if (!dissertation) {
            return apiError("Dissertation not found", 404);
        }

        return apiSuccess({ dissertation });

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
        const validated = updateDissertationSchema.parse(body);

        const data: any = { ...validated };
        if (validated.year) {
            data.submissionDate = new Date(validated.year, 0, 1);
            delete data.year;
        }

        const dissertation = await prisma.dissertation.update({
            where: { id },
            data,
        });

        return apiSuccess({ dissertation }, "Dissertation updated successfully", 200);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return apiError("Validation Error", 400, error.errors);
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

        // Soft delete
        await prisma.dissertation.update({
            where: { id },
            data: { deletedAt: new Date() },
        });

        return apiSuccess(null, "Dissertation deleted successfully", 200);
    } catch (error: any) {
        return apiError(error.message, 500);
    }
}
