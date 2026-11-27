import { S3Client } from "@aws-sdk/client-s3";

const globalForS3 = globalThis as unknown as { s3Client?: S3Client };

// The SDK talks to any S3-compatible endpoint. We use Cloudflare R2 in
// production (region: 'auto', custom endpoint). Setting AWS_S3_ENDPOINT to an
// empty value falls back to AWS S3 with the default region.
const endpoint = process.env.AWS_S3_ENDPOINT || undefined;

if (!globalForS3.s3Client) {
  globalForS3.s3Client = new S3Client({
    region: process.env.AWS_REGION || "auto",
    endpoint,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
    // R2 ignores path-style vs virtual-hosted-style; AWS S3 requires
    // virtual-hosted-style for new buckets. forcePathStyle=true is the
    // safer default with custom endpoints.
    forcePathStyle: Boolean(endpoint),
  });
}

export const s3Client = globalForS3.s3Client;
export const BUCKET_NAME =
  process.env.AWS_S3_BUCKET_NAME || "ijaism-uploads";
