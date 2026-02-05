
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api-response";
import { z } from "zod";

const updateConferenceSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    startDate: z.string().datetime().or(z.date()).optional(),
    endDate: z.string().datetime().or(z.date()).optional(),
    venue: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    websiteUrl: z.string().url().optional().or(z.literal("")),
    bannerImageUrl: z.string().url().optional().or(z.literal("")),
    status: z.enum(["upcoming", "ongoing", "completed", "cancelled"]).optional(),
    brochureUrl: z.string().url().optional().or(z.literal("")),
    callForPapersUrl: z.string().url().optional().or(z.literal(""))
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

        const conference = await prisma.conference.findUnique({
            where: { id },
        });

        if (!conference) {
            return apiError("Conference not found", 404);
        }

        return apiSuccess({ conference });

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
        const validated = updateConferenceSchema.parse(body);

        const data: any = { ...validated };
        if (validated.startDate) data.startDate = new Date(validated.startDate);
        if (validated.endDate) data.endDate = new Date(validated.endDate);

        const conference = await prisma.conference.update({
            where: { id },
            data,
        });

        return apiSuccess({ conference }, "Conference updated successfully", 200);
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

        // Soft delete since Conference has deletedAt
        await prisma.conference.update({
            where: { id },
            data: { deletedAt: new Date() },
        });

        return apiSuccess(null, "Conference deleted successfully", 200);
    } catch (error: any) {
        return apiError(error.message, 500);
    }
}
