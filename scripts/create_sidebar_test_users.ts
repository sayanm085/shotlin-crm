
import { PrismaClient, CompanyType } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { hash } from 'bcryptjs'
import { randomBytes } from 'crypto'

const connectionString = process.env.DATABASE_URL || 'postgresql://shotlin:shotlin_secure_2026@localhost:5432/shotlin_crm'
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

function generatePan() {
    return randomBytes(5).toString('hex').toUpperCase()
}

async function main() {
    const password = await hash('password123', 12)

    // 1. Create Admin
    const adminEmail = 'admin@test.com'
    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: { password, role: 'SUPER_ADMIN', isActive: true },
        create: {
            email: adminEmail,
            name: 'Test Admin',
            password,
            role: 'SUPER_ADMIN',
            isActive: true,
        },
    })
    console.log(`Admin created: ${admin.email}`)

    // 2. Create Client (Draft)
    const clientDraftName = 'Client Draft Inc'
    // Use try catch for unique constraints if upsert doesn't cover it (e.g. if email doesn't exist but PAN does)
    // Instead of upsert, let's just find first.

    let clientDraft = await prisma.client.findUnique({ where: { email: 'client_draft@test.com' } })
    if (!clientDraft) {
        clientDraft = await prisma.client.create({
            data: {
                name: undefined, // removed
                legalName: clientDraftName,
                panNumber: generatePan(),
                companyType: CompanyType.PVT_LTD,
                email: 'client_draft@test.com',
                phone: '1234567890',
                onboardingStatus: 'DRAFT',
            }
        })
    } else {
        await prisma.client.update({
            where: { id: clientDraft.id },
            data: { onboardingStatus: 'DRAFT' }
        })
    }

    // 3. Create Member for Client Draft
    const memberDraftEmail = 'member_draft@test.com'
    await prisma.user.upsert({
        where: { email: memberDraftEmail },
        update: {
            password,
            role: 'MEMBER',
            isActive: true,
            clientId: clientDraft.id
        },
        create: {
            email: memberDraftEmail,
            name: 'Member Draft',
            password,
            role: 'MEMBER',
            isActive: true,
            clientId: clientDraft.id,
        },
    })
    console.log(`Member (Draft) created: ${memberDraftEmail} linked to client ${clientDraft.id}`)

    // 4. Create Client (Submitted)
    const clientSubName = 'Client Submitted Inc'
    let clientSub = await prisma.client.findUnique({ where: { email: 'client_sub@test.com' } })
    if (!clientSub) {
        clientSub = await prisma.client.create({
            data: {
                legalName: clientSubName,
                panNumber: generatePan(),
                companyType: CompanyType.INDIVIDUAL,
                email: 'client_sub@test.com',
                phone: '0987654321',
                onboardingStatus: 'SUBMITTED',
            }
        })
    } else {
        await prisma.client.update({
            where: { id: clientSub.id },
            data: { onboardingStatus: 'SUBMITTED' }
        })
    }

    // 5. Create Member for Client Submitted
    const memberSubEmail = 'member_sub@test.com'
    const memberSub = await prisma.user.upsert({
        where: { email: memberSubEmail },
        update: {
            password,
            role: 'MEMBER',
            isActive: true,
            clientId: clientSub.id
        },
        create: {
            email: memberSubEmail,
            name: 'Member Submitted',
            password,
            role: 'MEMBER',
            isActive: true,
            clientId: clientSub.id,
        },
    })
    console.log(`Member (Submitted) created: ${memberSubEmail} linked to client ${clientSub.id}`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
