'use client'

import { Status } from '@prisma/client'
import { Badge } from '@/components/ui/badge'
import { getStatusInfo } from '@/lib/engine/status-transition'

interface StatusBadgeProps {
    status: Status
    showIcon?: boolean
    size?: 'sm' | 'default' | 'lg'
}

export function StatusBadge({ status, showIcon = true, size = 'default' }: StatusBadgeProps) {
    const info = getStatusInfo(status)

    const sizeClasses = {
        sm: 'text-xs px-2 py-0.5',
        default: 'text-xs px-2.5 py-0.5',
        lg: 'text-sm px-3 py-1',
    }

    const variant = status.toLowerCase().replace(' ', '_') as
        'not_started' | 'pending_client' | 'pending_verification' | 'in_progress' | 'completed' | 'failed' | 'blocked'

    return (
        <Badge variant={variant} className={sizeClasses[size]}>
            {showIcon && <span className="mr-1">{info.icon}</span>}
            {info.label}
        </Badge>
    )
}
