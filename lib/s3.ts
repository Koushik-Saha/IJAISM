import { S3Client } from "@aws-sdk/client-s3";

const globalForS3 = globalThis as unknown as { s3Client?: S3Client };

if (!globalForS3.s3Client) {
  globalForS3.s3Client = new S3Client({
    region: process.env.AWS_REGION || "us-east-2",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
  });
}

export const s3Client = globalForS3.s3Client;
export const BUCKET_NAME =
  process.env.AWS_S3_BUCKET_NAME || "koushik-freedomshippingllc-reports";
