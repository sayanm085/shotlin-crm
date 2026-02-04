'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    Users,
    UsersRound,
    Settings,
    LogOut,
    Shield,
    User,
    Loader2,
} from 'lucide-react'

const baseNavigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Clients', href: '/admin/clients', icon: Users },
]

export function AdminSidebar() {
    const pathname = usePathname()
    const { data: session, status } = useSession()

    const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'

    // Add Team link for super admins
    const navigation = isSuperAdmin
        ? [...baseNavigation, { name: 'Team', href: '/admin/team', icon: UsersRound }]
        : baseNavigation

    const handleSignOut = async () => {
        await signOut({ callbackUrl: '/login' })
    }

    return (
        <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white">
            {/* Logo */}
            <div className="flex h-16 items-center gap-2 px-6 border-b border-gray-700">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-lg font-bold">S</span>
                </div>
                <div>
                    <h1 className="font-bold text-lg">Shotlin</h1>
                    <p className="text-xs text-gray-400">Cloud Ops 4.5</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {navigation.map((item) => {
                    const isActive = pathname.startsWith(item.href)
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                                isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>

            {/* User Info */}
            {status === 'loading' ? (
                <div className="px-6 py-4 border-t border-gray-700">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
            ) : session?.user ? (
                <div className="px-3 py-4 border-t border-gray-700">
                    <div className="flex items-center gap-3 px-3 py-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isSuperAdmin
                                ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                                : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                            }`}>
                            {isSuperAdmin ? (
                                <Shield className="h-4 w-4 text-white" />
                            ) : (
                                <User className="h-4 w-4 text-white" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{session.user.name || 'User'}</p>
                            <p className="text-xs text-gray-400 truncate">{session.user.email}</p>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Footer */}
            <div className="border-t border-gray-700 p-3 space-y-1">
                <Link
                    href="/admin/settings"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200"
                >
                    <Settings className="h-5 w-5" />
                    Settings
                </Link>
                <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-red-600/20 hover:text-red-400 transition-all duration-200"
                >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                </button>
            </div>
        </aside>
    )
}

