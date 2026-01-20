
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const fields = [
    "Information Technology",
    "Business Management",
    "Computer Science",
    "Artificial Intelligence",
    "Data Science",
    "Cybersecurity",
    "Software Engineering",
    "Digital Marketing",
    "Finance",
    "Leadership"
];

const topics = [
    "Machine Learning",
    "Deep Learning",
    "Blockchain",
    "Qunatum Computing",
    "Cloud Architecture",
    "Strategic Planning",
    "Organizational Behavior",
    "Network Security",
    "Web Development",
    "Mobile Computing",
    "Big Data Analytics",
    "Internet of Things",
    "DevOps Practices",
    "Agile Methodologies",
    "Project Management",
    "Digital Transformation",
    "Supply Chain Management",
    "Financial Technology",
    "Ethics in AI",
    "Human-Computer Interaction"
];

const adjectives = [
    "Advanced",
    "Modern",
    "Fundamental",
    "Applied",
    "Strategic",
    "Comprehensive",
    "Essential",
    "Practical",
    "Innovative",
    "Future of"
];

const authors = [
    "Dr. Sarah Johnson",
    "Dr. Michael Chen",
    "Dr. Emily Rodriguez",
    "Dr. James Williams",
    "Dr. Lisa Anderson",
    "Dr. Robert Brown",
    "Prof. David Kim",
    "Prof. Maria Garcia",
    "Prof. John Smith",
    "Prof. Elizabeth Green",
    "Alice Thompson",
    "Robert Martin",
    "Andrew Ng",
    "Fei-Fei Li",
    "Yann LeCun"
];

const publishers = [
    "IJAISM Press",
    "TechPublishing",
    "Academic World",
    "Future Books",
    "Global Scholars",
    "University Press"
];

function getRandomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomBook(index: number) {
    const field = getRandomItem(fields);
    const topic = getRandomItem(topics);
    const adjective = getRandomItem(adjectives);
    const title = `${adjective} ${topic}${Math.random() > 0.5 ? ': Theory and Practice' : ''}`;

    const numAuthors = getRandomInt(1, 3);
    const bookAuthors = [];
    for (let i = 0; i < numAuthors; i++) {
        bookAuthors.push(getRandomItem(authors));
    }
    // Remove duplicates
    const uniqueAuthors = [...new Set(bookAuthors)];

    const year = getRandomInt(2018, 2024);
    const pages = getRandomInt(200, 800);
    const price = `$${getRandomInt(39, 149)}.99`;

    return {
        title,
        authors: uniqueAuthors,
        year,
        isbn: `978-${getRandomInt(100, 999)}-${getRandomInt(10000, 99999)}-${getRandomInt(10, 99)}-${getRandomInt(0, 9)}`,
        pages,
        field,
        description: `A comprehensive guide to ${topic.toLowerCase()}, covering key concepts, methodologies, and real-world applications in ${field}. This book is essential for students, researchers, and professionals looking to deepen their understanding of ${topic}.`,
        fullDescription: `This authoritative text provides an in-depth exploration of ${topic}, bridging the gap between theoretical foundations and practical implementation. 
    
    The book covers:
    - Fundamental principles of ${topic}
    - Advanced methodologies and state-of-the-art techniques
    - Case studies from leading organizations
    - Future trends and emerging technologies in ${field}
    
    Written by leading experts in the field, this book serves as a valuable resource for academic research and professional development.`,
        price,
        publisher: getRandomItem(publishers),
        language: "English",
        edition: `${getRandomInt(1, 4)}${['st', 'nd', 'rd', 'th'][Math.min(getRandomInt(1, 4) - 1, 3)]} Edition`,
        format: Math.random() > 0.3 ? "Hardcover & eBook" : "Paperback & eBook",
        coverImageUrl: null, // Using default placeholder
        tableOfContents: [
            { chapter: 1, title: `Introduction to ${topic}`, pages: "1-30" },
            { chapter: 2, title: "Theoretical Framework", pages: "31-80" },
            { chapter: 3, title: "Core Concepts", pages: "81-150" },
            { chapter: 4, title: "Methodologies", pages: "151-220" },
            { chapter: 5, title: "Case Studies", pages: "221-300" },
            { chapter: 6, title: "Future Directions", pages: "301-350" },
            { chapter: 7, title: "Conclusion", pages: "351-380" }
        ],
        previewPages: [
            {
                pageNumber: 1,
                content: `Chapter 1: Introduction to ${topic}\n\n${topic} has revolutionized how we approach problems in ${field}. This chapter introduces the fundamental concepts...`
            }
        ],
        reviews: [
            {
                author: "Academic Reviewer",
                rating: 5,
                text: "An excellent resource for students and professionals alike."
            },
            {
                author: "Industry Expert",
                rating: 4,
                text: "Comprehensive and up-to-date coverage of the subject."
            }
        ],
        relatedTopics: [topic, field, "Research", "Innovation"]
    };
}

async function main() {
    console.log('Start seeding books...');

    // Optional: Clear existing books? User said "create some book", maybe append is safer or clear.
    // Let's just create 50 new ones.

    const booksToCreate = 50;

    for (let i = 0; i < booksToCreate; i++) {
        const bookData = generateRandomBook(i);
        const book = await prisma.book.create({
            data: bookData
        });
        console.log(`Created book with id: ${book.id}`);
    }

    console.log(`Seeding finished. Created ${booksToCreate} books.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
