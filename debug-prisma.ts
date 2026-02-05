
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL || 'postgresql://shotlin:shotlin_secure_2026@localhost:5432/shotlin_crm'
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    try {
        console.log('Ensuring Admin exists...')
        const hashedPassword = await hash('admin1234', 12)
        const admin = await prisma.user.upsert({
            where: { email: 'admin@shotlin.com' },
            update: {
                role: 'SUPER_ADMIN',
                isActive: true,
                // Only update password if you want to force reset it
                password: hashedPassword
            },
            create: {
                email: 'admin@shotlin.com',
                name: 'Super Admin',
                password: hashedPassword,
                role: 'SUPER_ADMIN',
                isActive: true,
            },
        })
        console.log('Admin user ensured:', admin.email)

        console.log('Attempting to create Member user...')
        const member = await prisma.user.upsert({
            where: { email: 'debug@test.com' },
            update: { role: 'MEMBER', isActive: true },
            create: {
                name: 'Debug Member',
                email: 'debug@test.com',
                password: await hash('password123', 12),
                role: 'MEMBER',
                isActive: true,
            },
        })
        console.log('Member user created successfully:', member)

    } catch (e) {
        console.error('Error in debug script:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
