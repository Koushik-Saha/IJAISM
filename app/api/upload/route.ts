import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { put } from '@vercel/blob';
import { logger } from '@/lib/logger';
import { apiSuccess, apiError } from '@/lib/api-response';

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

        const fs = require('fs');
        const path = require('path');
        const { writeFile, mkdir } = require('fs/promises');

        const uploadDir = path.join(process.cwd(), 'public', 'uploads', fileType);
        await mkdir(uploadDir, { recursive: true });

        const buffer = Buffer.from(await file.arrayBuffer());
        const filePath = path.join(uploadDir, `${timestamp}_${sanitizedName}`);
        await writeFile(filePath, buffer);

        const fileUrl = `/uploads/${fileType}/${timestamp}_${sanitizedName}`;

        logger.info('File saved locally (Blob not configured)', {
          fileType,
          fileName,
          userId: decoded.userId
        });

        return apiSuccess({
          url: fileUrl,
          fileName: file.name,
          size: file.size,
          type: file.type,
          blobId: fileUrl,
          warning: 'Using local storage. Blob storage not configured.',
        });
      }

      throw blobError;
    }
  } catch (error: any) {
    logger.error('Error uploading file', error, {
      path: '/api/upload'
    });

    return apiError('Failed to upload file', 500, process.env.NODE_ENV === 'development' ? { message: error.message } : undefined);
  }
}
