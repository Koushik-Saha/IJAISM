import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { put } from '@vercel/blob';
import { logger } from '@/lib/logger';
import { apiSuccess, apiError } from '@/lib/api-response';
import { scanFile } from '@/lib/security/virus';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { cwd } from 'process';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return apiError('Unauthorized - No token provided', 401, undefined, 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return apiError('Unauthorized - Invalid token', 401, undefined, 'INVALID_TOKEN');
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const fileType = formData.get('fileType') as string;

    if (!file) {
      return apiError('No file provided', 400, undefined, 'NO_FILE');
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return apiError('File size exceeds 10MB limit', 400, undefined, 'FILE_TOO_LARGE');
    }

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    if (fileType === 'manuscript' && file.type !== 'application/pdf') {
      return apiError('Manuscripts must be in PDF format', 400, undefined, 'INVALID_FILE_TYPE');
    }

    if (!allowedTypes.includes(file.type)) {
      return apiError('Invalid file type. Only PDF, DOC, and DOCX are allowed', 400, undefined, 'INVALID_FILE_TYPE');
    }

    // Virus Scan
    const scanResult = await scanFile(file);
    if (!scanResult.safe) {
      return apiError(scanResult.reason || 'File failed security check', 400, undefined, 'VIRUS_DETECTED');
    }

    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${fileType}/${timestamp}_${sanitizedName}`;

    try {
      const blob = await put(fileName, file);

      logger.info('File uploaded successfully', {
        fileType,
        fileName: file.name,
        size: file.size,
        blobUrl: blob.url,
        userId: decoded.userId
      });

      return apiSuccess({
        url: blob.url,
        fileName: file.name,
        size: file.size,
        type: file.type,
        blobId: blob.url,
      });
    } catch (blobError: any) {
      if (blobError.message?.includes('BLOB_READ_WRITE_TOKEN') || !process.env.BLOB_READ_WRITE_TOKEN) {
        // PRODUCTION SAFETY:
        if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_MOCK_UPLOAD_IN_PROD) {
          throw new Error('Vercel Blob Token not configured. Upload failed.');
        }

        // Local File Storage Fallback (Development Mode)
        const publicDir = join(cwd(), 'public');
        const uploadDir = join(publicDir, 'uploads', fileType);

        await mkdir(uploadDir, { recursive: true });

        const localFileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const finalPath = join(uploadDir, localFileName);

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        await writeFile(finalPath, buffer);

        const localUrl = `/uploads/${fileType}/${localFileName}`;

        logger.info('File saved locally (Blob not configured)', { fileType, localUrl });

        return apiSuccess({
          url: localUrl,
          fileName: file.name,
          size: file.size,
          type: file.type,
          blobId: 'local-file',
          warning: 'LOCAL MODE: File saved to public/uploads',
        });
      }

      throw blobError;
    }
  } catch (error: any) {
    logger.error('Error uploading file', error, {
      path: '/api/upload'
    });

    // Expose specific configuration errors even in production for debugging
    const isConfigError = error.message?.includes('Token not configured') || error.message?.includes('BLOB_READ_WRITE_TOKEN');
    const errorMessage = isConfigError ? error.message : 'Failed to upload file';

    return apiError(errorMessage, 500, process.env.NODE_ENV === 'development' ? { message: error.message } : undefined);
  }
}
