'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Key, AlertTriangle } from 'lucide-react'

interface AdminResetPasswordModalProps {
    isOpen: boolean
    onClose: () => void
    userId: string | null
    userName: string
    onSuccess: () => void
}

export function AdminResetPasswordModal({ isOpen, onClose, userId, userName, onSuccess }: AdminResetPasswordModalProps) {
    const [newPassword, setNewPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!userId) return

        setLoading(true)
        setError('')

        try {
            const res = await fetch(`/api/admin/team/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: newPassword }),
            })

            const data = await res.json()

            if (res.ok) {
                setNewPassword('')
                onSuccess()
                onClose()
            } else {
                setError(data.error || 'Failed to reset password')
            }
        } catch {
            setError('Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-yellow-600">
                        <Key className="h-5 w-5" />
                        Reset Password
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                        <p className="text-xs text-yellow-800">
                            You are about to reset the password for <strong>{userName}</strong>.
                            They will need this new password to log in. The old password will be invalidated immediately.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                            id="new-password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            required
                            minLength={8}
                        />
                        <p className="text-xs text-gray-500">
                            Minimum 8 characters. Must include uppercase, lowercase, and a number.
                        </p>
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || newPassword.length < 8}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reset Password'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
