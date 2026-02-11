'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import {
    LayoutDashboard,
    Users,
    UsersRound,
    Settings,
    LogOut,
    Loader2,
    X,
} from 'lucide-react'

const baseNavigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Clients', href: '/admin/clients', icon: Users },
]

interface AdminSidebarProps {
    className?: string
    onClose?: () => void
}

export function AdminSidebar({ className, onClose }: AdminSidebarProps) {
    const pathname = usePathname()
    const { data: session, status } = useSession()

    const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'

    const navigation = isSuperAdmin
        ? [...baseNavigation, { name: 'Team', href: '/admin/team', icon: UsersRound }]
        : baseNavigation

    return (
        <aside className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 bg-zinc-950 text-zinc-300 flex flex-col",
            className
        )}>
            {/* Logo */}
            <div className="flex h-14 items-center justify-between px-5 shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-zinc-800 border border-zinc-700 rounded-md flex items-center justify-center">
                        <span className="text-sm font-semibold text-zinc-200">S</span>
                    </div>
                    <div>
                        <h1 className="font-semibold text-sm text-zinc-100 leading-none">Shotlin</h1>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Cloud Ops 4.5</p>
                    </div>
                </div>
                {onClose && (
                    <button onClick={onClose} className="md:hidden text-zinc-500 hover:text-zinc-300 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            <Separator className="bg-zinc-800" />

            {/* Navigation */}
            <nav className="flex-1 px-3 py-3 space-y-0.5">
                {navigation.map((item) => {
                    const isActive = pathname.startsWith(item.href)
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={onClose}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150',
                                isActive
                                    ? 'bg-zinc-800/80 text-zinc-100 border-l-2 border-indigo-500 pl-[10px]'
                                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>

            <Separator className="bg-zinc-800" />

            {/* User + Footer */}
            <div className="px-3 py-3 space-y-0.5">
                {status === 'loading' ? (
                    <div className="px-3 py-2">
                        <Loader2 className="h-4 w-4 animate-spin text-zinc-600" />
                    </div>
                ) : session?.user ? (
                    <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
                        <div className="w-7 h-7 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center text-xs font-medium text-zinc-300">
                            {(session.user.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-zinc-200 truncate">{session.user.name || 'User'}</p>
                            <p className="text-[10px] text-zinc-500 truncate">{session.user.email}</p>
                        </div>
                    </div>
                ) : null}

                <Link
                    href="/admin/settings"
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 transition-colors duration-150"
                >
                    <Settings className="h-4 w-4" />
                    Settings
                </Link>
                <button
                    onClick={() => {
                        signOut({ callbackUrl: '/login' })
                        if (onClose) onClose()
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-zinc-400 hover:bg-zinc-900 hover:text-red-400 transition-colors duration-150"
                >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </button>
            </div>
        </aside>
    )
}
