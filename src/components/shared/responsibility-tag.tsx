'use client'

import { Responsibility } from '@prisma/client'
import { Badge } from '@/components/ui/badge'

interface ResponsibilityTagProps {
    responsibility: Responsibility
    showLabel?: boolean
}

export function ResponsibilityTag({ responsibility, showLabel = true }: ResponsibilityTagProps) {
    const isClient = responsibility === 'CLIENT'

    return (
        <Badge variant={isClient ? 'client' : 'company'} className="font-bold">
            {isClient ? '⚠️' : '🔧'} {showLabel && (isClient ? 'CLIENT FAULT' : 'COMPANY FAULT')}
        </Badge>
    )
}

interface BlockedIndicatorProps {
    reason: string
    responsibility: Responsibility
    missingItems?: string[]
}

export function BlockedIndicator({ reason, responsibility, missingItems }: BlockedIndicatorProps) {
    return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                    <span className="text-2xl">🚫</span>
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-red-800">BLOCKED</h4>
                        <ResponsibilityTag responsibility={responsibility} />
                    </div>
                    <p className="text-sm text-red-700">{reason}</p>

                    {missingItems && missingItems.length > 0 && (
                        <div className="mt-3">
                            <p className="text-xs font-medium text-red-800 mb-1">Missing Dependencies:</p>
                            <ul className="text-xs text-red-600 list-disc list-inside">
                                {missingItems.map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
