/**
 * PAYMENT RELEASE ENGINE
 * 
 * Payment is released ONLY when:
 * - App/Game = PUBLISHED
 * - Website = LIVE + VERIFIED
 * - Milestone explicitly marked COMPLETED
 * 
 * If delay caused by client:
 * - Timeline auto-extends
 * - No refund
 * - No penalty to company
 */

import prisma from '@/lib/prisma'
import { Status } from '@prisma/client'

export interface PaymentEligibilityResult {
    eligible: boolean
    reason: string
    milestoneId?: string
    milestoneName?: string
    amount?: number
    blockedBy?: string[]
}

/**
 * Check if client is eligible for payment release
 */
export async function checkPaymentEligibility(
    clientId: string
): Promise<PaymentEligibilityResult> {
    // Get submission review status
    const submission = await prisma.submissionReview.findUnique({
        where: { clientId },
    })

    // Rule 1: App/Game Published
    if (submission?.published && submission?.liveUrl) {
        return {
            eligible: true,
            reason: 'App successfully published on Play Store',
            milestoneName: 'App Publication',
        }
    }

    // Get website tasks
    const websiteTasks = await prisma.websiteTask.findMany({
        where: { clientId },
    })

    // Rule 2: Website Live + Verified
    if (websiteTasks.length > 0) {
        const allComplete = websiteTasks.every(t => t.status === 'COMPLETED')
        if (allComplete) {
            return {
                eligible: true,
                reason: 'Website live and all tasks verified',
                milestoneName: 'Website Completion',
            }
        } else {
            const incomplete = websiteTasks
                .filter(t => t.status !== 'COMPLETED')
                .map(t => t.taskName)

            // Check if blocked tasks are due to client
            const blockedByClient = websiteTasks.filter(
                t => t.status === 'BLOCKED' || t.status === 'PENDING_CLIENT'
            )

            if (blockedByClient.length > 0) {
                return {
                    eligible: false,
                    reason: 'Website tasks blocked due to pending client action',
                    blockedBy: blockedByClient.map(t => t.taskName),
                }
            }
        }
    }

    // Rule 3: Check explicit milestones
    const milestones = await prisma.paymentMilestone.findMany({
        where: {
            clientId,
            eligibleForPayment: true,
            released: false,
        },
    })

    if (milestones.length > 0) {
        const milestone = milestones[0]
        return {
            eligible: true,
            reason: `Milestone completed: ${milestone.milestoneName}`,
            milestoneId: milestone.id,
            milestoneName: milestone.milestoneName,
            amount: Number(milestone.amount),
        }
    }

    // No conditions met
    return {
        eligible: false,
        reason: 'No payment release conditions met. App not published or milestones incomplete.',
        blockedBy: getBlockingReasons(submission, websiteTasks),
    }
}

/**
 * Get list of blocking reasons
 */
function getBlockingReasons(
    submission: { published: boolean; reviewStatus: Status } | null,
    websiteTasks: { taskName: string; status: Status }[]
): string[] {
    const reasons: string[] = []

    if (!submission?.published) {
        reasons.push('App not yet published')
        if (submission?.reviewStatus === 'PENDING_CLIENT') {
            reasons.push('App review waiting on client action')
        }
    }

    const incompleteWebsite = websiteTasks.filter(t => t.status !== 'COMPLETED')
    if (incompleteWebsite.length > 0) {
        reasons.push(`${incompleteWebsite.length} website task(s) incomplete`)
    }

    return reasons
}

/**
 * Release payment for a milestone
 */
export async function releasePayment(
    milestoneId: string,
    releasedBy: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const milestone = await prisma.paymentMilestone.findUnique({
            where: { id: milestoneId },
            include: { client: true },
        })

        if (!milestone) {
            return { success: false, error: 'Milestone not found' }
        }

        if (!milestone.eligibleForPayment) {
            return { success: false, error: 'Milestone is not eligible for payment' }
        }

        if (milestone.released) {
            return { success: false, error: 'Payment already released' }
        }

        // Update milestone
        await prisma.paymentMilestone.update({
            where: { id: milestoneId },
            data: {
                released: true,
                releasedAt: new Date(),
            },
        })

        // Create audit log
        await prisma.auditLog.create({
            data: {
                clientId: milestone.clientId,
                tableName: 'payment_milestones',
                recordId: milestoneId,
                action: 'PAYMENT_RELEASED',
                oldValue: { released: false },
                newValue: { released: true, releasedAt: new Date() },
                changedBy: releasedBy,
            },
        })

        return { success: true }
    } catch (error) {
        console.error('Payment release error:', error)
        return { success: false, error: 'Failed to release payment' }
    }
}

/**
 * Calculate timeline extension based on client delays
 */
export async function calculateTimelineExtension(
    clientId: string
): Promise<{ daysExtended: number; reasons: string[] }> {
    const auditLogs = await prisma.auditLog.findMany({
        where: {
            clientId,
            action: { in: ['STATUS_CHANGED_TO_PENDING_CLIENT', 'STATUS_CHANGED_TO_BLOCKED'] },
        },
        orderBy: { changedAt: 'asc' },
    })

    // Calculate days where work was blocked due to client
    let daysExtended = 0
    const reasons: string[] = []

    // Group by table and calculate delays
    // This is a simplified calculation - production would track actual blocked periods
    for (const log of auditLogs) {
        daysExtended += 1 // Each blocking event adds at least 1 day
        reasons.push(`${log.tableName} blocked on ${new Date(log.changedAt).toLocaleDateString()}`)
    }

    return { daysExtended, reasons }
}
