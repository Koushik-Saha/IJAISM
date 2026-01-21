
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const conferenceTypes = ["In-person", "Virtual", "Hybrid (In-person & Virtual)"];
const statuses = ["Upcoming", "Call for Papers", "Registration Open", "Ongoing", "Completed"];
const cities = ["San Francisco", "London", "Singapore", "New York", "Tokyo", "Berlin", "Paris", "Dubai", "Toronto", "Sydney"];
const countries = ["USA", "UK", "Singapore", "USA", "Japan", "Germany", "France", "UAE", "Canada", "Australia"];

const topicsList = [
    ["Machine Learning", "Deep Learning", "Neural Networks", "AI Applications"],
    ["Digital Transformation", "Innovation Management", "Business Strategy", "Entrepreneurship"],
    ["Cybersecurity", "Data Privacy", "Network Security", "Threat Intelligence"],
    ["Cloud Computing", "IoT", "Edge Computing", "Big Data"],
    ["Blockchain", "FinTech", "Decentralized Finance", "Smart Contracts"]
];

function getRandomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function generateConference(index: number) {
    const locationIndex = index % cities.length;
    const city = cities[locationIndex];
    const country = countries[locationIndex];
    const type = getRandomItem(conferenceTypes);
    const status = getRandomItem(statuses);
    const topicSet = topicsList[index % topicsList.length];

    const startDate = addDays(new Date(), getRandomInt(30, 365));
    const endDate = addDays(startDate, getRandomInt(2, 4));

    const title = `International Conference on ${topicSet[0]} and ${topicSet[1]} ${startDate.getFullYear()}`;
    const acronym = `IC${topicSet[0].substring(0, 1)}${topicSet[1].substring(0, 1)} ${startDate.getFullYear()}`;

    return {
        title,
        acronym,
        description: `Join leading researchers, practitioners, and industry experts from around the world for three days of cutting-edge presentations, workshops, and networking opportunities in ${topicSet[0].toLowerCase()}.`,
        fullDescription: `The ${title} (${acronym}) brings together the global community for an immersive event featuring keynote presentations, technical sessions, workshops, and networking opportunities.

    ${acronym} provides a premier platform for researchers, practitioners, and industry leaders to share recent advances, discuss challenges, and explore future directions. The conference features both theoretical contributions and practical applications.

    With expected attendees from over 30 countries, ${acronym} offers unparalleled opportunities for collaboration, knowledge exchange, and professional development.`,
        startDate,
        endDate,
        venue: "Grand Convention Center",
        city,
        country,
        location: `${city}, ${country}`,
        websiteUrl: "https://example.com",
        registrationUrl: "https://example.com/register",
        submissionDeadline: addDays(startDate, -60),
        notificationDate: addDays(startDate, -30),
        conferenceType: type,
        status,
        bannerImageUrl: null,

        topics: topicSet,
        included: [
            "Access to all technical sessions and workshops",
            "Conference proceedings (print and digital)",
            "Welcome reception and coffee breaks",
            "Conference dinner",
            "Certificate of attendance",
            "Networking opportunities"
        ],

        // JSON Fields
        keynotes: [
            {
                name: `Dr. Expert One`,
                title: "Professor, Tech University",
                topic: `Future of ${topicSet[0]}`
            },
            {
                name: `Dr. Expert Two`,
                title: "Chief Scientist, AI Corp",
                topic: `${topicSet[1]} in Practice`
            }
        ],

        schedule: [
            {
                day: "Day 1",
                events: [
                    { time: "09:00 - 10:00", event: "Opening Ceremony" },
                    { time: "10:00 - 12:00", event: "Keynote Speeches" },
                    { time: "13:30 - 17:00", event: "Technical Sessions" }
                ]
            },
            {
                day: "Day 2",
                events: [
                    { time: "09:00 - 17:00", event: "Workshops and Panels" },
                    { time: "19:00 - 22:00", event: "Gala Dinner" }
                ]
            }
        ],

        registrationFees: {
            earlyBird: {
                period: "Until 2 months before",
                inPerson: "$450",
                virtual: "$150",
                student: "40% off"
            },
            regular: {
                period: "Until 1 week before",
                inPerson: "$550",
                virtual: "$200",
                student: "30% off"
            }
        },

        importantDates: [
            { event: "Paper Submission Deadline", date: addDays(startDate, -60).toISOString().split('T')[0] },
            { event: "Notification of Acceptance", date: addDays(startDate, -30).toISOString().split('T')[0] },
            { event: "Conference Dates", date: `${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}` }
        ],

        venueDetails: {
            name: "Grand Convention Center",
            address: `123 Main St, ${city}`,
            description: "A world-class venue in the heart of the city.",
            hotels: [
                { name: "Luxury Hotel", distance: "0.2 miles", rate: "$200/night" },
                { name: "Budget Inn", distance: "0.5 miles", rate: "$100/night" }
            ]
        }
    };
}

async function main() {
    console.log('Start seeding conferences...');

    const conferencesToCreate = 10;

    for (let i = 0; i < conferencesToCreate; i++) {
        const confData = generateConference(i);
        // Explicitly cast JSON fields to any to satisfy Prisma types if needed, 
        // though usually Prisma handles object -> Json automatically.
        const conference = await prisma.conference.create({
            data: confData as any
        });
        console.log(`Created conference with id: ${conference.id}`);
    }

    console.log(`Seeding finished. Created ${conferencesToCreate} conferences.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
