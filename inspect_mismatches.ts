import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()
const INPUT_DIR = path.join(process.cwd(), 'migration-data', 'transformed')

function readJSON(filename: string) {
    const filepath = path.join(INPUT_DIR, filename);
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

async function inspectMismatches() {
    const dbUsers = await prisma.user.findMany({ select: { id: true, email: true } });
    console.log(`Total users in DB: ${dbUsers.length}`);

    const articles = readJSON('Article.json');
    const authorIdsInDb = new Set(dbUsers.map(u => u.id));

    const badAuthorIds = new Set<string>();
    articles.forEach((a: any) => {
        if (!authorIdsInDb.has(a.authorId)) {
            badAuthorIds.add(a.authorId);
        }
    });

    console.log(`Unique AuthorIDs in Articles that are missing from DB: ${badAuthorIds.size}`);

    // Pick the first bad one and see if it's in User.json
    const badId = Array.from(badAuthorIds)[0];
    console.log(`Example bad AuthorID: ${badId}`);

    const usersJson = readJSON('User.json');
    const userInJson = usersJson.find((u: any) => u.id === badId);
    if (userInJson) {
        console.log(`User was found in User.json! Email: ${userInJson.email}`);
        const dbMatchingEmail = dbUsers.find(u => u.email === userInJson.email);
        if (dbMatchingEmail) {
            console.log(`A user with email ${userInJson.email} ALREADY EXISTS in DB with id ${dbMatchingEmail.id}. skipDuplicates bypassed the UUID!`);
        } else {
            console.log(`A user with email ${userInJson.email} does NOT exist in DB. Why wasn't it inserted?`);
        }
    } else {
        console.log(`User was NOT found in User.json!`);
    }

}

inspectMismatches()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
