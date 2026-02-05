'use client'

import { useState, useEffect } from 'react'
import { AdminHeader } from '@/components/admin/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Users,
    Plus,
    Loader2,
    UserCheck,
    UserX,
    Shield,
    User,
    Key,
    Trash2,
    X,
} from 'lucide-react'
import { AdminResetPasswordModal } from '@/components/admin/AdminResetPasswordModal'

interface TeamMember {
    id: string
    name: string | null
    email: string
    role: 'SUPER_ADMIN' | 'TEAM_MEMBER'
    isActive: boolean
    createdAt: string
}

export default function TeamPage() {
    const [team, setTeam] = useState<TeamMember[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    // Form state
    const [newName, setNewName] = useState('')
    const [newEmail, setNewEmail] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [newRole, setNewRole] = useState<'SUPER_ADMIN' | 'TEAM_MEMBER' | 'MEMBER'>('TEAM_MEMBER')

    // Delete confirmation modal state
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
    const [deleteConfirmName, setDeleteConfirmName] = useState<string>('')
    const [deleting, setDeleting] = useState(false)

    // Password Reset Modal State
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
    const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null)
    const [resetPasswordUserName, setResetPasswordUserName] = useState<string>('')

    useEffect(() => {
        fetchTeam()
    }, [])

    const fetchTeam = async () => {
        try {
            const res = await fetch('/api/admin/team')
            if (res.ok) {
                const data = await res.json()
                setTeam(data)
            } else if (res.status === 403) {
                setError('Access denied. Super Admin only.')
            }
        } catch (error) {
            console.error('Error fetching team:', error)
            setError('Failed to load team members')
        } finally {
            setLoading(false)
        }
    }

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError('')

        try {
            const res = await fetch('/api/admin/team', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newName,
                    email: newEmail,
                    password: newPassword,
                    role: newRole,
                }),
            })

            if (res.ok) {
                setShowAddModal(false)
                setNewName('')
                setNewEmail('')
                setNewPassword('')
                setNewRole('TEAM_MEMBER')
                fetchTeam()
            } else {
                const data = await res.json()
                setError(data.error || 'Failed to create team member')
            }
        } catch (error) {
            console.error('Error adding team member:', error)
            setError('Failed to create team member')
        } finally {
            setSaving(false)
        }
    }

    const toggleActive = async (id: string, isActive: boolean) => {
        try {
            const res = await fetch(`/api/admin/team/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !isActive }),
            })

            if (res.ok) {
                fetchTeam()
            } else {
                const data = await res.json()
                setError(data.error || 'Failed to update team member')
            }
        } catch (error) {
            console.error('Error updating team member:', error)
        }
    }

    const openDeleteConfirm = (id: string, name: string) => {
        setDeleteConfirmId(id)
        setDeleteConfirmName(name || 'this user')
    }

    const closeDeleteConfirm = () => {
        setDeleteConfirmId(null)
        setDeleteConfirmName('')
    }

    const confirmDeleteTeamMember = async () => {
        if (!deleteConfirmId) return
        setDeleting(true)

        try {
            const res = await fetch(`/api/admin/team/${deleteConfirmId}`, {
                method: 'DELETE',
            })

            if (res.ok) {
                closeDeleteConfirm()
                fetchTeam()
            } else {
                const data = await res.json()
                setError(data.error || 'Failed to delete team member')
            }
        } catch (error) {
            console.error('Error deleting team member:', error)
            setError('Failed to delete team member')
        } finally {
            setDeleting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <AdminHeader title="Team Management" subtitle="Manage your team members" />

            <main className="p-6 max-w-5xl mx-auto">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                            <Users className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
                            <p className="text-gray-500">{team.length} total members</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setShowAddModal(true)}
                        className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                        <Plus className="h-4 w-4" />
                        Add Team Member
                    </Button>
                </div>

                <div className="grid gap-4">
                    {team.map((member) => (
                        <Card key={member.id} className={`transition-all ${!member.isActive ? 'opacity-60' : ''}`}>
                            <CardContent className="p-4">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${member.role === 'SUPER_ADMIN'
                                            ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                                            : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                                            }`}>
                                            {member.role === 'SUPER_ADMIN' ? (
                                                <Shield className="h-5 w-5 text-white" />
                                            ) : (
                                                <User className="h-5 w-5 text-white" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="font-semibold text-gray-900 truncate">
                                                    {member.name || 'Unnamed User'}
                                                </h3>
                                                <Badge
                                                    variant={member.role === 'SUPER_ADMIN' ? 'default' : 'secondary'}
                                                    className={
                                                        member.role === 'SUPER_ADMIN'
                                                            ? 'bg-purple-100 text-purple-700'
                                                            : 'bg-blue-100 text-blue-700'
                                                    }
                                                >
                                                    {member.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Team Member'}
                                                </Badge>
                                                {!member.isActive && (
                                                    <Badge variant="destructive" className="bg-red-100 text-red-700">
                                                        Inactive
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-gray-500 text-sm truncate">{member.email}</p>
                                            <p className="text-gray-400 text-xs mt-1">
                                                Added {new Date(member.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 self-end md:self-auto">
                                        {member.role !== 'SUPER_ADMIN' ? (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => toggleActive(member.id, member.isActive)}
                                                    className={member.isActive ? 'text-yellow-600 hover:text-yellow-700' : 'text-green-600 hover:text-green-700'}
                                                >
                                                    {member.isActive ? (
                                                        <>
                                                            <UserX className="h-4 w-4 mr-1" />
                                                            <span className="hidden md:inline">Deactivate</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <UserCheck className="h-4 w-4 mr-1" />
                                                            <span className="hidden md:inline">Activate</span>
                                                        </>
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openDeleteConfirm(member.id, member.name || '')}
                                                    className="text-red-600 hover:text-red-700"
                                                    title="Delete team member"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setResetPasswordUserId(member.id)
                                                        setResetPasswordUserName(member.name || 'this user')
                                                        setShowResetPasswordModal(true)
                                                    }}
                                                    className="text-yellow-600 hover:text-yellow-700"
                                                    title="Reset Password"
                                                >
                                                    <Key className="h-4 w-4" />
                                                </Button>
                                            </>
                                        ) : (
                                            <div className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs font-medium flex items-center gap-1 border border-purple-100">
                                                <Shield className="h-3 w-3" />
                                                Protected
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {team.length === 0 && (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                <p className="text-gray-500">No team members yet</p>
                                <Button
                                    onClick={() => setShowAddModal(true)}
                                    className="mt-4"
                                    variant="outline"
                                >
                                    Add your first team member
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Add Member Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <Card className="w-full max-w-md mx-4">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Add Team Member</CardTitle>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowAddModal(false)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleAddMember} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Name
                                        </label>
                                        <Input
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            placeholder="John Doe"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Email
                                        </label>
                                        <Input
                                            type="email"
                                            value={newEmail}
                                            onChange={(e) => setNewEmail(e.target.value)}
                                            placeholder="john@shotlin.com"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Password
                                        </label>
                                        <Input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Role
                                        </label>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setNewRole('TEAM_MEMBER')}
                                                className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${newRole === 'TEAM_MEMBER'
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                Team Member
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setNewRole('MEMBER')}
                                                className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${newRole === 'MEMBER'
                                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                Member
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setNewRole('SUPER_ADMIN')}
                                                className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${newRole === 'SUPER_ADMIN'
                                                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                Super Admin
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 pt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setShowAddModal(false)}
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={saving}
                                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                                        >
                                            {saving ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                'Create Account'
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                )
                }

                {/* Delete Confirmation Modal */}
                {
                    deleteConfirmId && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <Card className="w-full max-w-sm mx-4">
                                <CardHeader>
                                    <CardTitle className="text-red-600 flex items-center gap-2">
                                        <Trash2 className="h-5 w-5" />
                                        Confirm Delete
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-600 mb-6">
                                        Are you sure you want to deactivate <strong>{deleteConfirmName}</strong>?
                                        They will no longer be able to access the system.
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={closeDeleteConfirm}
                                            className="flex-1"
                                            disabled={deleting}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={confirmDeleteTeamMember}
                                            disabled={deleting}
                                            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                        >
                                            {deleting ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                'Delete'
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )
                }

                {/* Password Reset Modal */}
                <AdminResetPasswordModal
                    isOpen={showResetPasswordModal}
                    onClose={() => setShowResetPasswordModal(false)}
                    userId={resetPasswordUserId}
                    userName={resetPasswordUserName}
                    onSuccess={() => {
                        // Optional: Show success toast
                        alert('Password reset successfully')
                    }}
                />
            </main >
        </div >
    )
}
