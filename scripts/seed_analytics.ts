
import { prisma } from "../lib/prisma";

const COUNTRIES = ['USA', 'Germany', 'India', 'China', 'UK', 'Brazil', 'Canada', 'France'];
const CITIES = {
    'USA': ['New York', 'San Francisco', 'Chicago'],
    'Germany': ['Berlin', 'Munich', 'Hamburg'],
    'India': ['Mumbai', 'Bangalore', 'Delhi'],
    'China': ['Beijing', 'Shanghai'],
    'UK': ['London', 'Manchester'],
    'Brazil': ['Sao Paulo', 'Rio'],
    'Canada': ['Toronto', 'Vancouver'],
    'France': ['Paris', 'Lyon']
};

async function seedAnalytics() {
    console.log("Seeding analytics data...");

    // Get a user to attribute downloads to (or use a random ID if lenient)
    const user = await prisma.user.findFirst();
    if (!user) {
        console.error("No user found to attribute downloads to.");
        return;
    }

    // Generate 50 random download logs
    for (let i = 0; i < 50; i++) {
        const country = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
        // @ts-ignore
        const city = CITIES[country][Math.floor(Math.random() * CITIES[country].length)];

        await prisma.downloadLog.create({
            data: {
                userId: user.id,
                resourceId: `res_${Math.floor(Math.random() * 1000)}`,
                resourceType: 'article',
                ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
                country: country,
                city: city,
                downloadedAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)) // Random time in last 30 days
            }
        });
    }

    console.log("Seeding completed. Added 50 download logs.");
}

seedAnalytics()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
