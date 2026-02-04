'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { AdminHeader } from '@/components/admin/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChangePasswordModal } from '@/components/admin/ChangePasswordModal'
import {
    User,
    Mail,
    Shield,
    Key,
    Building,
    Info,
    Loader2,
} from 'lucide-react'

export default function SettingsPage() {
    const { data: session, status } = useSession()
    const [showPasswordModal, setShowPasswordModal] = useState(false)

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        )
    }

    const user = session?.user
    const isAdmin = user?.role === 'SUPER_ADMIN'

    return (
        <div className="min-h-screen">
            <AdminHeader title="Settings" subtitle="Manage your account and preferences" />

            {/* Profile Section */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-600" />
                        Profile Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row items-start gap-6">
                        {/* Avatar */}
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 mx-auto md:mx-0">
                            <span className="text-3xl font-bold text-white">
                                {user?.name?.charAt(0) || 'U'}
                            </span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-gray-500 flex items-center gap-1">
                                    <User className="h-3.5 w-3.5" /> Name
                                </label>
                                <p className="font-medium text-gray-900 break-all">{user?.name || 'Not set'}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500 flex items-center gap-1">
                                    <Mail className="h-3.5 w-3.5" /> Email
                                </label>
                                <p className="font-medium text-gray-900 break-all">{user?.email || 'Not set'}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500 flex items-center gap-1">
                                    <Shield className="h-3.5 w-3.5" /> Role
                                </label>
                                <p className="font-medium text-gray-900">
                                    {isAdmin ? 'Super Admin' : 'Team Member'}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Security Section */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5 text-purple-600" />
                        Security
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-gray-50 rounded-xl gap-4">
                        <div>
                            <p className="font-medium text-gray-900">Password</p>
                            <p className="text-sm text-gray-500">
                                Change your account password
                            </p>
                        </div>
                        <Button
                            onClick={() => setShowPasswordModal(true)}
                            className="gap-2 w-full md:w-auto"
                        >
                            <Key className="h-4 w-4" />
                            Change Password
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* App Info Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5 text-gray-600" />
                        Application Info
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-2 mb-1">
                                <Building className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-500">Application</span>
                            </div>
                            <p className="font-medium text-gray-900">Shotlin Cloud Ops</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-2 mb-1">
                                <Info className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-500">Version</span>
                            </div>
                            <p className="font-medium text-gray-900">4.5</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Change Password Modal */}
            <ChangePasswordModal
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
            />
        </div>
    )
}
