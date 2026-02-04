/**
 * DEPENDENCY CHECKER ENGINE
 * 
 * This module enforces the core law:
 * NO CHECKMARK = NO WORK = NO PAYMENT RESPONSIBILITY
 * 
 * All dependencies must be satisfied before a task can proceed.
 * If blocked, responsibility is assigned and stored.
 */

import { ComplianceStatus, Status, Responsibility } from '@prisma/client'

// Types for dependency checking
export interface ComplianceState {
    msmeStatus: ComplianceStatus
    dunsStatus: ComplianceStatus
}

export interface PlayConsoleState {
    accountCreated: boolean
    identityVerificationStatus: Status
    companyVerificationStatus: Status
    paymentProfileStatus: Status
    consoleReady: boolean
}

export interface DependencyCheckResult {
    canProceed: boolean
    blockedReason: string | null
    responsibility: Responsibility | null
    missingDependencies: string[]
}

// ============================================
// DEPENDENCY RULES
// ============================================

/**
 * Check if Play Console work can proceed
 * Requires: MSME or D-U-N-S approved
 */
export function checkPlayConsoleDependencies(
    compliance: ComplianceState | null
): DependencyCheckResult {
    if (!compliance) {
        return {
            canProceed: false,
            blockedReason: 'Compliance documents not initialized',
            responsibility: 'CLIENT',
            missingDependencies: ['compliance_documents'],
        }
    }

    const msmeApproved = compliance.msmeStatus === 'APPROVED'
    const dunsApproved = compliance.dunsStatus === 'APPROVED'

    if (!msmeApproved && !dunsApproved) {
        const missing: string[] = []
        if (compliance.msmeStatus !== 'APPROVED') missing.push('MSME Approval')
        if (compliance.dunsStatus !== 'APPROVED') missing.push('D-U-N-S Approval')

        return {
            canProceed: false,
            blockedReason: 'MSME or D-U-N-S verification required before Play Console work',
            responsibility: 'CLIENT',
            missingDependencies: missing,
        }
    }

    return {
        canProceed: true,
        blockedReason: null,
        responsibility: null,
        missingDependencies: [],
    }
}

/**
 * Check if App Development can proceed
 * Requires: Play Console ready
 */
export function checkAppDevelopmentDependencies(
    playConsole: PlayConsoleState | null
): DependencyCheckResult {
    if (!playConsole) {
        return {
            canProceed: false,
            blockedReason: 'Play Console status not initialized',
            responsibility: 'CLIENT',
            missingDependencies: ['play_console_status'],
        }
    }

    if (!playConsole.consoleReady) {
        const missing: string[] = []

        if (!playConsole.accountCreated) {
            missing.push('Play Console Account Creation')
        }
        if (playConsole.identityVerificationStatus !== 'COMPLETED') {
            missing.push('Identity Verification')
        }
        if (playConsole.companyVerificationStatus !== 'COMPLETED') {
            missing.push('Company Verification')
        }
        if (playConsole.paymentProfileStatus !== 'COMPLETED') {
            missing.push('Payment Profile Setup')
        }

        return {
            canProceed: false,
            blockedReason: 'Play Console verification incomplete. App development blocked.',
            responsibility: 'CLIENT',
            missingDependencies: missing,
        }
    }

    return {
        canProceed: true,
        blockedReason: null,
        responsibility: null,
        missingDependencies: [],
    }
}

/**
 * Check if AAB Build generation can proceed
 * Requires: Console ready + All compliance approved
 */
export function checkBuildDependencies(
    compliance: ComplianceState | null,
    playConsole: PlayConsoleState | null
): DependencyCheckResult {
    const complianceCheck = checkPlayConsoleDependencies(compliance)
    const consoleCheck = checkAppDevelopmentDependencies(playConsole)

    const allMissing = [
        ...complianceCheck.missingDependencies,
        ...consoleCheck.missingDependencies,
    ]

    if (!complianceCheck.canProceed || !consoleCheck.canProceed) {
        return {
            canProceed: false,
            blockedReason: 'Cannot generate AAB build without verified console and compliance documents',
            responsibility: 'CLIENT',
            missingDependencies: allMissing,
        }
    }

    return {
        canProceed: true,
        blockedReason: null,
        responsibility: null,
        missingDependencies: [],
    }
}

/**
 * Check if App Submission can proceed
 * Requires: All mandatory assets complete + Client approval
 */
export interface AssetState {
    assetType: string
    status: Status
}

export function checkSubmissionDependencies(
    assets: AssetState[],
    clientApproval: boolean
): DependencyCheckResult {
    const mandatoryAssets = [
        'ICON',
        'SHORT_DESCRIPTION',
        'LONG_DESCRIPTION',
        'FEATURE_GRAPHIC',
        'SCREENSHOT',
    ]

    const missing: string[] = []

    for (const required of mandatoryAssets) {
        const asset = assets.find(a => a.assetType === required)
        if (!asset || asset.status !== 'COMPLETED') {
            missing.push(`${required.replace('_', ' ')}`)
        }
    }

    // Check screenshot count (need at least 6)
    const screenshots = assets.filter(a => a.assetType === 'SCREENSHOT' && a.status === 'COMPLETED')
    if (screenshots.length < 6) {
        missing.push(`Screenshots (${screenshots.length}/6 minimum)`)
    }

    if (!clientApproval) {
        missing.push('Client Final Approval')
    }

    if (missing.length > 0) {
        return {
            canProceed: false,
            blockedReason: 'Missing mandatory assets or client approval',
            responsibility: 'CLIENT',
            missingDependencies: missing,
        }
    }

    return {
        canProceed: true,
        blockedReason: null,
        responsibility: null,
        missingDependencies: [],
    }
}

/**
 * Check if SEO/Indexing work can proceed
 * Requires: Google Search Console verification completed
 */
export function checkSEODependencies(
    searchConsoleVerified: boolean
): DependencyCheckResult {
    if (!searchConsoleVerified) {
        return {
            canProceed: false,
            blockedReason: 'Google Search Console verification pending',
            responsibility: 'CLIENT',
            missingDependencies: ['Search Console Verification'],
        }
    }

    return {
        canProceed: true,
        blockedReason: null,
        responsibility: null,
        missingDependencies: [],
    }
}

/**
 * Check if Upload to Play Store can proceed
 * Requires: Identity + Company verification completed
 */
export function checkUploadDependencies(
    playConsole: PlayConsoleState | null
): DependencyCheckResult {
    if (!playConsole) {
        return {
            canProceed: false,
            blockedReason: 'Play Console status not initialized',
            responsibility: 'CLIENT',
            missingDependencies: ['play_console_status'],
        }
    }

    const missing: string[] = []

    if (playConsole.identityVerificationStatus !== 'COMPLETED') {
        missing.push('Identity Verification')
    }
    if (playConsole.companyVerificationStatus !== 'COMPLETED') {
        missing.push('Company Verification')
    }

    if (missing.length > 0) {
        return {
            canProceed: false,
            blockedReason: 'Play Console verification pending. Upload is FORBIDDEN.',
            responsibility: 'CLIENT',
            missingDependencies: missing,
        }
    }

    return {
        canProceed: true,
        blockedReason: null,
        responsibility: null,
        missingDependencies: [],
    }
}
