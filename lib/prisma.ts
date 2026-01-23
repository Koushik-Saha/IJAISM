import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma_v2?: PrismaClient };

export const prisma =
  globalForPrisma.prisma_v2 ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma_v2 = prisma;
