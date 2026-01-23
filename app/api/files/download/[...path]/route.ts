
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger';
import path from 'path';
import fs from 'fs';
import { getMembershipStatus } from '@/lib/membership';

// Helper to stream file from local filesystem
function streamFile(filePath: string): ReadableStream {
    const nodeStream = fs.createReadStream(filePath);
    const data = new TransformStream();

    const trigger = async () => {
        const writer = data.writable.getWriter();
        for await (const chunk of nodeStream) {
            await writer.write(chunk);
        }
        await writer.close();
    };

    trigger();
    return data.readable;
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        // 1. Authenticate User
        const authHeader = req.headers.get('authorization');
        // Allow cookie-based auth if needed, but for now stick to Bearer for simplicity 
        // or checks search params if opening in new tab (token often passed in query for file downloads)

        let token = '';

        // Check Authorization header first
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else {
            // Check query param 'token' (common for file links)
            const url = new URL(req.url);
            token = url.searchParams.get('token') || '';
        }

        if (!token) {
            // Build URL for login redirect if accessing directly
            const url = new URL(req.url);
            return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(url.pathname + url.search)}`, req.url));
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        }

        const userId = decoded.userId;
        const resolvedParams = await params;
        const fileSegments = resolvedParams.path;

        if (!fileSegments || fileSegments.length === 0) {
            return NextResponse.json({ error: 'File path not provided' }, { status: 400 });
        }

        // Reconstruct path: /uploads/manuscript/123_name.pdf -> path=['manuscript', '123_name.pdf']
        // Logic handles both local and external if necessary, but focus on tracking first.

        // 2. Check Download Limits
        const membership = await getMembershipStatus(userId);
        const isFreeTier = membership.tier === 'free';

        // Debug: Log Prisma keys to verify model availability
        if (!(prisma as any).downloadLog) {
            logger.warn('Prisma client stale, downloadLog model missing. Keys available:', Object.keys(prisma));
        }

        if (isFreeTier) {
            const yearStart = new Date(new Date().getFullYear(), 0, 1);
            let downloadCount = 0;

            if ((prisma as any).downloadLog) {
                downloadCount = await (prisma as any).downloadLog.count({
                    where: {
                        userId,
                        downloadedAt: { gte: yearStart }
                    }
                });
            } else {
                // Fallback to raw query if client is stale
                try {
                    const result = await prisma.$queryRaw`
                        SELECT COUNT(*)::int as count 
                        FROM "DownloadLog" 
                        WHERE "userId" = ${userId} 
                        AND "downloadedAt" >= ${yearStart}
                     `;
                    downloadCount = (result as any)[0]?.count || 0;
                } catch (rawError) {
                    logger.error('Raw query fallback failed', rawError);
                    // If raw fails, maybe table name is different or something else.
                    // Last resort: assume 0 to unblock user, but log critical error.
                }
            }

            const limit = 50;
            if (downloadCount >= limit) {
                return NextResponse.json({
                    error: 'Free tier download limit exceeded',
                    limit,
                    used: downloadCount,
                    upgradeUrl: '/membership'
                }, { status: 403 });
            }
        }

        // 3. Log Download
        try {
            if ((prisma as any).downloadLog) {
                await (prisma as any).downloadLog.create({
                    data: {
                        userId,
                        resourceId: fileSegments.join('/'),
                        resourceType: 'file',
                    }
                });
            } else {
                // Fallback to raw execute
                const id = crypto.randomUUID();
                await prisma.$executeRaw`
                    INSERT INTO "DownloadLog" ("id", "userId", "resourceId", "resourceType", "downloadedAt")
                    VALUES (${id}, ${userId}, ${fileSegments.join('/')}, 'file', NOW())
                 `;
            }
        } catch (logError) {
            logger.error('Failed to log download', logError);
            // Continue - don't block user for log failure
        }

        // 4. Serve File
        // Check local storage first
        const safePath = path.join(process.cwd(), 'public', 'uploads', ...fileSegments);

        // Verify path prevents traversal
        if (!safePath.startsWith(path.join(process.cwd(), 'public', 'uploads'))) {
            return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
        }

        if (fs.existsSync(safePath)) {
            const fileStream = streamFile(safePath);
            const stats = fs.statSync(safePath);
            const fileName = fileSegments[fileSegments.length - 1]; // last segment

            return new NextResponse(fileStream, {
                headers: {
                    'Content-Length': stats.size.toString(),
                    'Content-Type': 'application/pdf', // Assuming PDF based on request context, could infer from extension
                    'Content-Disposition': `inline; filename="${fileName}"`
                }
            });
        } else {
            // If not found locally, maybe it's an external URL (Blob) that we are proxying?
            // Or un-migrated file. 
            // For 404 fix, we are assuming it SHOULD have been local. 
            // If it was uploaded to Vercel Blob in PROD, this proxy might fail unless we redirect to the blob URL.
            // But we don't know the Blob URL just from the path segments if strictly following /uploads/ structure...
            // Actually, if it's external, the client usually has the full URL.
            // The issue "404" is specifically for the local fallback scenario in dev/soft-launch.

            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

    } catch (error: any) {
        logger.error('Download error', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
