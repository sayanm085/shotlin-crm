
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pkg from 'pg'
const { Pool } = pkg

const connectionString = process.env.DATABASE_URL || 'postgresql://shotlin:shotlin_secure_2026@localhost:5432/shotlin_crm'
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('Checking Users...');
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users.`);
    users.forEach(u => console.log(`- ${u.email} (${u.role}) ID: ${u.id}`));

    if (users.length === 0) {
        console.log('No users found. Creating Admin...');
        await prisma.user.create({
            data: {
                name: 'Admin',
                email: 'admin@shotlin.com',
                password: 'password123', // In real app should be hashed, but for dev/debug
                role: 'SUPER_ADMIN',
                isActive: true
            }
        });
        console.log('Admin created.');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
