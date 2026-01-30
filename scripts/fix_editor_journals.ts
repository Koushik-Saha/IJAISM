import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const email = 'editor.amlid@c5k.com';
  
  // Get user
  const user = await prisma.user.findUnique({
    where: { email },
    include: { managedJournals: true }
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log(`User ${user.email} manages: ${user.managedJournals.map(j => j.code).join(', ')}`);

  if (user.managedJournals.length > 1) {
    // Keep AMLID, remove others (or specifically TBFLI)
    // The user name is 'editor.amlid' so we assume they should keep AMLID.
    const toKeep = user.managedJournals.find(j => j.code === 'AMLID');
    
    if (toKeep) {
        const toDisconnect = user.managedJournals.filter(j => j.id !== toKeep.id);
        
        await prisma.user.update({
            where: { id: user.id },
            data: {
                managedJournals: {
                    disconnect: toDisconnect.map(j => ({ id: j.id }))
                }
            }
        });
        console.log(`Removed ${toDisconnect.length} extra journals. Kept AMLID.`);
    } else {
        console.log('AMLID not found in managed journals. Manual check needed.');
    }
  } else {
    console.log('User has correct number of journals (0 or 1).');
  }
}

main().catch(console.error);
