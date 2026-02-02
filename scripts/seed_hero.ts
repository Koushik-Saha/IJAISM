
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding 5 Demo Hero Slides (Safe Placeholders)...');

    // Clear existing slides to avoid duplicates or mess
    await prisma.heroSlide.deleteMany({});
    console.log('Cleared existing slides.');

    // Using placehold.co which is already configured in next.config.ts
    // Format: https://placehold.co/{width}x{height}/{background_color}/{text_color}/png?text={text}
    const slides = [
        {
            title: "Welcome to C5K Academic Publishing Platform",
            subtitle: "Dedicated to publishing groundbreaking research and promoting innovative ideas",
            description: "In the fields of information technology, business management, and related disciplines.\n\nOur goal is to minimize the delay in sharing new ideas and discoveries with the world.",
            primaryButtonText: "Submit Your Research",
            primaryButtonLink: "/submit",
            secondaryButtonText: "Browse Journals",
            secondaryButtonLink: "/journals",
            displayOrder: 1,
            imageUrl: "https://placehold.co/1920x1080/1e3a8a/ffffff/png?text=C5K+Research", // Blue
        },
        {
            title: "Fast & Rigorous Peer Review",
            subtitle: "Experience a streamlined submission process",
            description: "We pride ourselves on our rapid yet thorough review cycle, ensuring your research is validated and published without unnecessary delays.",
            primaryButtonText: "Learn More",
            primaryButtonLink: "/about",
            secondaryButtonText: null,
            secondaryButtonLink: null,
            displayOrder: 2,
            imageUrl: "https://placehold.co/1920x1080/065f46/ffffff/png?text=Peer+Review", // Green
        },
        {
            title: "Global Reach & Impact",
            subtitle: "Connect with researchers from over 50 countries",
            description: "Your work deserves to be seen. Our platform ensures high visibility and accessibility for scholars worldwide.",
            primaryButtonText: "View Statistics",
            primaryButtonLink: "/stats",
            secondaryButtonText: "Our Community",
            secondaryButtonLink: "/community",
            displayOrder: 3,
            imageUrl: "https://placehold.co/1920x1080/7c2d12/ffffff/png?text=Global+Reach", // Brown/Orange
        },
        {
            title: "Open Access for All",
            subtitle: "Breaking down barriers to knowledge",
            description: "C5K is committed to open science. We believe that knowledge should be freely accessible to everyone, everywhere.",
            primaryButtonText: "Read Articles",
            primaryButtonLink: "/articles",
            secondaryButtonText: null,
            secondaryButtonLink: null,
            displayOrder: 4,
            imageUrl: "https://placehold.co/1920x1080/4c1d95/ffffff/png?text=Open+Access", // Purple
        },
        {
            title: "Join the C5K Community",
            subtitle: "Collaborate, Review, and Publish",
            description: "Become part of a growing network of academics. Apply to be a reviewer or editor today.",
            primaryButtonText: "Join Now",
            primaryButtonLink: "/register",
            secondaryButtonText: "Contact Us",
            secondaryButtonLink: "/contact",
            displayOrder: 5,
            imageUrl: "https://placehold.co/1920x1080/111827/ffffff/png?text=Community", // Dark Gray
        }
    ];

    for (const slide of slides) {
        await prisma.heroSlide.create({
            data: {
                ...slide,
                isActive: true,
            }
        });
    }

    console.log('5 Demo placeholder slides created.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
