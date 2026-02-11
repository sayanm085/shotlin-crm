import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSuperAdmin } from '@/lib/auth'

// PATCH: Reassign client to different team member (Super Admin only)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireSuperAdmin()
        const { id } = await params
        const body = await request.json()
        const { assignedToId } = body

        // Validate new assignee exists and is a team member
        if (assignedToId) {
            const newAssignee = await prisma.user.findUnique({
                where: { id: assignedToId },
                select: { id: true, role: true, isActive: true }
            })

            if (!newAssignee) {
                return NextResponse.json(
                    { error: 'Team member not found' },
                    { status: 404 }
                )
            }

            if (!newAssignee.isActive) {
                return NextResponse.json(
                    { error: 'Cannot assign to inactive team member' },
                    { status: 400 }
                )
            }
        }

        // Update client assignment
        const updatedClient = await prisma.client.update({
            where: { id },
            data: { createdById: assignedToId || null },
            include: {
                createdBy: { select: { id: true, name: true } }
            }
        })

        return NextResponse.json({
            success: true,
            client: {
                id: updatedClient.id,
                createdById: updatedClient.createdById,
                createdByName: updatedClient.createdBy?.name || null
            }
        })
    } catch (error) {
        if (error instanceof Error && error.message.includes('Forbidden')) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }
        if (error instanceof Error && error.message.includes('Unauthorized')) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }
        console.error('Error reassigning client:', error)
        return NextResponse.json(
            { error: 'Failed to reassign client' },
            { status: 500 }
        )
    }
}
