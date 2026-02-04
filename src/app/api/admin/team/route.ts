import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSuperAdmin } from '@/lib/auth'
import { hash } from 'bcryptjs'

// GET: List all team members
export async function GET() {
    try {
        await requireSuperAdmin()

        const users = await prisma.user.findMany({
            where: {
                role: { in: ['SUPER_ADMIN', 'TEAM_MEMBER'] }
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' }
        })

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

        const { name, email, password, role } = await request.json()

        // Validate inputs
        if (!name || !email || !password) {
            return NextResponse.json(
                { error: 'Name, email, and password are required' },
                { status: 400 }
            )
        }

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

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'TEAM_MEMBER',
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
            }
        })

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
