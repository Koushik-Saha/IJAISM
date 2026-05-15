import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, BUCKET_NAME } from "@/lib/s3";
import { logger } from "@/lib/logger";
import { readFile } from "fs/promises";
import { join } from "path";
import { cwd } from "process";

// Pre-signed URL expires in 1 hour; tell the browser/CDN to cache the redirect for 55 min.
const PRESIGN_TTL = 3600;
const CDN_CACHE_TTL = 3300;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const key = path.join("/");

    if (!key) {
      return NextResponse.json({ error: "Missing file path" }, { status: 400 });
    }

    // Generate a pre-signed URL and redirect — S3 serves the bytes directly.
    // This eliminates streaming through the Vercel Function entirely.
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      const presignedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: PRESIGN_TTL,
      });

      return NextResponse.redirect(presignedUrl, {
        status: 302,
        headers: {
          "Cache-Control": `public, max-age=${CDN_CACHE_TTL}`,
        },
      });
    } catch (s3Error: any) {
      if (s3Error.name === "NoSuchKey") {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }

      logger.warn("S3 presign failed, falling back to local storage", {
        error: s3Error.message,
        key,
      });

      // Fallback: serve from local public/uploads
      const localPath = join(cwd(), "public", "uploads", key);
      const fileBuffer = await readFile(localPath);
      const ext = key.split(".").pop()?.toLowerCase() || "";
      const mimeMap: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        webp: "image/webp",
        gif: "image/gif",
        pdf: "application/pdf",
      };

      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": mimeMap[ext] || "application/octet-stream",
          "Content-Length": fileBuffer.length.toString(),
          "Cache-Control": "public, max-age=3600",
        },
      });
    }
  } catch (error: any) {
    logger.error("Error serving media file", {
      error: error.message,
      path: req.nextUrl.pathname,
    });
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
