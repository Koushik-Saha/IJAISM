#!/usr/bin/env python3
"""
Migrate conference data from old c5k.com website to new PostgreSQL DB.
Data sourced from https://c5k.com/conferences (no SQL table exists).
"""
import uuid, psycopg2, json
from datetime import datetime, timezone

def connect_db():
    return psycopg2.connect(
        "postgresql://neondb_owner:npg_4XAlo7GtgUuq@ep-royal-hill-ah8m2y0n-pooler.c-3.us-east-1.aws.neon.tech/neondb",
        sslmode="require", connect_timeout=60,
        keepalives=1, keepalives_idle=30, keepalives_interval=10, keepalives_count=5,
    )

CONFERENCES = [
    {
        "title": "C5K Global Research & Innovation Summit 2025",
        "acronym": "GRIS-2025",
        "description": "Shaping the Future: AI, Technology, and Business Innovation — a gathering of thought leaders and researchers to exchange ideas and advance cutting-edge research.",
        "fullDescription": (
            "The C5K Global Research & Innovation Summit 2025 is a premier academic and professional conference "
            "bringing together researchers, practitioners, and thought leaders from around the world. "
            "The summit focuses on the intersection of artificial intelligence, emerging technology, and modern business innovation. "
            "Selected papers presented at the conference will qualify for publication in C5K's peer-reviewed academic journals. "
            "The conference features keynote addresses by distinguished scholars, parallel research tracks, and a dedicated publishing panel."
        ),
        "startDate": datetime(2025, 12, 1, 9, 0, tzinfo=timezone.utc),
        "endDate":   datetime(2025, 12, 2, 18, 0, tzinfo=timezone.utc),
        "venue": "761 State Highway 100, Port Isabel, TX 78578, USA",
        "city": "Port Isabel",
        "country": "USA",
        "location": "Port Isabel, TX, USA",
        "status": "upcoming",
        "conferenceType": "hybrid",
        "registrationUrl": "https://c5k.com/register",
        "websiteUrl": "https://c5k.com/conferences",
        "callForPapersUrl": "https://c5k.com/conferences",
        "topics": [
            "AI & Business Analytics in Decision-Making",
            "Sustainable Innovation & Green Technology",
            "Evolving Trends in Digital Marketing & E-Business",
            "Cybersecurity & IT Infrastructure in the AI Era",
            "Publishing & Research Panel: From Paper to Publication",
            "International Law and Policy",
            "Organizational Management",
            "Technology and Innovation",
            "Environmental and Social Sustainability",
        ],
        "keynotes": [
            {"name": "Dr. Md. Saiful Islam", "title": "Keynote Speaker"},
            {"name": "Dr. Norsuzailina Mohamad Sutan", "title": "Keynote Speaker"},
            {"name": "Mr. Rakibul Hasan", "title": "Keynote Speaker"},
            {"name": "Dr. Md. Munir Hayet Khan", "title": "Keynote Speaker"},
            {"name": "Dr. Noor Md. Sadiqul Hasan", "title": "Keynote Speaker"},
        ],
        "importantDates": {
            "submissionDeadline": "November 15, 2025",
            "notificationOfAcceptance": "November 22, 2025",
            "cameraReadyDeadline": "November 28, 2025",
            "conferenceDate": "December 1–2, 2025",
        },
        "included": [
            "Keynote addresses by distinguished scholars",
            "Parallel research tracks across 9 topics",
            "Paper presentation opportunities",
            "Publication in C5K peer-reviewed journals",
            "Networking sessions",
            "Certificate of participation",
        ],
        "registrationFees": {
            "earlyBird": {"amount": "Contact for pricing", "deadline": "November 15, 2025"},
            "regular": {"amount": "Contact for pricing"},
        },
        "venueDetails": {
            "address": "761 State Highway 100",
            "city": "Port Isabel",
            "state": "TX",
            "zip": "78578",
            "country": "USA",
        },
        "bannerImageUrl": None,
        "submissionDeadline": datetime(2025, 11, 15, tzinfo=timezone.utc),
        "notificationDate": datetime(2025, 11, 22, tzinfo=timezone.utc),
    },
]

def main():
    print("=== Migrate Conferences ===\n")

    conn = connect_db()
    conn.autocommit = False
    cur = conn.cursor()

    # Clear existing conferences (cascade deletes registrations)
    cur.execute('DELETE FROM "ConferenceRegistration"')
    cur.execute('DELETE FROM "Conference"')
    print("Cleared existing conferences\n")

    now = datetime.now(timezone.utc)
    inserted = 0

    for c in CONFERENCES:
        cid = str(uuid.uuid4())
        try:
            cur.execute(
                '''INSERT INTO "Conference" (
                    id, title, acronym, description, "fullDescription",
                    "startDate", "endDate", venue, city, country, location,
                    status, "conferenceType",
                    "registrationUrl", "websiteUrl", "callForPapersUrl",
                    topics, keynotes, "importantDates", included,
                    "registrationFees", "venueDetails", "bannerImageUrl",
                    "submissionDeadline", "notificationDate",
                    "createdAt", "updatedAt"
                ) VALUES (
                    %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,
                    %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s
                )''',
                (
                    cid, c["title"], c["acronym"], c["description"], c["fullDescription"],
                    c["startDate"], c["endDate"], c["venue"], c["city"], c["country"], c["location"],
                    c["status"], c["conferenceType"],
                    c["registrationUrl"], c["websiteUrl"], c["callForPapersUrl"],
                    c["topics"], json.dumps(c["keynotes"]), json.dumps(c["importantDates"]),
                    c["included"], json.dumps(c["registrationFees"]), json.dumps(c["venueDetails"]),
                    c["bannerImageUrl"],
                    c["submissionDeadline"], c["notificationDate"],
                    now, now,
                )
            )
            inserted += 1
            print(f"  ✓ {c['title']}")
            print(f"       dates: Dec 1–2, 2025 | location: {c['city']}, {c['country']}")
            print(f"       topics: {len(c['topics'])} | keynotes: {len(c['keynotes'])}")
        except Exception as e:
            print(f"  [ERROR] {c['title'][:50]}: {e}")

    conn.commit()
    cur.close()
    conn.close()

    print(f"\n{'='*50}")
    print(f"Inserted: {inserted} / {len(CONFERENCES)}")


if __name__ == "__main__":
    main()
