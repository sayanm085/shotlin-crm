import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit'

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string()
        .min(8, 'New password must be at least 8 characters')
        .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Must contain at least one number'),
})

export async function POST(request: NextRequest) {
    try {
        // Rate limit check
        const ip = getClientIp(request)
        const rl = checkRateLimit(`password-change:${ip}`, RATE_LIMITS.PASSWORD_CHANGE)
        if (!rl.success) {
            return NextResponse.json(
                { error: 'Too many attempts. Please wait before trying again.' },
                { status: 429 }
            )
        }

        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        const body = await request.json()

        // Zod Validation
        const validation = changePasswordSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            )
        }

        const { currentPassword, newPassword } = validation.data

        // Get user with password
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, password: true }
        })

        if (!user || !user.password) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.password)
        if (!isValid) {
            return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        // Update password
        await prisma.user.update({
            where: { id: session.user.id },
            data: { password: hashedPassword }
        })

        return NextResponse.json({ success: true, message: 'Password changed successfully' })
    } catch (error) {
        console.error('Error changing password:', error)
        return NextResponse.json({ error: 'Failed to change password' }, { status: 500 })
    }
}
