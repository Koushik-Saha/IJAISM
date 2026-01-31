import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api-response";
import { z } from "zod";

const createConferenceSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    startDate: z.string().datetime().or(z.date()), // Accept ISO string or Date object
    endDate: z.string().datetime().or(z.date()),
    venue: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    websiteUrl: z.string().url().optional().or(z.literal("")),
    bannerImageUrl: z.string().url().optional().or(z.literal("")),
    status: z.enum(["upcoming", "ongoing", "completed", "cancelled"]).default("upcoming"),
});

export async function GET(req: NextRequest) {
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

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const skip = (page - 1) * limit;

        const where: any = {
            deletedAt: null // Schema has deletedAt for Conference
        };

        if (search) {
            where.OR = [
                { title: { contains: search, mode: "insensitive" } },
                { city: { contains: search, mode: "insensitive" } },
                { country: { contains: search, mode: "insensitive" } },
            ];
        }

        const [conferences, total] = await Promise.all([
            prisma.conference.findMany({
                where,
                skip,
                take: limit,
                orderBy: { startDate: "desc" },
            }),
            prisma.conference.count({ where }),
        ]);

        return apiSuccess({
            conferences,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        return apiError(error.message, 500);
    }
}

export async function POST(req: NextRequest) {
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

        const body = await req.json();
        const validated = createConferenceSchema.parse(body);

        const conference = await prisma.conference.create({
            data: {
                title: validated.title,
                description: validated.description,
                startDate: new Date(validated.startDate),
                endDate: new Date(validated.endDate),
                venue: validated.venue,
                city: validated.city,
                country: validated.country,
                websiteUrl: validated.websiteUrl || null,
                bannerImageUrl: validated.bannerImageUrl || null,
                status: validated.status,
            },
        });

        return apiSuccess({ conference }, "Conference created successfully", 201);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return apiError("Validation Error", 400, error.issues);
        }
        return apiError(error.message, 500);
    }
}
