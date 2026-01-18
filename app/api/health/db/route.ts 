import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "ok",
      database: "connected",
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    console.error("DB health check failed:", error);

    return NextResponse.json(
      {
        status: "error",
        database: "not connected",
      },
      { status: 500 }
    );
  }
}
