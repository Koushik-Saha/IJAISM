import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api-response";
import { z } from "zod";

const createDissertationSchema = z.object({
    title: z.string().min(1, "Title is required"),
    abstract: z.string().min(1, "Abstract is required"),
    authorId: z.string().uuid("Invalid Author ID"),
    university: z.string().min(1, "University is required"),
    degreeType: z.string().min(1, "Degree Type is required"),
    year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
    status: z.enum(["pending", "approved", "rejected"]).default("pending"),
    department: z.string().optional(),
    supervisorName: z.string().optional(),
    keywords: z.array(z.string()).default([]),
    pdfUrl: z.string().optional().or(z.literal("")),
    coverImageUrl: z.string().optional().or(z.literal("")),
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
        const type = searchParams.get("type") || "published";
        const skip = (page - 1) * limit;

        if (type === "submissions") {
            const articleWhere: any = {
                articleType: "dissertation",
                deletedAt: null,
            };

            if (search) {
                articleWhere.OR = [
                    { title: { contains: search, mode: "insensitive" } },
                    { author: { name: { contains: search, mode: "insensitive" } } },
                    { author: { email: { contains: search, mode: "insensitive" } } },
                ];
            }

            const [articles, total] = await Promise.all([
                prisma.article.findMany({
                    where: articleWhere,
                    skip,
                    take: limit,
                    orderBy: { createdAt: "desc" },
                    include: {
                        author: {
                            select: { name: true, email: true },
                        },
                    },
                }),
                prisma.article.count({ where: articleWhere }),
            ]);

            return apiSuccess({
                dissertations: articles.map(art => ({
                    id: art.id,
                    title: art.title,
                    status: art.status,
                    createdAt: art.createdAt,
                    author: art.author,
                    pdfUrl: art.pdfUrl,
                    isSubmission: true
                })),
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            });
        }

        const where: any = {
            deletedAt: null,
        };

        if (search) {
            where.OR = [
                { title: { contains: search, mode: "insensitive" } },
                { university: { contains: search, mode: "insensitive" } },
                { authorName: { contains: search, mode: "insensitive" } }
            ];
        }

        const [dissertations, total] = await Promise.all([
            prisma.dissertation.findMany({
                where,
                skip,
                take: limit,
                include: {
                    author: {
                        select: { name: true, email: true }
                    }
                },
                orderBy: { createdAt: "desc" },
            }),
            prisma.dissertation.count({ where }),
        ]);

        return apiSuccess({
            dissertations,
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
        const validated = createDissertationSchema.parse(body);

        const dissertation = await prisma.dissertation.create({
            data: {
                title: validated.title,
                abstract: validated.abstract,
                authorId: validated.authorId,
                university: validated.university,
                degreeType: validated.degreeType,
                // Map year to submissionDate
                submissionDate: new Date(validated.year, 0, 1),
                department: validated.department,
                supervisorName: validated.supervisorName,
                keywords: validated.keywords,
                pdfUrl: validated.pdfUrl || null,
                coverImageUrl: validated.coverImageUrl || null,
                status: validated.status,
            },
        });

        return apiSuccess({ dissertation }, "Dissertation created successfully", 201);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return apiError("Validation Error", 400, error.issues);
        }
        return apiError(error.message, 500);
    }
}
