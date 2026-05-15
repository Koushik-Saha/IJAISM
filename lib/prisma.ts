import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma_v2?: PrismaClient };

if (!globalForPrisma.prisma_v2) {
  globalForPrisma.prisma_v2 = new PrismaClient({ log: ["error"] });
}

export const prisma = globalForPrisma.prisma_v2;
