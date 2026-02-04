import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSuperAdmin, auth } from '@/lib/auth'
import { hash } from 'bcryptjs'

// PUT: Update team member
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await requireSuperAdmin()
        const { id } = await params
        const { name, email, password, role, isActive } = await request.json()

        // Check if target user is Super Admin
        const targetUser = await prisma.user.findUnique({
            where: { id },
            select: { role: true }
        })

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

        const updateData: Record<string, unknown> = {}
        if (name !== undefined) updateData.name = name
        if (email !== undefined) updateData.email = email
        if (role !== undefined) updateData.role = role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'TEAM_MEMBER'
        if (isActive !== undefined) updateData.isActive = isActive
        if (password) updateData.password = await hash(password, 12)

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
            }
        })

        return NextResponse.json(user)
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

        // Check if target user is a Super Admin
        const targetUser = await prisma.user.findUnique({
            where: { id },
            select: { role: true }
        })

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
        await prisma.user.delete({
            where: { id }
        })

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
