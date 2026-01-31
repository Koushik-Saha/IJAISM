
import { NextRequest, NextResponse } from 'next/server';
import { verifyFileToken } from '@/lib/security/url-signer';
import { logger } from '@/lib/logger';
import fs from 'fs';
import path from 'path';
import mime from 'mime';

export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get('token');

    if (!token) {
        return NextResponse.json({ error: 'Access Denied: No token provided' }, { status: 403 });
    }

    const filePath = verifyFileToken(token);

    if (!filePath) {
        return NextResponse.json({ error: 'Access Denied: Invalid or expired token' }, { status: 403 });
    }

    try {
        // Handle Remote URL (Vercel Blob / S3)
        if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
            const response = await fetch(filePath);

            if (!response.ok) {
                logger.error('Failed to fetch file from source', { filePath, status: response.status });
                return NextResponse.json({ error: 'File not found' }, { status: 404 });
            }

            const data = await response.arrayBuffer();
            const contentType = response.headers.get('content-type') || 'application/octet-stream';
            // Extract filename from URL pathname to avoid query params
            const fileName = path.basename(new URL(filePath).pathname) || 'document';
            const contentDisposition = `inline; filename="${fileName}"`;

            return new NextResponse(data, {
                headers: {
                    'Content-Type': contentType,
                    'Content-Disposition': contentDisposition,
                    'Cache-Control': 'private, max-age=3600'
                }
            });
        }

        // Handle Local File System
        else {
            // Normalize path: strip leading slash to let path.join append correctly
            const relativePath = filePath.startsWith('/') ? filePath.slice(1) : filePath;

            // Define potential locations for the file
            const pathsToCheck = [
                path.join(process.cwd(), 'public', relativePath), // Primary: public/uploads/...
                path.join(process.cwd(), relativePath),           // Fallback: root/uploads/...
            ];

            // Use the first path that exists
            const absolutePath = pathsToCheck.find(p => fs.existsSync(p));

            if (!absolutePath) {
                logger.error('Local file not found', {
                    attemptedPaths: pathsToCheck,
                    originalPath: filePath
                });
                return NextResponse.json({ error: 'File not found on server' }, { status: 404 });
            }

            const fileBuffer = fs.readFileSync(absolutePath);
            const contentType = mime.getType(absolutePath) || 'application/octet-stream';
            const fileName = path.basename(absolutePath);
            const contentDisposition = `inline; filename="${fileName}"`;

            return new NextResponse(fileBuffer, {
                headers: {
                    'Content-Type': contentType,
                    'Content-Disposition': contentDisposition,
                    'Cache-Control': 'private, max-age=3600'
                }
            });
        }

    } catch (error: any) {
        logger.error('Proxy error', error);
        return NextResponse.json({ error: 'Failed to retrieve file' }, { status: 500 });
    }
}
