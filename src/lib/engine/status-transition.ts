/**
 * STATUS TRANSITION VALIDATOR
 * 
 * Validates all status transitions to ensure they follow the allowed paths.
 * Prevents invalid state changes and enforces business rules.
 */

import { Status, Responsibility } from '@prisma/client'

// ============================================
// STATUS TRANSITION RULES
// ============================================

/**
 * Valid status transitions
 * Map of current status -> allowed next statuses
 */
const VALID_TRANSITIONS: Record<Status, Status[]> = {
    NOT_STARTED: ['IN_PROGRESS', 'PENDING_CLIENT', 'BLOCKED'],
    PENDING_CLIENT: ['IN_PROGRESS', 'BLOCKED', 'FAILED'],
    PENDING_VERIFICATION: ['COMPLETED', 'FAILED', 'BLOCKED'],
    IN_PROGRESS: ['COMPLETED', 'PENDING_CLIENT', 'PENDING_VERIFICATION', 'BLOCKED', 'FAILED'],
    COMPLETED: [], // Terminal state - no transitions allowed
    FAILED: ['NOT_STARTED'], // Can restart after failure
    BLOCKED: ['NOT_STARTED', 'IN_PROGRESS', 'PENDING_CLIENT'], // Can unblock
}

export interface TransitionResult {
    valid: boolean
    error?: string
    suggestedStatus?: Status
}

/**
 * Validate a status transition
 */
export function validateTransition(
    currentStatus: Status,
    newStatus: Status
): TransitionResult {
    // Same status is always valid (no-op)
    if (currentStatus === newStatus) {
        return { valid: true }
    }

    const allowedTransitions = VALID_TRANSITIONS[currentStatus]

    if (!allowedTransitions.includes(newStatus)) {
        return {
            valid: false,
            error: `Invalid transition: ${currentStatus} → ${newStatus}. Allowed: ${allowedTransitions.join(', ') || 'none'}`,
        }
    }

    return { valid: true }
}

/**
 * Get responsibility for a status
 */
export function getStatusResponsibility(status: Status): Responsibility | null {
    switch (status) {
        case 'PENDING_CLIENT':
        case 'BLOCKED':
            return 'CLIENT'
        case 'IN_PROGRESS':
        case 'PENDING_VERIFICATION':
        case 'FAILED':
            return 'COMPANY'
        default:
            return null
    }
}

/**
 * Check if status indicates work is blocked
 */
export function isBlockedStatus(status: Status): boolean {
    return status === 'BLOCKED' || status === 'PENDING_CLIENT'
}

/**
 * Check if status is a terminal state
 */
export function isTerminalStatus(status: Status): boolean {
    return status === 'COMPLETED'
}

/**
 * Check if status requires client action
 */
export function requiresClientAction(status: Status): boolean {
    return status === 'PENDING_CLIENT'
}

/**
 * Check if status requires company action
 */
export function requiresCompanyAction(status: Status): boolean {
    return status === 'IN_PROGRESS' || status === 'PENDING_VERIFICATION' || status === 'FAILED'
}

/**
 * Get status display info
 */
export function getStatusInfo(status: Status): {
    label: string
    icon: string
    color: 'gray' | 'yellow' | 'orange' | 'blue' | 'green' | 'red'
} {
    const info: Record<Status, { label: string; icon: string; color: 'gray' | 'yellow' | 'orange' | 'blue' | 'green' | 'red' }> = {
        NOT_STARTED: { label: 'Not Started', icon: '⚪', color: 'gray' },
        PENDING_CLIENT: { label: 'Pending (Client)', icon: '⏳', color: 'yellow' },
        PENDING_VERIFICATION: { label: 'Pending Verification', icon: '🔄', color: 'orange' },
        IN_PROGRESS: { label: 'In Progress', icon: '🔵', color: 'blue' },
        COMPLETED: { label: 'Completed', icon: '✅', color: 'green' },
        FAILED: { label: 'Failed', icon: '❌', color: 'red' },
        BLOCKED: { label: 'Blocked', icon: '🚫', color: 'red' },
    }

    return info[status]
}

/**
 * Calculate overall progress from a list of statuses
 */
export function calculateProgress(statuses: Status[]): {
    percentage: number
    completed: number
    total: number
    blocked: number
} {
    const total = statuses.length
    const completed = statuses.filter(s => s === 'COMPLETED').length
    const blocked = statuses.filter(s => isBlockedStatus(s)).length

    return {
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        completed,
        total,
        blocked,
    }
}
