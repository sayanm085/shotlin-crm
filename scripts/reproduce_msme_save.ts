
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pkg from 'pg'
const { Pool } = pkg

const connectionString = process.env.DATABASE_URL || 'postgresql://shotlin:shotlin_secure_2026@localhost:5432/shotlin_crm'
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('--- Starting MSME Save Reproduction (Adapter) ---');

    // 1. Create a Test Client
    const testEmail = `test-msme-${Date.now()}@shotlin.com`;
    console.log(`Creating test client: ${testEmail}`);

    try {
        const client = await prisma.client.create({
            data: {
                legalName: "Test MSME Client",
                panNumber: `ABCDE${Math.floor(1000 + Math.random() * 9000)}F`,
                companyType: "INDIVIDUAL",
                email: testEmail,
                complianceDocuments: {
                    create: {
                        msmeStatus: 'NOT_CREATED',
                        dunsStatus: 'NOT_CREATED',
                    },
                },
            },
            include: {
                complianceDocuments: true
            }
        });

        console.log(`Client Created: ${client.id}`);

        // 2. Simulate the PUT Request
        const numberToSave = 'UDYAM-MH-00-TESTNUM';
        console.log('Attempting to update MSME Status...');

        const updated = await prisma.complianceDocument.update({
            where: { clientId: client.id },
            data: {
                msmeStatus: 'APPROVED',
                msmeDocumentUrl: null,
                msmeRegistrationNumber: numberToSave,
                lastVerifiedAt: new Date(),
            },
        });

        console.log('Update Success!');

        // Verify persistence
        if (updated.msmeRegistrationNumber === numberToSave) {
            console.log('VERIFICATION PASSED: Number was saved correctly.');
        } else {
            console.error('VERIFICATION FAILED: Number mismatch.');
        }

        // Cleanup
        await prisma.client.delete({ where: { id: client.id } });
        console.log('Test Client Cleaned up.');

    } catch (error) {
        console.error('VERIFICATION CRASHED:', error);
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
