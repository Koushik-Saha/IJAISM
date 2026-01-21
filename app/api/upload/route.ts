import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { put } from '@vercel/blob';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    // 1. Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // 2. Get form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const fileType = formData.get('fileType') as string; // 'manuscript' or 'coverLetter'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // 3. Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB Limit (Task 27)
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    // Strict PDF check for manuscripts (Task 27)
    if (fileType === 'manuscript' && file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Manuscripts must be in PDF format' },
        { status: 400 }
      );
    }

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, DOC, and DOCX are allowed' },
        { status: 400 }
      );
    }

    // 4. Upload to Vercel Blob
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${fileType}/${timestamp}_${sanitizedName}`;

    try {
      // Upload to Vercel Blob - File extends Blob so we can pass it directly
      const blob = await put(fileName, file);

      logger.info('File uploaded successfully', {
        fileType,
        fileName: file.name,
        size: file.size,
        blobUrl: blob.url,
        userId: decoded.userId
      });

      return NextResponse.json({
        success: true,
        url: blob.url,
        fileName: file.name,
        size: file.size,
        type: file.type,
        blobId: blob.url,
      });
    } catch (blobError: any) {
      // If Vercel Blob is not configured, fall back to placeholder
      if (blobError.message?.includes('BLOB_READ_WRITE_TOKEN') || !process.env.BLOB_READ_WRITE_TOKEN) {
        logger.warn('Vercel Blob not configured. Using placeholder URL.', {
          fileType,
          userId: decoded.userId
        });

        const placeholderUrl = `/uploads/${fileType}/${timestamp}_${sanitizedName}`;

        return NextResponse.json({
          success: true,
          url: placeholderUrl,
          fileName: file.name,
          size: file.size,
          type: file.type,
          warning: 'File storage not configured. Set BLOB_READ_WRITE_TOKEN to enable actual file storage.',
        });
      }

      throw blobError;
    }
  } catch (error: any) {
    logger.error('Error uploading file', error, {
      path: '/api/upload'
    });

    return NextResponse.json(
      {
        error: 'Failed to upload file',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
