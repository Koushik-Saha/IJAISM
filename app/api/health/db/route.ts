import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Check basic connection
    await prisma.$queryRaw`SELECT 1`;

    // 2. Define expected tables based on schema.prisma
    const expectedTables = [
      "User",
      "PasswordResetToken",
      "EmailVerificationToken",
      "Membership",
      "Journal",
      "JournalIssue",
      "Article",
      "CoAuthor",
      "Review",
      "Dissertation",
      "Conference",
      "ConferenceRegistration",
      "Blog",
      "Announcement",
      "Notification",
      "Book",
      "DownloadLog"
    ];

    // 3. Query information_schema to find existing tables
    // We explicitly cast the result to the expected shape
    const tablesInDbRaw = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;

    // Normalize names for comparison (Postgres might be case sensitive depending on creation)
    const tablesInDb = tablesInDbRaw.map(t => t.table_name);

    // Check which expected tables are present (case-insensitive check to be safe)
    const missingTables = expectedTables.filter(expected =>
      !tablesInDb.some(actual => actual.toLowerCase() === expected.toLowerCase())
    );

    const isHealthy = missingTables.length === 0;

    return NextResponse.json({
      status: isHealthy ? "healthy" : "unhealthy",
      connected: true,
      message: isHealthy ? "Database is connected and all tables verify." : "Database connected but tables are missing.",
      check_time: new Date().toISOString(),
      stats: {
        expected_count: expectedTables.length,
        found_count: tablesInDb.length,
        missing_count: missingTables.length
      },
      missing_tables: missingTables,
      existing_tables: tablesInDb.sort()
    }, { status: isHealthy ? 200 : 503 });

  } catch (error: any) {
    console.error("Health check failed:", error);
    return NextResponse.json({
      status: "critical",
      connected: false,
      message: "Failed to connect to the database.",
      error: error.message
    }, { status: 500 });
  }
}
