import { UserRole, OnboardingStatus, CompanyType } from '@prisma/client';
import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. Ensure Admin
    const adminEmail = 'admin@test.com';
    let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!admin) {
        admin = await prisma.user.create({
            data: {
                email: adminEmail,
                password: hashedPassword,
                role: UserRole.SUPER_ADMIN,
                name: 'Admin User',
            },
        });
        console.log(`Created admin: ${adminEmail}`);
    } else {
        // Ensure role is correct
        if (admin.role !== UserRole.SUPER_ADMIN) {
            await prisma.user.update({ where: { id: admin.id }, data: { role: UserRole.SUPER_ADMIN } });
            console.log(`Updated admin role: ${adminEmail}`);
        }
        console.log(`Admin exists: ${adminEmail}`);
    }

    // 2. Ensure Member
    const memberEmail = 'member@test.com';
    let member = await prisma.user.findUnique({ where: { email: memberEmail } });
    if (!member) {
        member = await prisma.user.create({
            data: {
                email: memberEmail,
                password: hashedPassword,
                role: UserRole.MEMBER,
                name: 'Member User',
            },
        });
        console.log(`Created member: ${memberEmail}`);
    } else {
        if (member.role !== UserRole.MEMBER) {
            await prisma.user.update({ where: { id: member.id }, data: { role: UserRole.MEMBER } });
            console.log(`Updated member role: ${memberEmail}`);
        }
        console.log(`Member exists: ${memberEmail}`);
    }

    // 3. Ensure Draft Client for Member
    let client = await prisma.client.findFirst({
        where: { email: memberEmail },
    });

    if (!client) {
        client = await prisma.client.create({
            data: {
                legalName: 'Draft Client Ltd',
                panNumber: 'ABCDE1234F',
                companyType: CompanyType.PVT_LTD,
                email: memberEmail,
                onboardingStatus: OnboardingStatus.DRAFT,
                createdById: member.id,
            }
        });
        console.log(`Created Draft Client for ${memberEmail}`);
    } else {
        // Reset to DRAFT
        await prisma.client.update({
            where: { id: client.id },
            data: { onboardingStatus: OnboardingStatus.DRAFT }
        });
        console.log(`Reset Client to DRAFT for ${memberEmail}`);
    }

    // Link client to user
    if (!member.clientId || member.clientId !== client.id) {
        await prisma.user.update({
            where: { id: member.id },
            data: { clientId: client.id }
        });
        console.log(`Linked client to user ${memberEmail}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
