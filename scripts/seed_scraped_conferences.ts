
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const conferences = [
    {
        title: "C5K Global Research & Innovation Summit 2025",
        description: "Welcome to the C5K Conference Hub! Our conferences bring together thought leaders, researchers, and industry experts to foster the exchange of innovative ideas and cutting-edge research. Join us to gain insights, build professional networks, and advance in your field.",
        fullDescription: "Join us at the C5K Global Research & Innovation Summit 2025 to explore the future of AI, Technology, and Business Innovation. This summit is a premier platform for researchers, practitioners, and industry leaders to discuss regulatory changes, policy development, legal innovations, business operations, leadership, strategic management, digital transformation, and sustainable innovation.",
        startDate: new Date("2025-12-01"),
        endDate: new Date("2025-12-02"),
        location: "761 State Highway 100 Port Isabel, TX 78578, USA",
        venue: "C5K Conference Center",
        city: "Port Isabel",
        country: "USA",
        conferenceType: "Hybrid", // inferred from "Hybrid Format" section
        status: "Upcoming",
        topics: [
            "AI & Business Analytics",
            "Sustainable Innovation",
            "Green Technology",
            "Digital Marketing",
            "E-Business",
            "Cybersecurity",
            "IT Infrastructure",
            "International Law",
            "Organizational Management"
        ],
        keynotes: [
            { name: "Dr. Md. Saiful Islam", title: "Professor", topic: "Research & Innovation", affiliation: "University Malaysia Sarawak, Malaysia & Bangladesh Army University of Engineering and Technology" },
            { name: "Dr. Norsuzailina Mohamad Sutan", title: "Professor", topic: "Engineering", affiliation: "University Malaysia Sarawak, Malaysia" },
            { name: "Mr. Rakibul Hasan", title: "CEO", topic: "Technology Leadership", affiliation: "Freedom IT, USA" },
            { name: "Dr. Md. Munir Hayet Khan", title: "Professor", topic: "International Business", affiliation: "INTI International University (INTI-IU), Malaysia" },
            { name: "Dr. Noor Md. Sadiqul Hasan", title: "Professor", topic: "Agriculture & Technology", affiliation: "The University of Adelaide, Australia & IUBAT" }
        ],
        schedule: [
            { day: "Day 1", events: ["Opening Ceremony", "Keynote Speeches", "AI & Business Analytics Session", "Sustainable Innovation Panel"] },
            { day: "Day 2", events: ["Digital Marketing Workshops", "Cybersecurity Tracks", "Research Panel: From Paper to Publication", "Closing Ceremony"] }
        ],
        submissionDeadline: new Date("2025-08-01"), // Estimated
        notificationDate: new Date("2025-09-01") // Estimated
    }
];

async function main() {
    console.log('Start seeding scraped conferences...');

    for (const conf of conferences) {
        const existing = await prisma.conference.findFirst({
            where: { title: conf.title }
        });

        if (existing) {
            console.log(`Conference "${conf.title}" already exists. Updating...`);
            await prisma.conference.update({
                where: { id: existing.id },
                data: {
                    ...conf,
                    // Avoid overriding existing relationships if any, but simplistic here
                    status: "upcoming" // Ensure it shows up
                }
            });
        } else {
            const created = await prisma.conference.create({
                data: conf
            });
            console.log(`Created conference: ${created.title}`);
        }
    }

    console.log(`Seeding finished.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
