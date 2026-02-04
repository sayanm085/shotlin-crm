'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Bell, Search, User, Key, LogOut, ChevronDown, Menu } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ChangePasswordModal } from './ChangePasswordModal'
import { signOut } from 'next-auth/react'
import { AdminSidebar } from './sidebar'

interface AdminHeaderProps {
    title: string
    subtitle?: string
}

export function AdminHeader({ title, subtitle }: AdminHeaderProps) {
    const { data: session } = useSession()
    const [showDropdown, setShowDropdown] = useState(false)
    const [showPasswordModal, setShowPasswordModal] = useState(false)
    const [showMobileSidebar, setShowMobileSidebar] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const userName = session?.user?.name || 'User'
    const userRole = session?.user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Team Member'

    return (
        <>
            <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-40">
                <div className="flex items-center gap-3">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setShowMobileSidebar(true)}
                        className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    <div>
                        <h1 className="text-xl font-semibold text-gray-900 line-clamp-1">{title}</h1>
                        {subtitle && <p className="text-sm text-gray-500 hidden md:block">{subtitle}</p>}
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    {/* Search - Hidden on mobile, valid tradeoff or use icon */}
                    <div className="relative w-64 hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search clients..."
                            className="pl-9 h-9"
                        />
                    </div>

                    {/* Notifications */}
                    <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Bell className="h-5 w-5 text-gray-600" />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                    </button>

                    {/* User Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-sm font-medium text-gray-700 hidden md:block">{userName}</span>
                            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform hidden md:block ${showDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        {showDropdown && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                {/* User Info */}
                                <div className="px-4 py-3 border-b border-gray-100">
                                    <p className="text-sm font-semibold text-gray-900">{userName}</p>
                                    <p className="text-xs text-gray-500">{userRole}</p>
                                </div>

                                {/* Menu Items */}
                                <div className="py-1">
                                    <button
                                        onClick={() => {
                                            setShowDropdown(false)
                                            setShowPasswordModal(true)
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        <Key className="h-4 w-4 text-gray-400" />
                                        Change Password
                                    </button>
                                    <button
                                        onClick={() => signOut({ callbackUrl: '/login' })}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Mobile Sidebar Overlay */}
            {showMobileSidebar && (
                <div className="fixed inset-0 z-50 md:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setShowMobileSidebar(false)}
                    />
                    {/* Sidebar */}
                    <AdminSidebar
                        className="w-64 h-full shadow-2xl animate-in slide-in-from-left duration-200"
                        onClose={() => setShowMobileSidebar(false)}
                    />
                </div>
            )}

            {/* Change Password Modal */}
            <ChangePasswordModal
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
            />
        </>
    )
}
