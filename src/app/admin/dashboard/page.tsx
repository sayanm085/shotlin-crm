'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { AdminHeader } from '@/components/admin/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProgressRing, ProgressBar } from '@/components/shared/progress-indicators'
import {
    Users,
    CheckCircle,
    AlertTriangle,
    XCircle,
    Clock,
    ArrowUpRight,
    TrendingUp,
    TrendingDown,
    Loader2,
    Zap,
    BarChart3,
    Calendar,
    Activity,
    DollarSign,
    Wallet,
    PiggyBank,
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
}

interface FinancialStats {
    accountSale: { total: number; count: number }
    orgLiability: { total: number; breakdown: { domain: number; playConsole: number; other: number } }
    netProfit: number
    period: string
}

export default function AdminDashboard() {
    const { data: session } = useSession()
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState<'30' | '60' | 'all'>('all')
    const [financialStats, setFinancialStats] = useState<FinancialStats | null>(null)
    const [financialLoading, setFinancialLoading] = useState(true)

    useEffect(() => {
        fetchClients()
    }, [])

    useEffect(() => {
        fetchFinancialStats()
    }, [period])

    const fetchClients = async () => {
        try {
            const res = await fetch('/api/clients?limit=100') // Fetch more for dashboard stats
            const data = await res.json()

            if (data.data && Array.isArray(data.data)) {
                setClients(data.data)
            } else if (Array.isArray(data)) {
                setClients(data)
            } else {
                setClients([])
            }
        } catch (error) {
            console.error('Error fetching clients:', error)
            setClients([])
        } finally {
            setLoading(false)
        }
    }

    const fetchFinancialStats = async () => {
        setFinancialLoading(true)
        try {
            const res = await fetch(`/api/dashboard/stats?period=${period}`)
            const data = await res.json()
            setFinancialStats(data)
        } catch (error) {
            console.error('Error fetching financial stats:', error)
        } finally {
            setFinancialLoading(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    // Calculate real stats
    const stats = {
        totalClients: clients.length,
        activeProjects: clients.filter(c => c.currentStep < c.totalSteps && !c.blocked).length,
        completedThisMonth: clients.filter(c => c.status === 'Completed').length,
        blockedTasks: clients.filter(c => c.blocked).length,
    }

    // Recent clients (last 5)
    const recentClients = clients.slice(0, 5).map(client => ({
        id: client.id,
        name: client.name,
        type: client.type,
        status: client.blocked ? 'BLOCKED' : client.status === 'Completed' ? 'COMPLETED' : 'IN_PROGRESS',
        progress: Math.round((client.currentStep / client.totalSteps) * 100),
    }))

    // Blocked items
    const blockedItems = clients
        .filter(c => c.blocked)
        .slice(0, 3)
        .map(c => ({
            client: c.name,
            task: c.status,
            days: Math.floor(Math.random() * 10) + 1,
            type: 'pending',
        }))

    const userName = session?.user?.name || 'Admin'
    const greeting = new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'

    const periodLabels: Record<string, string> = { '30': '30 Days', '60': '60 Days', 'all': 'All Time' }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <AdminHeader
                title="Dashboard"
                subtitle="Overview of all client operations"
            />

            <main className="p-6">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                ) : (
                    <>
                        {/* Hero Banner */}
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 mb-8 shadow-xl">
                            {/* Background Pattern */}
                            <div className="absolute inset-0 opacity-10">
                                <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl" />
                                <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full blur-3xl" />
                            </div>

                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <h2 className="text-3xl font-bold text-white mb-2">
                                        {greeting}, {userName}! 👋
                                    </h2>
                                    <p className="text-blue-100 text-lg">
                                        Here&apos;s what&apos;s happening with your clients today
                                    </p>
                                </div>
                                <div className="hidden lg:flex items-center gap-4">
                                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-white">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Calendar className="h-4 w-4" />
                                            <span className="text-sm opacity-80">Today</span>
                                        </div>
                                        <p className="text-2xl font-bold">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                                    </div>
                                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-white">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Activity className="h-4 w-4" />
                                            <span className="text-sm opacity-80">Active</span>
                                        </div>
                                        <p className="text-2xl font-bold">{stats.activeProjects}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid - Glass Effect */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                            <Card className="relative overflow-hidden border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full" />
                                <CardContent className="pt-6 relative">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Total Clients</p>
                                            <p className="text-4xl font-bold text-gray-900 mt-2">{stats.totalClients}</p>
                                        </div>
                                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                                            <Users className="h-7 w-7 text-white" />
                                        </div>
                                    </div>
                                    <div className="flex items-center mt-4 text-sm">
                                        <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                                        <span className="text-green-600 font-medium">All time</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="relative overflow-hidden border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-bl-full" />
                                <CardContent className="pt-6 relative">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">In Progress</p>
                                            <p className="text-4xl font-bold text-gray-900 mt-2">{stats.activeProjects}</p>
                                        </div>
                                        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                                            <Clock className="h-7 w-7 text-white" />
                                        </div>
                                    </div>
                                    <ProgressBar
                                        completed={stats.activeProjects}
                                        total={stats.totalClients || 1}
                                        showLabel={false}
                                        className="mt-4"
                                    />
                                </CardContent>
                            </Card>

                            <Card className="relative overflow-hidden border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-bl-full" />
                                <CardContent className="pt-6 relative">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Completed</p>
                                            <p className="text-4xl font-bold text-gray-900 mt-2">{stats.completedThisMonth}</p>
                                        </div>
                                        <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
                                            <CheckCircle className="h-7 w-7 text-white" />
                                        </div>
                                    </div>
                                    <p className="text-sm text-green-600 font-medium mt-4 flex items-center gap-1">
                                        <Zap className="h-4 w-4" /> Successfully published
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-red-50 to-orange-50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-bl-full" />
                                <CardContent className="pt-6 relative">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-red-600">Blocked</p>
                                            <p className="text-4xl font-bold text-red-700 mt-2">{stats.blockedTasks}</p>
                                        </div>
                                        <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30">
                                            <XCircle className="h-7 w-7 text-white" />
                                        </div>
                                    </div>
                                    <p className="text-sm text-red-600 mt-4 font-medium flex items-center gap-1">
                                        <AlertTriangle className="h-4 w-4" /> Require action
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* ========== FINANCIAL OVERVIEW ========== */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                                        <DollarSign className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">Financial Overview</h3>
                                        <p className="text-sm text-gray-500">Account sales, liabilities & profit</p>
                                    </div>
                                </div>

                                {/* Period Filter Pills */}
                                <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
                                    {(['30', '60', 'all'] as const).map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => setPeriod(p)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${period === p
                                                    ? 'bg-white text-gray-900 shadow-md'
                                                    : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            {periodLabels[p]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {financialLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                                    {/* Account Sale Card */}
                                    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full" />
                                        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-tr-full" />
                                        <CardContent className="pt-6 pb-6 relative">
                                            <div className="flex items-center justify-between mb-4">
                                                <p className="text-emerald-100 text-sm font-medium">Account Sale</p>
                                                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                                    <DollarSign className="h-5 w-5 text-white" />
                                                </div>
                                            </div>
                                            <p className="text-3xl font-bold text-white mb-1">
                                                {formatCurrency(financialStats?.accountSale.total || 0)}
                                            </p>
                                            <p className="text-emerald-100 text-sm">
                                                {financialStats?.accountSale.count || 0} sale{(financialStats?.accountSale.count || 0) !== 1 ? 's' : ''} completed
                                            </p>
                                        </CardContent>
                                    </Card>

                                    {/* Organization Liability Card */}
                                    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-orange-500 to-red-500 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full" />
                                        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-tr-full" />
                                        <CardContent className="pt-6 pb-6 relative">
                                            <div className="flex items-center justify-between mb-4">
                                                <p className="text-orange-100 text-sm font-medium">Organization Liability</p>
                                                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                                    <Wallet className="h-5 w-5 text-white" />
                                                </div>
                                            </div>
                                            <p className="text-3xl font-bold text-white mb-1">
                                                {formatCurrency(financialStats?.orgLiability.total || 0)}
                                            </p>
                                            <div className="flex items-center gap-3 text-orange-100 text-xs mt-2">
                                                <span>Domain: {formatCurrency(financialStats?.orgLiability.breakdown.domain || 0)}</span>
                                                <span>•</span>
                                                <span>Console: {formatCurrency(financialStats?.orgLiability.breakdown.playConsole || 0)}</span>
                                                <span>•</span>
                                                <span>Other: {formatCurrency(financialStats?.orgLiability.breakdown.other || 0)}</span>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Net Profit Card */}
                                    <Card className={`relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 ${(financialStats?.netProfit || 0) >= 0
                                            ? 'bg-gradient-to-br from-blue-600 to-indigo-700'
                                            : 'bg-gradient-to-br from-red-600 to-rose-700'
                                        }`}>
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full" />
                                        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-tr-full" />
                                        <CardContent className="pt-6 pb-6 relative">
                                            <div className="flex items-center justify-between mb-4">
                                                <p className="text-blue-100 text-sm font-medium">Net Profit</p>
                                                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                                    <PiggyBank className="h-5 w-5 text-white" />
                                                </div>
                                            </div>
                                            <p className="text-3xl font-bold text-white mb-1">
                                                {formatCurrency(financialStats?.netProfit || 0)}
                                            </p>
                                            <div className="flex items-center gap-1 text-sm mt-1">
                                                {(financialStats?.netProfit || 0) >= 0 ? (
                                                    <>
                                                        <TrendingUp className="h-4 w-4 text-green-300" />
                                                        <span className="text-green-300 font-medium">Profitable</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <TrendingDown className="h-4 w-4 text-red-300" />
                                                        <span className="text-red-300 font-medium">Loss</span>
                                                    </>
                                                )}
                                                <span className="text-white/60 ml-1">• {periodLabels[period]}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Recent Clients */}
                            <Card className="lg:col-span-2 border-0 bg-white/80 backdrop-blur-sm shadow-lg">
                                <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                            <BarChart3 className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <CardTitle>Recent Clients</CardTitle>
                                    </div>
                                    <Link href="/admin/clients" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium">
                                        View all <ArrowUpRight className="h-4 w-4" />
                                    </Link>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    {recentClients.length === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Users className="h-8 w-8 text-gray-400" />
                                            </div>
                                            <p className="text-gray-500">No clients yet</p>
                                            <Link href="/admin/clients/new" className="text-blue-600 hover:underline text-sm">
                                                Add your first client →
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {recentClients.map((client) => (
                                                <Link
                                                    key={client.id}
                                                    href={`/admin/clients/${client.id}`}
                                                    className="flex items-center justify-between p-4 bg-gray-50/80 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:shadow-md group"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-105 transition-transform">
                                                            {client.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{client.name}</p>
                                                            <p className="text-sm text-gray-500">{client.type.replace('_', ' ')}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <ProgressRing percentage={client.progress} size={48} strokeWidth={4} />
                                                        <Badge
                                                            variant={
                                                                client.status === 'COMPLETED'
                                                                    ? 'success'
                                                                    : client.status === 'BLOCKED'
                                                                        ? 'destructive'
                                                                        : 'info'
                                                            }
                                                        >
                                                            {client.status.replace('_', ' ')}
                                                        </Badge>
                                                        <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Blocked Items */}
                            <Card className="border-0 bg-gradient-to-br from-red-50/80 to-orange-50/80 backdrop-blur-sm shadow-lg">
                                <CardHeader className="border-b border-red-100/50 pb-4">
                                    <CardTitle className="flex items-center gap-2 text-red-700">
                                        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                                            <AlertTriangle className="h-5 w-5 text-red-600" />
                                        </div>
                                        Blocked Items
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    {blockedItems.length === 0 ? (
                                        <div className="text-center py-8">
                                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <CheckCircle className="h-8 w-8 text-green-600" />
                                            </div>
                                            <p className="text-green-600 font-medium">All clear! 🎉</p>
                                            <p className="text-sm text-gray-500">No blocked items</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {blockedItems.map((item, i) => (
                                                <div
                                                    key={i}
                                                    className="p-4 bg-white/80 border border-red-200/50 rounded-xl shadow-sm hover:shadow-md transition-all"
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <p className="font-medium text-gray-900">{item.client}</p>
                                                        <Badge variant="client">CLIENT</Badge>
                                                    </div>
                                                    <p className="text-sm text-red-700">{item.task}</p>
                                                    <p className="text-xs text-gray-500 mt-2">Blocked for {item.days} days</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <Link
                                        href="/admin/clients?filter=blocked"
                                        className="block mt-4 text-center text-sm text-red-600 hover:text-red-700 font-medium"
                                    >
                                        View all blocked items →
                                    </Link>
                                </CardContent>
                            </Card>
                        </div>

                        {/* System Rules - Redesigned */}
                        <Card className="mt-8 border-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white shadow-2xl overflow-hidden">
                            <CardContent className="py-6 relative">
                                <div className="absolute inset-0 opacity-5">
                                    <div className="absolute top-0 left-1/4 w-32 h-32 bg-blue-500 rounded-full blur-3xl" />
                                    <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-purple-500 rounded-full blur-3xl" />
                                </div>
                                <div className="relative flex items-center gap-6">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                                        <span className="text-3xl">🔒</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-xl mb-2">System Operating Rules</h3>
                                        <p className="text-gray-300 leading-relaxed">
                                            NO task can move to &quot;In Progress&quot; unless all dependencies are marked &quot;Completed&quot;.
                                            Any blocked item = CLIENT responsibility. Manual override = DISABLED.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </main>
        </div>
    )
}
