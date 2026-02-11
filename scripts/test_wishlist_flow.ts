
import { prisma } from "../lib/prisma";

async function main() {
    console.log("Starting Wishlist Persistence Test...");

    // 1. Get or Create a Test User
    let user = await prisma.user.findFirst({ where: { email: "test_wishlist@example.com" } });
    if (!user) {
        user = await prisma.user.create({
            data: {
                email: "test_wishlist@example.com",
                passwordHash: "dummy",
                name: "Wishlist Tester",
                role: "author",
                university: "Test University"
            }
        });
        console.log("Created test user:", user.id);
    } else {
        console.log("Using existing test user:", user.id);
    }

    // 2. Get or Create a Test Book
    let book = await prisma.book.findFirst({ where: { isbn: "999-TEST-ISBN" } });
    if (!book) {
        book = await prisma.book.create({
            data: {
                title: "Test Wishlist Book",
                authors: ["Test Author"],
                year: 2024,
                isbn: "999-TEST-ISBN",
                pages: 100,
                field: "Technology",
                description: "Test description",
                fullDescription: "Full test description",
                price: "$10.00",
                publisher: "Test Publisher",
                language: "English",
                edition: "1st",
                format: "Paperback"
            }
        });
        console.log("Created test book:", book.id);
    } else {
        console.log("Using existing test book:", book.id);
    }

    // 3. Add to Wishlist
    try {
        await prisma.wishlist.upsert({
            where: {
                userId_bookId: {
                    userId: user.id,
                    bookId: book.id
                }
            },
            update: {},
            create: {
                userId: user.id,
                bookId: book.id
            }
        });
        console.log("Added to wishlist (UPSERT success)");
    } catch (e: any) {
        console.error("Failed to add to wishlist:", e.message);
    }

    // 4. Verify
    const wishlistItems = await prisma.wishlist.findMany({
        where: { userId: user.id },
        include: { book: true }
    });

    console.log(`Wishlist count for user: ${wishlistItems.length}`);
    if (wishlistItems.length > 0) {
        console.log("First item:", wishlistItems[0].book.title);
        console.log("SUCCESS: Database persistence is working.");
    } else {
        console.error("FAILURE: Database did not persist the item.");
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
