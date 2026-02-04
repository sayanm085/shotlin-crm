import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null): string {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}

export function formatDateTime(date: Date | string | null): string {
    if (!date) return 'N/A'
    return new Date(date).toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

export function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
        NOT_STARTED: 'bg-gray-100 text-gray-800',
        PENDING_CLIENT: 'bg-yellow-100 text-yellow-800',
        PENDING_VERIFICATION: 'bg-orange-100 text-orange-800',
        IN_PROGRESS: 'bg-blue-100 text-blue-800',
        COMPLETED: 'bg-green-100 text-green-800',
        FAILED: 'bg-red-100 text-red-800',
        BLOCKED: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
}

export function getComplianceStatusColor(status: string): string {
    const colors: Record<string, string> = {
        NOT_CREATED: 'bg-gray-100 text-gray-800',
        PENDING: 'bg-yellow-100 text-yellow-800',
        APPROVED: 'bg-green-100 text-green-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
}

export function getResponsibilityColor(responsibility: string): string {
    return responsibility === 'CLIENT'
        ? 'bg-orange-100 text-orange-800 border-orange-300'
        : 'bg-blue-100 text-blue-800 border-blue-300'
}
