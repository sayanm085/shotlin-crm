import { hash } from 'bcryptjs'
import { prisma } from '../src/lib/prisma'

async function main() {
    // Create or update super admin account
    const superAdminEmail = 'admin@shotlin.com'
    const superAdminPassword = 'admin123' // Change this in production!
    const hashedPassword = await hash(superAdminPassword, 12)

    // Use upsert to create or update
    const admin = await prisma.user.upsert({
        where: { email: superAdminEmail },
        update: {
            password: hashedPassword,
            role: 'SUPER_ADMIN',
            isActive: true,
        },
        create: {
            name: 'Super Admin',
            email: superAdminEmail,
            password: hashedPassword,
            role: 'SUPER_ADMIN',
            isActive: true,
        }
    })

    console.log('✅ Super Admin synced successfully!')
    console.log(`   ID: ${admin.id}`)
    console.log(`   Email: ${superAdminEmail}`)
    console.log(`   Password: ${superAdminPassword}`)
    console.log('   ⚠️  Please change the password after first login!')
}

main()
    .catch((e) => {
        console.error('Error seeding database:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

