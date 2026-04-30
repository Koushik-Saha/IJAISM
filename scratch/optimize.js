const fs = require('fs');
const path = require('path');

const files = [
  'app/api/articles/public/route.ts',
  'app/api/search/route.ts',
  'app/api/editor/articles/route.ts',
  'app/api/editor/stats/route.ts',
  'app/api/articles/my-submissions/route.ts',
  'app/api/homepage/route.ts',
  'app/page.tsx',
  'app/sitemap.ts',
  'app/articles/[id]/read/page.tsx',
  'app/journals/[code]/awards/page.tsx',
  'app/journals/[code]/press/page.tsx',
];

for (const file of files) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    // We only want to add omit: { fullText: true } if it's not already there.
    if (!content.includes('omit: { fullText: true }')) {
      // Find prisma.article.findMany({ and append omit: { fullText: true },
      // Handle the sitemap specially since it uses select instead of include usually, 
      // but actually adding omit is safe in Prisma if no select is used, or we can just use select.
      if (file === 'app/sitemap.ts') {
        content = content.replace(/prisma\.article\.findMany\(\s*\{/, "prisma.article.findMany({\n        select: { id: true, updatedAt: true },");
      } else {
        content = content.replace(/prisma\.article\.findMany\(\s*\{/g, "prisma.article.findMany({\n        omit: { fullText: true },");
      }
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${file}`);
    } else {
      console.log(`Skipped ${file} (already optimized)`);
    }
  } else {
    console.log(`File not found: ${file}`);
  }
}
