// Script: mark all existing users as email-verified
// Run: npx ts-node --skip-project --compiler-options '{"module":"commonjs","esModuleInterop":true}' scripts/verify-existing-users.ts

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function main() {
  console.log('\n==============================================');
  console.log('   Bulk Email Verification — C5K Platform');
  console.log('==============================================\n');

  // Count how many are currently unverified
  const unverifiedCount = await prisma.user.count({
    where: { isEmailVerified: false, deletedAt: null },
  });

  const totalCount = await prisma.user.count({ where: { deletedAt: null } });

  console.log(`Total active users    : ${totalCount}`);
  console.log(`Already verified      : ${totalCount - unverifiedCount}`);
  console.log(`To be verified now    : ${unverifiedCount}`);

  if (unverifiedCount === 0) {
    console.log('\n✅ All users are already verified. Nothing to do.');
    return;
  }

  // Mark all unverified users as verified
  const result = await prisma.user.updateMany({
    where: { isEmailVerified: false, deletedAt: null },
    data: { isEmailVerified: true },
  });

  console.log(`\n✅ Updated ${result.count} users → isEmailVerified = true`);
  console.log('\nExisting users can now log in without email verification.');
  console.log('New registrations will still require email verification.\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
