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
    const { data: session } = useSession()
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalClients, setTotalClients] = useState(0)

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchClients()
        }, 500)
        return () => clearTimeout(timeoutId)
    }, [page, statusFilter, searchQuery])

    const fetchClients = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                status: statusFilter,
                search: searchQuery
            })
            const res = await fetch(`/api/clients?${params}`)
            const data = await res.json()

            if (data.data && Array.isArray(data.data)) {
                setClients(data.data)
                setTotalPages(data.meta.totalPages)
                setTotalClients(data.meta.total)
            } else {
                setClients([])
                setTotalPages(1)
                setTotalClients(0)
            }
        } catch (error) {
            console.error('Error fetching clients:', error)
            setClients([])
        } finally {
            setLoading(false)
        }
    }

    const stats = {
        total: totalClients,
        // These stats are now just for the *current view* or ideally should come from a separate API
        // For now, let's just show what we have or hide them if they are confusing
        // Or better, we can keep the stats API separate later. 
        // For now, I'll remove the real-time calculation based on *fetched* clients 
        // since we don't have all clients loaded.
        // Let's rely on the cards being static or fetched separately? 
        // I will keep them as placeholders or simple counters of visible items for now 
        // to avoid breaking the UI, but note they might be inaccurate for *total* database counts.
        completed: clients.filter(c => c.status === 'Completed').length,
        inProgress: clients.filter(c => c.currentStep < c.totalSteps && !c.blocked).length,
        blocked: clients.filter(c => c.blocked).length,
    }

    return (
        <div className="min-h-screen">
            <AdminHeader title="Clients" subtitle="All client projects" />

            <main className="p-6">
                {/* Actions */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search clients..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value)
                                    setPage(1) // Reset to page 1 on search
                                }}
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
                            {['ALL', 'ONGOING', 'COMPLETED'].map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => {
                                        setStatusFilter(filter)
                                        setPage(1)
                                    }}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${statusFilter === filter
                                        ? 'bg-blue-50 text-blue-600'
                                        : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {filter.charAt(0) + filter.slice(1).toLowerCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    <Link href="/admin/clients/new">
                        <Button className="gap-2 w-full md:w-auto">
                            <Plus className="h-4 w-4" />
                            New Client
                        </Button>
                    </Link>
                </div>

                {/* Loading */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                ) : (
                    <>
                        {/* Empty State */}
                        {!loading && clients.length === 0 && (
                            <Card className="py-20">
                                <CardContent className="text-center">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Users className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No clients found</h3>
                                    <p className="text-gray-500 mb-6">Try adjusting your filters or search query</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Client List */}
                        {!loading && clients.length > 0 && (
                            <div className="space-y-3">
                                {clients.map((client) => {
                                    const TypeIcon = typeIcons[client.type as keyof typeof typeIcons] || User
                                    const progress = Math.round((client.currentStep / client.totalSteps) * 100)

                                    return (
                                        <Link key={client.id} href={`/admin/clients/${client.id}`}>
                                            <Card className={`hover:shadow-md transition-shadow cursor-pointer ${client.blocked ? 'border-red-200 bg-red-50/30' : ''}`}>
                                                <CardContent className="py-4">
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                                                {client.name.charAt(0)}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <h3 className="font-semibold text-gray-900 truncate">{client.name}</h3>
                                                                    <div className="flex items-center gap-1 text-gray-500 flex-shrink-0">
                                                                        <TypeIcon className="h-4 w-4" />
                                                                        <span className="text-xs">{client.type.replace('_', ' ')}</span>
                                                                    </div>
                                                                    {client.createdByName && (
                                                                        <div className="flex items-center gap-1 bg-purple-100 px-2 py-0.5 rounded-full flex-shrink-0">
                                                                            <UserCheck className="h-3 w-3 text-purple-600" />
                                                                            <span className="text-xs text-purple-700 truncate max-w-[100px]">{client.createdByName}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                                                    <span className="text-sm text-gray-500">Step {client.currentStep}/{client.totalSteps}:</span>
                                                                    <Badge variant={client.blocked ? 'destructive' : client.status === 'Completed' ? 'success' : 'info'}>
                                                                        {client.status}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-2 md:mt-0 pl-16 md:pl-0">
                                                            <div className="w-full md:w-32">
                                                                <ProgressBar completed={client.currentStep} total={client.totalSteps} showLabel={false} />
                                                                <p className="text-xs text-gray-500 text-center mt-1">{progress}%</p>
                                                            </div>
                                                            <ArrowUpRight className="h-5 w-5 text-gray-400 hidden md:block" />
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    )
                                })}
                            </div>
                        )}

                        {/* Pagination */}
                        <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                            <p className="text-sm text-gray-500">
                                Showing <span className="font-medium">{clients.length}</span> of <span className="font-medium">{totalClients}</span> results
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    Previous
                                </Button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        // Simple pagination logic to show current + neighbors
                                        // For now just showing first 5 or logic can be improved
                                        let p = i + 1;
                                        if (totalPages > 5 && page > 3) {
                                            p = page - 2 + i;
                                        }
                                        if (p > totalPages) return null;

                                        return (
                                            <button
                                                key={p}
                                                onClick={() => setPage(p)}
                                                className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${page === p
                                                    ? 'bg-blue-600 text-white'
                                                    : 'text-gray-600 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {p}
                                            </button>
                                        )
                                    })}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    )
}
