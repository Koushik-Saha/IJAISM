
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding Global Settings...')

    await prisma.globalSettings.upsert({
        where: { key: 'apc_fee' },
        update: {},
        create: {
            key: 'apc_fee',
            value: '500'
        }
    })

    console.log('Global Settings Seeded: APC Fee = 500')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
