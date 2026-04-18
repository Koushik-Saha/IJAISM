import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting S3 URL to Proxy Migration ---');

  // 1. Update Profile Image URLs for Users
  const usersWithS3 = await prisma.user.findMany({
    where: {
      profileImageUrl: {
        contains: 's3.us-east-2.amazonaws.com',
      },
    },
  });

  console.log(`Found ${usersWithS3.length} users with direct S3 URLs.`);

  for (const user of usersWithS3) {
    if (!user.profileImageUrl) continue;

    try {
      // Extract the key part from the URL
      // URL format: https://bucket.s3.region.amazonaws.com/key
      const url = new URL(user.profileImageUrl);
      const key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
      const proxyUrl = `/api/media/${key}`;

      await prisma.user.update({
        where: { id: user.id },
        data: { profileImageUrl: proxyUrl },
      });

      console.log(`Updated user ${user.id}: ${user.profileImageUrl} -> ${proxyUrl}`);
    } catch (err) {
      console.error(`Failed to update user ${user.id}:`, err);
    }
  }

  // 2. Add logic for other models if necessary (e.g., Article thumbnail)
  // Check if Article has coverImage or similar
  const articlesWithS3 = await prisma.article.findMany({
    where: {
      pdfUrl: {
        contains: 's3.us-east-2.amazonaws.com',
      },
    },
  });

  console.log(`Found ${articlesWithS3.length} articles with direct S3 URLs in pdfUrl.`);
  // We might not want to proxy PDFs for now if they are large, 
  // but for thumbnails it would be good. 
  // Let's check for other fields.
  
  console.log('--- Migration Complete ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
