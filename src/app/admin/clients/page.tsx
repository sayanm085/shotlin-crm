'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { AdminHeader } from '@/components/admin/header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ProgressBar } from '@/components/shared/progress-indicators'
import {
    Plus,
    Search,
    ArrowUpRight,
    Building2,
    User,
    Users,
    Loader2,
    UserCheck,
} from 'lucide-react'
import Link from 'next/link'

interface Client {
    id: string
    name: string
    type: string
    email: string
    phone: string | null
    currentStep: number
    totalSteps: number
    status: string
    blocked: boolean
    createdById: string | null
    createdByName: string | null
}

interface TeamMember {
    id: string
    name: string | null
    role: string
}

const typeIcons = {
    PVT_LTD: Building2,
    FIRM: Users,
    INDIVIDUAL: User,
}

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        fetchClients()
    }, [])

    const fetchClients = async () => {
        try {
            const res = await fetch('/api/clients')
            const data = await res.json()
            // Ensure data is an array before setting
            if (Array.isArray(data)) {
                setClients(data)
            } else {
                console.error('API returned non-array:', data)
                setClients([])
            }
        } catch (error) {
            console.error('Error fetching clients:', error)
            setClients([])
        } finally {
            setLoading(false)
        }
    }

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const stats = {
        total: clients.length,
        completed: clients.filter(c => c.currentStep === c.totalSteps && c.status === 'Completed').length,
        inProgress: clients.filter(c => c.currentStep < c.totalSteps && !c.blocked).length,
        blocked: clients.filter(c => c.blocked).length,
    }

    return (
        <div className="min-h-screen">
            <AdminHeader title="Clients" subtitle="All client projects" />

            <main className="p-6">
                {/* Actions */}
                <div className="flex items-center justify-between mb-6">
                    <div className="relative w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search clients..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Link href="/admin/clients/new">
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            New Client
                        </Button>
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <Card className="bg-blue-500 text-white border-0">
                        <CardContent className="py-4">
                            <p className="text-blue-100 text-sm">Total</p>
                            <p className="text-3xl font-bold">{stats.total}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-green-500 text-white border-0">
                        <CardContent className="py-4">
                            <p className="text-green-100 text-sm">Completed</p>
                            <p className="text-3xl font-bold">{stats.completed}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-yellow-500 text-white border-0">
                        <CardContent className="py-4">
                            <p className="text-yellow-100 text-sm">In Progress</p>
                            <p className="text-3xl font-bold">{stats.inProgress}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-red-500 text-white border-0">
                        <CardContent className="py-4">
                            <p className="text-red-100 text-sm">Blocked</p>
                            <p className="text-3xl font-bold">{stats.blocked}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                )}

                {/* Empty State */}
                {!loading && clients.length === 0 && (
                    <Card className="py-20">
                        <CardContent className="text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No clients yet</h3>
                            <p className="text-gray-500 mb-6">Get started by adding your first client</p>
                            <Link href="/admin/clients/new">
                                <Button className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Add First Client
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}

                {/* Client List */}
                {!loading && filteredClients.length > 0 && (
                    <div className="space-y-3">
                        {filteredClients.map((client) => {
                            const TypeIcon = typeIcons[client.type as keyof typeof typeIcons] || User
                            const progress = Math.round((client.currentStep / client.totalSteps) * 100)

                            return (
                                <Link key={client.id} href={`/admin/clients/${client.id}`}>
                                    <Card className={`hover:shadow-md transition-shadow cursor-pointer ${client.blocked ? 'border-red-200 bg-red-50/30' : ''}`}>
                                        <CardContent className="py-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                                                        {client.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-semibold text-gray-900">{client.name}</h3>
                                                            <div className="flex items-center gap-1 text-gray-500">
                                                                <TypeIcon className="h-4 w-4" />
                                                                <span className="text-xs">{client.type.replace('_', ' ')}</span>
                                                            </div>
                                                            {client.createdByName && (
                                                                <div className="flex items-center gap-1 bg-purple-100 px-2 py-0.5 rounded-full">
                                                                    <UserCheck className="h-3 w-3 text-purple-600" />
                                                                    <span className="text-xs text-purple-700">{client.createdByName}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-sm text-gray-500">Step {client.currentStep}/{client.totalSteps}:</span>
                                                            <Badge variant={client.blocked ? 'destructive' : client.status === 'Completed' ? 'success' : 'info'}>
                                                                {client.status}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6">
                                                    <div className="w-32">
                                                        <ProgressBar completed={client.currentStep} total={client.totalSteps} showLabel={false} />
                                                        <p className="text-xs text-gray-500 text-center mt-1">{progress}%</p>
                                                    </div>
                                                    <ArrowUpRight className="h-5 w-5 text-gray-400" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </main>
        </div>
    )
}
