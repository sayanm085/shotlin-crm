import { hash } from 'bcryptjs'
import { prisma } from '../src/lib/prisma'

async function main() {
    const memberEmail = 'member@shotlin.com'
    const password = 'member123'
    const hashedPassword = await hash(password, 12)

    console.log('Creating member...')

    // Create Member
    const member = await prisma.user.upsert({
        where: { email: memberEmail },
        update: {
            password: hashedPassword,
            role: 'MEMBER',
        },
        create: {
            name: 'Test Member',
            email: memberEmail,
            password: hashedPassword,
            role: 'MEMBER',
            isActive: true,
        }
    })
    console.log(`✅ Member synced: ${memberEmail}`)

    // Create Draft Client
    const existingClient = await prisma.client.findFirst({
        where: { email: memberEmail }
    })

    let client;
    if (!existingClient) {
        client = await prisma.client.create({
            data: {
                legalName: 'Draft Member Client',
                panNumber: 'ABCDE5555F',
                companyType: 'PVT_LTD',
                email: memberEmail,
                onboardingStatus: 'DRAFT',
                createdById: member.id,
            }
        })
        console.log(`✅ Draft Client created`)
    } else {
        client = await prisma.client.update({
            where: { id: existingClient.id },
            data: { onboardingStatus: 'DRAFT' } // Reset to draft
        })
        console.log(`✅ Client reset to DRAFT`)
    }

    // Link
    if (member.clientId !== client.id) {
        await prisma.user.update({
            where: { id: member.id },
            data: { clientId: client.id }
        })
        console.log(`✅ Member linked to client`)
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
