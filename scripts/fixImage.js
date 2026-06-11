const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const slides = await prisma.heroSlide.findMany();
  for (const slide of slides) {
    if (slide.imageUrl && slide.imageUrl.includes('1532094349884')) {
      await prisma.heroSlide.update({
        where: { id: slide.id },
        data: { imageUrl: '/images/hero/research_publishing.png' }
      });
      console.log('Fixed:', slide.id);
    }
  }
}
run().then(() => process.exit(0)).catch(console.error);
