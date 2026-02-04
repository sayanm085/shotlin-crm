'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    FileUp,
    Eye,
    Bell,
    LogOut,
    HelpCircle,
} from 'lucide-react'

const navigation = [
    { name: 'Overview', href: '/portal', icon: LayoutDashboard },
    { name: 'Upload Documents', href: '/portal/documents', icon: FileUp },
    { name: 'Project Status', href: '/portal/status', icon: Eye },
    { name: 'Notifications', href: '/portal/notifications', icon: Bell },
]

export function ClientSidebar() {
    const pathname = usePathname()

    return (
        <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200">
            {/* Logo */}
            <div className="flex h-16 items-center gap-2 px-6 border-b border-gray-200">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-lg font-bold text-white">S</span>
                </div>
                <div>
                    <h1 className="font-bold text-lg text-gray-900">Client Portal</h1>
                    <p className="text-xs text-gray-500">Shotlin Cloud Ops</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                                isActive
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>

            {/* Footer */}
            <div className="border-t border-gray-200 p-3 space-y-1">
                <Link
                    href="/portal/help"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200"
                >
                    <HelpCircle className="h-5 w-5" />
                    Help & Support
                </Link>
                <button
                    className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                </button>
            </div>
        </aside>
    )
}
