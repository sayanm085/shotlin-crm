'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminHeader } from '@/components/admin/header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, ArrowRight, Building2, User, Users, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NewClientPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        name: '',
        pan: '',
        type: 'PVT_LTD',
        email: '',
        phone: '',
    })

    const handleSubmit = async () => {
        setError('')

        // Validate
        if (!formData.name || !formData.pan || !formData.email) {
            setError('Please fill all required fields')
            return
        }

        if (formData.pan.length !== 10) {
            setError('PAN must be 10 characters')
            return
        }

        setLoading(true)

        try {
            const res = await fetch('/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to create client')
            }

            const client = await res.json()
            router.push(`/admin/clients/${client.id}`)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <AdminHeader title="New Client" subtitle="Start new client workflow" />

            <main className="p-6">
                <Link href="/admin/clients">
                    <Button variant="ghost" className="mb-4 gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                </Link>

                <Card className="max-w-2xl mx-auto">
                    <CardContent className="p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Step 1: Client Information</h2>
                        <p className="text-gray-500 mb-8">Enter basic client details to start the workflow</p>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                                {error}
                            </div>
                        )}

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Legal Name *</label>
                                <Input
                                    placeholder="Company or Individual Name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">PAN Number *</label>
                                <Input
                                    placeholder="AAAAA0000A"
                                    value={formData.pan}
                                    onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                                    maxLength={10}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">Company Type *</label>
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { value: 'INDIVIDUAL', label: 'Individual', icon: User },
                                        { value: 'FIRM', label: 'Firm', icon: Users },
                                        { value: 'PVT_LTD', label: 'Pvt Ltd', icon: Building2 },
                                    ].map((type) => (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: type.value })}
                                            className={`p-4 rounded-xl border-2 transition-all ${formData.type === type.value
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <type.icon className={`h-8 w-8 mx-auto mb-2 ${formData.type === type.value ? 'text-blue-600' : 'text-gray-400'
                                                }`} />
                                            <p className={`font-medium ${formData.type === type.value ? 'text-blue-700' : 'text-gray-600'
                                                }`}>{type.label}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                                <Input
                                    type="email"
                                    placeholder="contact@company.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                <Input
                                    placeholder="+91 00000 00000"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t flex justify-end">
                            <Button onClick={handleSubmit} disabled={loading} className="gap-2">
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        Create & Continue <ArrowRight className="h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
