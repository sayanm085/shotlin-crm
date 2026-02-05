import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSuperAdmin } from '@/lib/auth'
import { hash } from 'bcryptjs'
import { z } from 'zod'

// Validation Schema
const createTeamMemberSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['SUPER_ADMIN', 'TEAM_MEMBER', 'MEMBER']).default('TEAM_MEMBER'),
})

// GET: List all team members
export async function GET() {
    try {
        await requireSuperAdmin()

        // Using raw query to bypass stale Prisma client validation (UserRole enum issue)
        const users = await prisma.$queryRaw`
            SELECT id, name, email, role, "isActive", "createdAt" 
            FROM "User" 
            WHERE role IN ('SUPER_ADMIN', 'TEAM_MEMBER', 'MEMBER')
            ORDER BY "createdAt" DESC
        `

        return NextResponse.json(users)
    } catch (error) {
        if (error instanceof Error && error.message.includes('Forbidden')) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }
        if (error instanceof Error && error.message.includes('Unauthorized')) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }
        console.error('Error fetching team:', error)
        return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 })
    }
}

// POST: Create new team member
export async function POST(request: Request) {
    try {
        await requireSuperAdmin()

        const body = await request.json()

        // Zod Validation
        const validation = createTeamMemberSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            )
        }

        const { name, email, password, role } = validation.data

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return NextResponse.json(
                { error: 'Email already exists' },
                { status: 400 }
            )
        }

        // Hash password
        const hashedPassword = await hash(password, 12)
        const now = new Date()

        // Use crypto.randomUUID() which is available in Node 19+ and Next.js
        const id = crypto.randomUUID()

        // Create user using Raw SQL to bypass Prisma validation
        // We cast role to "UserRole" enum type in Postgres
        await prisma.$executeRaw`
            INSERT INTO "User" (id, name, email, password, role, "isActive", "createdAt", "updatedAt")
            VALUES (${id}, ${name}, ${email}, ${hashedPassword}, CAST(${role} AS "UserRole"), true, ${now}, ${now})
        `

        // Construct the user object to return
        const user = {
            id,
            name,
            email,
            role,
            isActive: true,
            createdAt: now
        }

        return NextResponse.json(user, { status: 201 })
    } catch (error) {
        if (error instanceof Error && error.message.includes('Forbidden')) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }
        if (error instanceof Error && error.message.includes('Unauthorized')) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }
        console.error('Error creating team member:', error)
        return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 })
    }
}
