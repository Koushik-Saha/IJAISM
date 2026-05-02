require('dotenv').config();
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'koushik-freedomshippingllc-reports';

const images = [
  { code: 'aesi', file: '/Users/koushiksaha/.gemini/antigravity/brain/d071e746-551e-4b34-aa78-d5caf6c6c9f3/media__1777751151623.png' },
  { code: 'amlid', file: '/Users/koushiksaha/.gemini/antigravity/brain/d071e746-551e-4b34-aa78-d5caf6c6c9f3/media__1777751239198.png' },
  { code: 'demographic-research-and-social-development-reviews', file: '/Users/koushiksaha/.gemini/antigravity/brain/d071e746-551e-4b34-aa78-d5caf6c6c9f3/media__1777751258318.png' },
  { code: 'ilprom', file: '/Users/koushiksaha/.gemini/antigravity/brain/d071e746-551e-4b34-aa78-d5caf6c6c9f3/media__1777751283358.png' },
  { code: 'jamsai', file: '/Users/koushiksaha/.gemini/antigravity/brain/d071e746-551e-4b34-aa78-d5caf6c6c9f3/media__1777751297823.png' }
];

async function main() {
  for (const img of images) {
    if (!fs.existsSync(img.file)) {
      console.log(`File not found: ${img.file}`);
      continue;
    }

    const buffer = fs.readFileSync(img.file);
    const timestamp = Date.now();
    const fileName = `journal/${timestamp}_${img.code}.png`;

    try {
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: buffer,
        ContentType: 'image/png',
      });
      await s3Client.send(command);
      
      const s3Url = `/api/media/${fileName}`;
      
      await prisma.journal.updateMany({
        where: { code: img.code },
        data: { coverImageUrl: s3Url }
      });
      console.log(`Updated journal ${img.code} with URL ${s3Url}`);
    } catch (err) {
      console.error(`Error uploading ${img.code}:`, err.message);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
