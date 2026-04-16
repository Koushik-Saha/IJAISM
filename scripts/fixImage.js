const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const slides = await prisma.heroSlide.findMany();
  for (const slide of slides) {
    if (slide.imageUrl && slide.imageUrl.includes('1532094349884')) {
      await prisma.heroSlide.update({
        where: { id: slide.id },
        data: { imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=1920' }
      });
      console.log('Fixed:', slide.id);
    }
  }
}
run().then(() => process.exit(0)).catch(console.error);
