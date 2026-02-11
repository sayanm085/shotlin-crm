'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Bell, Search, Key, LogOut, Menu } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { ChangePasswordModal } from './ChangePasswordModal'
import { AdminSidebar } from './sidebar'

interface AdminHeaderProps {
    title: string
    subtitle?: string
}

export function AdminHeader({ title, subtitle }: AdminHeaderProps) {
    const { data: session } = useSession()
    const [showPasswordModal, setShowPasswordModal] = useState(false)
    const [showMobileSidebar, setShowMobileSidebar] = useState(false)

    const userName = session?.user?.name || 'User'
    const userRole = session?.user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Team Member'

    return (
        <>
            <header className="h-14 bg-white border-b border-zinc-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-40">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowMobileSidebar(true)}
                        className="md:hidden h-8 w-8 text-zinc-500"
                    >
                        <Menu className="h-4 w-4" />
                    </Button>

                    <h1 className="text-lg font-semibold text-zinc-900">{title}</h1>
                </div>

                <div className="flex items-center gap-1">
                    {/* Search */}
                    <div className="relative w-56 hidden md:block mr-2">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                        <Input
                            placeholder="Search..."
                            className="pl-8 h-8 text-sm bg-zinc-50 border-zinc-200 focus:bg-white"
                        />
                    </div>

                    <Separator orientation="vertical" className="h-6 mx-1 hidden md:block" />

                    {/* Notifications */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 relative">
                                <Bell className="h-4 w-4" />
                                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Notifications</TooltipContent>
                    </Tooltip>

                    {/* User Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 gap-2 px-2 text-zinc-600 hover:text-zinc-900">
                                <div className="w-6 h-6 bg-zinc-200 rounded-full flex items-center justify-center text-xs font-medium text-zinc-700">
                                    {userName.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium hidden md:block">{userName}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel className="font-normal">
                                <p className="text-sm font-medium">{userName}</p>
                                <p className="text-xs text-muted-foreground">{userRole}</p>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setShowPasswordModal(true)}>
                                <Key className="h-3.5 w-3.5 mr-2" />
                                Change Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => signOut({ callbackUrl: '/login' })}
                                className="text-red-600 focus:text-red-600"
                            >
                                <LogOut className="h-3.5 w-3.5 mr-2" />
                                Sign Out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            {/* Mobile Sidebar Overlay */}
            {showMobileSidebar && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setShowMobileSidebar(false)}
                    />
                    <AdminSidebar
                        className="w-64 h-full"
                        onClose={() => setShowMobileSidebar(false)}
                    />
                </div>
            )}

            <ChangePasswordModal
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
            />
        </>
    )
}
