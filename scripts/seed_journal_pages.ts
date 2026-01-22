import { prisma } from "../lib/prisma";

async function main() {
    console.log("Seeding Journal Pages content...");

    const journals = await prisma.journal.findMany();

    for (const journal of journals) {
        console.log(`Updating content for ${journal.code}...`);

        // 1. Editorial Board Data
        const editorialBoard = [
            {
                name: "Dr. Sarah Thompson",
                role: "Editor-in-Chief",
                affiliation: "Stanford University, USA",
                image: null
            },
            {
                name: "Prof. James Chen",
                role: "Associate Editor",
                affiliation: "National University of Singapore",
                image: null
            },
            {
                name: "Dr. Elena Rodriguez",
                role: "Associate Editor",
                affiliation: "University of Barcelona, Spain",
                image: null
            },
            {
                name: "Prof. Michael O'Connor",
                role: "Editorial Board Member",
                affiliation: "Trinity College Dublin, Ireland",
                image: null
            }
        ];

        const editorialBoardDescription = `The Editorial Board of ${journal.fullName} comprises leading scholars and practitioners from around the globe. Our editors ensure the highest standards of peer review and editorial integrity.`;

        // 2. Editing Service Data
        const editingService = `
      <h3>Professional Language Editing Services</h3>
      <p>We understand that publishing in English can be challenging for non-native speakers. To help authors communicate their research clearly and effectively, we offer professional language editing services.</p>
      
      <h4>Why Use Our Service?</h4>
      <ul>
        <li><strong>Expert Editors:</strong> Our editors are native English speakers with advanced degrees in relevant fields.</li>
        <li><strong>Quality Guarantee:</strong> We ensure your manuscript meets the highest standards of academic English.</li>
        <li><strong>Fast Turnaround:</strong> Get your edited manuscript back in as little as 3 days.</li>
      </ul>
      
      <h4>Pricing</h4>
      <p>Our standard rate is $0.05 per word. Express service is available for $0.08 per word.</p>
      
      <p><em>Note: Use of this service is optional and does not guarantee acceptance for publication.</em></p>
    `;

        // Update Journal
        await prisma.journal.update({
            where: { id: journal.id },
            data: {
                editorialBoard: editorialBoard,
                editorialBoardDescription: editorialBoardDescription,
                editingService: editingService
            }
        });
    }

    console.log("Journal content updated successfully.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
