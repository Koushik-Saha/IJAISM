import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api-response";
import { z } from "zod";

const createBookSchema = z.object({
    title: z.string().min(1, "Title is required"),
    authors: z.array(z.string()).min(1, "At least one author is required"),
    year: z.number().int().min(1000).max(new Date().getFullYear() + 5),
    isbn: z.string().min(1),
    pages: z.number().int().positive(),
    field: z.string().min(1),
    description: z.string().min(1),
    fullDescription: z.string().min(1),
    price: z.string().min(1),
    publisher: z.string().min(1),
    language: z.string().default("English"),
    edition: z.string().default("1st"),
    format: z.string().default("Paperback"),
    coverImageUrl: z.string().url().optional().or(z.literal("")),
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

        const where: any = {};

        if (search) {
            where.OR = [
                { title: { contains: search, mode: "insensitive" } },
                { isbn: { contains: search, mode: "insensitive" } },
                { publisher: { contains: search, mode: "insensitive" } },
            ];
        }

        const [books, total] = await Promise.all([
            prisma.book.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
            prisma.book.count({ where }),
        ]);

        return apiSuccess({
            books,
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
        const validated = createBookSchema.parse(body);

        const book = await prisma.book.create({
            data: {
                ...validated,
                coverImageUrl: validated.coverImageUrl || null,
            },
        });

        return apiSuccess({ book }, "Book created successfully", 201);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return apiError("Validation Error", 400, error.errors);
        }
        // Handle Unique Constraint (ISBN)
        if (error.code === 'P2002') {
            return apiError("ISBN already exists", 409);
        }
        return apiError(error.message, 500);
    }
}
