import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSuperAdmin, auth } from '@/lib/auth'
import { hash } from 'bcryptjs'
import { z } from 'zod'

// Validation Schema for Updates
const updateTeamMemberSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    email: z.string().email('Invalid email address').optional(),
    password: z.string().min(8, 'Password must be at least 8 characters').optional(),
    role: z.enum(['SUPER_ADMIN', 'TEAM_MEMBER', 'MEMBER']).optional(),
    isActive: z.boolean().optional(),
})

// PUT: Update team member
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await requireSuperAdmin()
        const { id } = await params
        const body = await request.json()

        // Zod Validation
        const validation = updateTeamMemberSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            )
        }

        const { name, email, password, role, isActive } = validation.data

        // Check if target user is Super Admin using Raw SQL
        const targetUsers = await prisma.$queryRaw<any[]>`
            SELECT role FROM "User" WHERE id = ${id} LIMIT 1
        `
        const targetUser = targetUsers[0]

        // Prevent deactivation of Super Admins
        if (targetUser?.role === 'SUPER_ADMIN' && isActive === false) {
            return NextResponse.json(
                { error: 'Cannot deactivate a Super Admin account' },
                { status: 403 }
            )
        }

        // Prevent self-deactivation
        if (id === currentUser.id && isActive === false) {
            return NextResponse.json(
                { error: 'Cannot deactivate your own account' },
                { status: 400 }
            )
        }

        // Build raw SQL update
        // We need to construct the SET clause dynamically
        // Note: Using a raw query for dynamic SET is tricky with tagged templates.
        // We will execute individual updates or use a careful parameterized query if we can.
        // However, standard prisma.$executeRaw supports parameterized queries.
        // Let's do a trick: we construct the template array and values array manually? No, risky.
        // Safer: Since we have few fields, we can use IF checks or just always update what's present if we build the query string carefully?
        // Actually, simpler: just run separate updates or one big update with coalesce?
        // Better: Fetch current state, merge in memory, and update all fields.
        // But password hashing needs to be handled.

        // Fetch full current user
        const currentUsers = await prisma.$queryRaw<any[]>`
            SELECT * FROM "User" WHERE id = ${id} LIMIT 1
        `
        if (!currentUsers.length) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }
        const current = currentUsers[0]

        const newName = name ?? current.name
        const newEmail = email ?? current.email
        const newRole = role ?? current.role
        const newIsActive = isActive ?? current.isActive
        let newPassword = current.password
        if (password) {
            newPassword = await hash(password, 12)
        }
        const now = new Date()

        await prisma.$executeRaw`
            UPDATE "User"
            SET name = ${newName}, 
                email = ${newEmail}, 
                role = CAST(${newRole} AS "UserRole"), 
                "isActive" = ${newIsActive}, 
                password = ${newPassword},
                "updatedAt" = ${now}
            WHERE id = ${id}
        `

        const updatedUser = {
            id,
            name: newName,
            email: newEmail,
            role: newRole,
            isActive: newIsActive,
            createdAt: current.createdAt // Keep original
        }

        return NextResponse.json(updatedUser)
    } catch (error) {
        if (error instanceof Error && error.message.includes('Forbidden')) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }
        if (error instanceof Error && error.message.includes('Unauthorized')) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }
        console.error('Error updating team member:', error)
        return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 })
    }
}

// DELETE: Deactivate team member (soft delete)
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await requireSuperAdmin()
        const { id } = await params

        // Check if target user is a Super Admin using Raw SQL
        const targetUsers = await prisma.$queryRaw<any[]>`
            SELECT role FROM "User" WHERE id = ${id} LIMIT 1
        `
        const targetUser = targetUsers[0]

        if (targetUser?.role === 'SUPER_ADMIN') {
            return NextResponse.json(
                { error: 'Cannot delete a Super Admin account' },
                { status: 403 }
            )
        }

        // Prevent self-deletion (redundant but safe)
        if (id === currentUser.id) {
            return NextResponse.json(
                { error: 'Cannot delete your own account' },
                { status: 400 }
            )
        }

        // Hard delete - actually remove the user
        await prisma.$executeRaw`
            DELETE FROM "User" WHERE id = ${id}
        `

        return NextResponse.json({ success: true })
    } catch (error) {
        if (error instanceof Error && error.message.includes('Forbidden')) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }
        if (error instanceof Error && error.message.includes('Unauthorized')) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }
        console.error('Error deleting team member:', error)
        return NextResponse.json({ error: 'Failed to delete team member' }, { status: 500 })
    }
}
