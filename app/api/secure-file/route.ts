
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
            const urlObj = new URL(filePath);
            
            // SECURITY: SSRF Protection - Only allow trusted domains
            const allowedDomains = [
                's3.amazonaws.com',
                '.s3.', // Matches region-specific buckets like bucket.s3.us-east-1.amazonaws.com
                'public.blob.vercel-storage.com',
                'c5k.com'
            ];

            const isAllowed = allowedDomains.some(domain => 
                urlObj.hostname.endsWith(domain.startsWith('.') ? domain : `.${domain}`) || 
                urlObj.hostname === domain
            );

            if (!isAllowed) {
                logger.warn('SSRF Attempt blocked: Unauthorized remote file domain', { filePath });
                return NextResponse.json({ error: 'Access Denied: Unauthorized file source' }, { status: 403 });
            }

            // Generate S3 Pre-signed URL directly to solve AccessDenied for private buckets
            if (filePath.includes('.s3.') && filePath.includes('amazonaws.com')) {
                const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');
                const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

                const urlObj = new URL(filePath);
                const bucketMatch = urlObj.host.match(/^(.*?)\.s3/);
                const bucketName = bucketMatch ? bucketMatch[1] : (process.env.AWS_S3_BUCKET_NAME || 'koushik-freedomshippingllc-reports');
                const key = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;

                const s3Client = new S3Client({
                    region: process.env.AWS_REGION || 'us-east-2',
                    credentials: {
                        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
                        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
                    },
                });

                const command = new GetObjectCommand({
                    Bucket: bucketName,
                    Key: decodeURIComponent(key),
                    ResponseContentDisposition: `inline; filename="${path.basename(key)}"`,
                });

                const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
                return NextResponse.redirect(presignedUrl);
            }

            // Fallback for non-S3 external URLs
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
