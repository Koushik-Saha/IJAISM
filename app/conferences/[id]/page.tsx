import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ConferenceClient from "./ConferenceClient";

export const dynamic = "force-dynamic";

export default async function ConferenceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const conference = await prisma.conference.findUnique({
    where: { id },
  });

  if (!conference) {
    notFound();
  }

  // Parse JSON/Arrays safely and cast to expected types for Client Component
  // Prisma handles Json -> any/object automatic conversion in runtime, 
  // but TS might need help or we default if null.
  const conf = conference as any;

  return (
    <ConferenceClient
      conference={{
        ...conf,
        acronym: conf.acronym,
        // Ensure arrays are arrays if they happen to be null (though Prisma returns [] for String[] usually? No, it's nullable if not set? No, string[] is set in schema)
        // Schema: topics String[] -> returns [] if empty.
        // Json fields might be null.
        keynotes: (conf.keynotes as any[]) || [],
        schedule: (conf.schedule as any[]) || [],
        registrationFees: (conf.registrationFees as any) || {},
        included: conf.included || [],
        importantDates: (conf.importantDates as any[]) || [],
        venueDetails: (conf.venueDetails as any) || {},
      }}
    />
  );
}
