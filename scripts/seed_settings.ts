import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding initial global settings...");

    const initialSettings = [
        { key: "site_name", value: "C5K" },
        { 
            key: "site_location", 
            value: "761 State Highway 100, Port Isabel, TX 78578, USA" 
        },
        { key: "site_contact_email", value: "contact@c5k.com" },
        { key: "site_contact_phone", value: "+1 (956) 555-0123" },
        {
            key: "site_mission",
            value: "At C5K, we are dedicated to publishing groundbreaking research and promoting innovative ideas in the fields of information technology, business management, and related disciplines. Our goal is to minimize the delay in sharing new ideas and discoveries with the world."
        },
        {
            key: "site_vision",
            value: "To be a leading global platform for scholarly research that bridges the gap between theoretical knowledge and real-world application, empowering researchers to change the world through shared knowledge."
        },
        {
            key: "privacy_policy",
            value: "<h3>1. Information We Collect</h3><p>We collect personal information that you voluntarily provide to us when you register on the website, submit articles, or communicate with us.</p><h3>2. How We Use Your Information</h3><p>We use your personal information to facilitate account creation, manage peer review, and protect our sites.</p>"
        },
        {
            key: "terms_conditions",
            value: "<h3>1. Acceptance of Terms</h3><p>By accessing this website, you are agreeing to be bound by these terms of service and all applicable laws and regulations.</p><h3>2. Use License</h3><p>Permission is granted to temporarily download one copy of the materials (information or software) on C5K's website for personal, non-commercial transitory viewing only.</p>"
        },
        { key: "site_logo_url", value: "/logo.png" } // Fallback to existing if any
    ];

    for (const setting of initialSettings) {
        await prisma.globalSettings.upsert({
            where: { key: setting.key },
            update: {}, // Don't overwrite if exists
            create: setting
        });
    }

    console.log("Seeding complete.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
