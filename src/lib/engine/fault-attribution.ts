/**
 * FAULT ATTRIBUTION ENGINE
 * 
 * Automatically assigns responsibility for rejections and failures.
 * This creates an immutable audit trail for dispute resolution.
 * 
 * Rules:
 * - Policy/assets/documents issues → CLIENT FAULT
 * - Crash/ANR/technical issues → COMPANY FAULT
 */

import { Responsibility } from '@prisma/client'

// ============================================
// REJECTION PATTERNS
// ============================================

const CLIENT_FAULT_PATTERNS = [
    // Policy violations
    'policy violation',
    'privacy policy',
    'data safety',
    'terms of service',
    'inappropriate content',
    'intellectual property',
    'copyright',
    'trademark',

    // Asset issues
    'asset quality',
    'missing screenshots',
    'screenshot quality',
    'icon quality',
    'feature graphic',
    'incorrect description',
    'description mismatch',

    // Metadata issues
    'metadata issue',
    'metadata violation',
    'app name',
    'title violation',
    'keyword stuffing',

    // Content rating
    'content rating',
    'age rating',
    'target audience',
    'children',
    'families',

    // Legal/compliance
    'legal issue',
    'compliance',
    'government id',
    'identity verification',
    'developer verification',
    'account verification',
]

const COMPANY_FAULT_PATTERNS = [
    // Crashes and errors
    'crash',
    'crashes',
    'anr',
    'not responding',
    'force close',
    'force stop',

    // Technical issues
    'technical issue',
    'functionality',
    'app not working',
    'doesn\'t work',
    'broken',
    'bug',
    'error',

    // Build issues
    'build error',
    'compilation',
    'apk issue',
    'aab issue',
    'signing',

    // Performance
    'performance',
    'slow',
    'unresponsive',
    'memory',
    'battery drain',
]

// ============================================
// FAULT ATTRIBUTION LOGIC
// ============================================

export interface FaultAttributionResult {
    responsibility: Responsibility
    matchedPattern: string | null
    confidence: 'HIGH' | 'MEDIUM' | 'LOW'
    explanation: string
}

/**
 * Analyze rejection reason and assign fault
 */
export function attributeFault(rejectionReason: string): FaultAttributionResult {
    const lowerReason = rejectionReason.toLowerCase()

    // Check for CLIENT fault patterns
    for (const pattern of CLIENT_FAULT_PATTERNS) {
        if (lowerReason.includes(pattern)) {
            return {
                responsibility: 'CLIENT',
                matchedPattern: pattern,
                confidence: 'HIGH',
                explanation: `Rejection reason contains '${pattern}' which indicates client-side issue (policy, assets, or documentation).`,
            }
        }
    }

    // Check for COMPANY fault patterns
    for (const pattern of COMPANY_FAULT_PATTERNS) {
        if (lowerReason.includes(pattern)) {
            return {
                responsibility: 'COMPANY',
                matchedPattern: pattern,
                confidence: 'HIGH',
                explanation: `Rejection reason contains '${pattern}' which indicates technical/development issue.`,
            }
        }
    }

    // If no pattern matched, analyze further
    // Keywords that hint at client responsibility
    const clientHints = ['provide', 'submit', 'upload', 'missing', 'incomplete', 'required']
    const companyHints = ['fix', 'resolve', 'update code', 'debug', 'implement']

    let clientScore = 0
    let companyScore = 0

    for (const hint of clientHints) {
        if (lowerReason.includes(hint)) clientScore++
    }

    for (const hint of companyHints) {
        if (lowerReason.includes(hint)) companyScore++
    }

    if (clientScore > companyScore) {
        return {
            responsibility: 'CLIENT',
            matchedPattern: null,
            confidence: 'MEDIUM',
            explanation: 'Analysis suggests client-related issue based on action keywords.',
        }
    }

    if (companyScore > clientScore) {
        return {
            responsibility: 'COMPANY',
            matchedPattern: null,
            confidence: 'MEDIUM',
            explanation: 'Analysis suggests technical issue based on action keywords.',
        }
    }

    // Default to CLIENT if ambiguous (protects company)
    return {
        responsibility: 'CLIENT',
        matchedPattern: null,
        confidence: 'LOW',
        explanation: 'Unable to determine clear responsibility. Defaulting to CLIENT. Manual review recommended.',
    }
}

/**
 * Get human-readable fault description
 */
export function getFaultDescription(fault: FaultAttributionResult): string {
    const tag = fault.responsibility === 'CLIENT' ? '[CLIENT FAULT]' : '[COMPANY FAULT]'
    const confidence = fault.confidence === 'HIGH' ? '✓' : fault.confidence === 'MEDIUM' ? '~' : '?'

    return `${tag} ${confidence} ${fault.explanation}`
}

/**
 * Determine if timeline should auto-extend based on fault
 */
export function shouldExtendTimeline(fault: Responsibility): boolean {
    // If CLIENT fault, timeline auto-extends, no penalty to company
    return fault === 'CLIENT'
}

/**
 * Determine if refund is applicable based on fault
 */
export function isRefundApplicable(fault: Responsibility): boolean {
    // If CLIENT fault, no refund
    // If COMPANY fault, refund may be applicable
    return fault === 'COMPANY'
}
