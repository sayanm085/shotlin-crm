'use client'

import { cn } from '@/lib/utils'

interface ProgressRingProps {
    percentage: number
    size?: number
    strokeWidth?: number
    className?: string
}

export function ProgressRing({
    percentage,
    size = 120,
    strokeWidth = 10,
    className
}: ProgressRingProps) {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (percentage / 100) * circumference

    const getColor = () => {
        if (percentage >= 80) return { stroke: '#22c55e', bg: '#dcfce7' } // Green
        if (percentage >= 50) return { stroke: '#3b82f6', bg: '#dbeafe' } // Blue
        if (percentage >= 25) return { stroke: '#f59e0b', bg: '#fef3c7' } // Yellow
        return { stroke: '#ef4444', bg: '#fee2e2' } // Red
    }

    const colors = getColor()

    return (
        <div className={cn("relative inline-flex items-center justify-center", className)}>
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={colors.bg}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={colors.stroke}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-500 ease-out"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">{percentage}%</span>
            </div>
        </div>
    )
}

interface ProgressBarProps {
    completed: number
    total: number
    blocked?: number
    showLabel?: boolean
    className?: string
}

export function ProgressBar({
    completed,
    total,
    blocked = 0,
    showLabel = true,
    className
}: ProgressBarProps) {
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
    const blockedPercentage = total > 0 ? Math.round((blocked / total) * 100) : 0

    return (
        <div className={cn("w-full", className)}>
            {showLabel && (
                <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">
                        {completed}/{total} {blocked > 0 && <span className="text-red-500">({blocked} blocked)</span>}
                    </span>
                </div>
            )}
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full flex">
                    <div
                        className="bg-green-500 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                    />
                    {blockedPercentage > 0 && (
                        <div
                            className="bg-red-500 transition-all duration-500"
                            style={{ width: `${blockedPercentage}%` }}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}
