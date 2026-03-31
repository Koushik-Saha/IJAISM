import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filePath = searchParams.get('path');

  if (!filePath) {
    return NextResponse.json({ error: 'No path provided' }, { status: 400 });
  }

  // Only allow files under /uploads/manuscript/ for security
  if (!filePath.startsWith('/uploads/manuscript/') || filePath.includes('..')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const absolutePath = path.join(process.cwd(), 'public', filePath);
    const fileBuffer = await readFile(absolutePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'X-Frame-Options': 'SAMEORIGIN',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return NextResponse.json({ error: 'PDF not found' }, { status: 404 });
  }
}
