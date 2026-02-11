
import { prisma } from "../lib/prisma";

async function main() {
    console.log("Checking prisma.wishlist...");
    if (prisma.wishlist) {
        console.log("SUCCESS: prisma.wishlist is defined.");
        try {
            const count = await prisma.wishlist.count();
            console.log(`Current wishlist count: ${count}`);
        } catch (e: any) {
            console.error("ERROR: Failed to query wishlist:", e.message);
        }
    } else {
        console.error("FAILURE: prisma.wishlist is UNDEFINED.");
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
