'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { AdminHeader } from '@/components/admin/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import {
    Users,
    AlertTriangle,
    Clock,
    ArrowUpRight,
    TrendingUp,
    TrendingDown,
    CheckCircle2,
    XCircle,
    MoreHorizontal,
    ExternalLink,
    Minus,
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
            const res = await fetch('/api/clients?limit=100')
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

    const stats = {
        totalClients: clients.length,
        activeProjects: clients.filter(c => c.currentStep < c.totalSteps && !c.blocked).length,
        completedThisMonth: clients.filter(c => c.status === 'Completed').length,
        blockedTasks: clients.filter(c => c.blocked).length,
    }

    const recentClients = clients.slice(0, 6).map(client => ({
        id: client.id,
        name: client.name,
        type: client.type,
        status: client.blocked ? 'BLOCKED' : client.status === 'Completed' ? 'COMPLETED' : 'IN_PROGRESS',
        progress: Math.round((client.currentStep / client.totalSteps) * 100),
        step: `${client.currentStep}/${client.totalSteps}`,
    }))

    const blockedItems = clients
        .filter(c => c.blocked)
        .slice(0, 5)
        .map(c => ({
            id: c.id,
            client: c.name,
            task: c.status,
            step: `Step ${c.currentStep}`,
        }))

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return <Badge variant="outline" className="text-zinc-600 border-zinc-300 font-normal text-xs">Completed</Badge>
            case 'BLOCKED':
                return <Badge variant="destructive" className="font-normal text-xs">Blocked</Badge>
            default:
                return <Badge variant="secondary" className="font-normal text-xs">In Progress</Badge>
        }
    }

    return (
        <div className="min-h-screen bg-zinc-50">
            <AdminHeader title="Dashboard" />

            <main className="p-6 space-y-6">
                {loading ? (
                    <DashboardSkeleton />
                ) : (
                    <>
                        {/* ROW 1 — KPI Strip */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <KPICard
                                label="Total Clients"
                                value={stats.totalClients}
                                trend={null}
                            />
                            <KPICard
                                label="In Progress"
                                value={stats.activeProjects}
                                trend={stats.totalClients > 0 ? Math.round((stats.activeProjects / stats.totalClients) * 100) : null}
                                trendLabel="of total"
                            />
                            <KPICard
                                label="Completed"
                                value={stats.completedThisMonth}
                                trend={null}
                            />
                            <KPICard
                                label="Blocked"
                                value={stats.blockedTasks}
                                trend={null}
                                isAlert={stats.blockedTasks > 0}
                            />
                        </div>

                        {/* ROW 2 — Financial Panel */}
                        <Card className="border-zinc-200">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg font-medium text-zinc-900">Financial Overview</CardTitle>
                                    <Tabs value={period} onValueChange={(v) => setPeriod(v as '30' | '60' | 'all')}>
                                        <TabsList className="h-8">
                                            <TabsTrigger value="30" className="text-xs px-3 h-6">30D</TabsTrigger>
                                            <TabsTrigger value="60" className="text-xs px-3 h-6">60D</TabsTrigger>
                                            <TabsTrigger value="all" className="text-xs px-3 h-6">All</TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                </div>
                            </CardHeader>
                            <Separator />
                            <CardContent className="pt-6">
                                {financialLoading ? (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="space-y-2">
                                                <Skeleton className="h-4 w-24" />
                                                <Skeleton className="h-8 w-32" />
                                                <Skeleton className="h-3 w-20" />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:divide-x md:divide-zinc-200">
                                        {/* Account Sale */}
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground">Account Sale</p>
                                            <p className="text-3xl font-bold tabular-nums text-zinc-900">
                                                {formatCurrency(financialStats?.accountSale.total || 0)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {financialStats?.accountSale.count || 0} sale{(financialStats?.accountSale.count || 0) !== 1 ? 's' : ''} completed
                                            </p>
                                        </div>

                                        {/* Organization Liability */}
                                        <div className="md:pl-6 space-y-1">
                                            <p className="text-sm text-muted-foreground">Organization Liability</p>
                                            <p className="text-3xl font-bold tabular-nums text-zinc-900">
                                                {formatCurrency(financialStats?.orgLiability.total || 0)}
                                            </p>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                <span>Domain {formatCurrency(financialStats?.orgLiability.breakdown.domain || 0)}</span>
                                                <span className="text-zinc-300">·</span>
                                                <span>Console {formatCurrency(financialStats?.orgLiability.breakdown.playConsole || 0)}</span>
                                                <span className="text-zinc-300">·</span>
                                                <span>Other {formatCurrency(financialStats?.orgLiability.breakdown.other || 0)}</span>
                                            </div>
                                        </div>

                                        {/* Net Profit */}
                                        <div className="md:pl-6 space-y-1">
                                            <p className="text-sm text-muted-foreground">Net Profit</p>
                                            <p className={`text-3xl font-bold tabular-nums ${(financialStats?.netProfit || 0) >= 0 ? 'text-zinc-900' : 'text-red-600'}`}>
                                                {formatCurrency(financialStats?.netProfit || 0)}
                                            </p>
                                            <div className="flex items-center gap-1 text-xs">
                                                {(financialStats?.netProfit || 0) >= 0 ? (
                                                    <>
                                                        <TrendingUp className="h-3 w-3 text-emerald-600" />
                                                        <span className="text-emerald-600">Profitable</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <TrendingDown className="h-3 w-3 text-red-500" />
                                                        <span className="text-red-500">Loss</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* ROW 3 — Operations Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Recent Clients Table */}
                            <Card className="lg:col-span-2 border-zinc-200">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg font-medium text-zinc-900">Recent Clients</CardTitle>
                                        <Link href="/admin/clients" className="inline-flex items-center text-xs text-muted-foreground hover:text-zinc-900 h-7 px-2 rounded-md hover:bg-zinc-100 transition-colors">
                                            View all <ArrowUpRight className="h-3 w-3 ml-1" />
                                        </Link>
                                    </div>
                                </CardHeader>
                                <Separator />
                                <CardContent className="p-0">
                                    {recentClients.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16 text-center">
                                            <Users className="h-8 w-8 text-zinc-300 mb-3" />
                                            <p className="text-sm text-muted-foreground mb-1">No clients yet</p>
                                            <Link href="/admin/clients/new" className="text-xs text-blue-600 hover:text-blue-800 hover:underline">Add your first client</Link>
                                        </div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="hover:bg-transparent">
                                                    <TableHead className="text-xs font-medium text-zinc-500">Name</TableHead>
                                                    <TableHead className="text-xs font-medium text-zinc-500">Type</TableHead>
                                                    <TableHead className="text-xs font-medium text-zinc-500 w-32">Progress</TableHead>
                                                    <TableHead className="text-xs font-medium text-zinc-500">Status</TableHead>
                                                    <TableHead className="text-xs font-medium text-zinc-500 w-10"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {recentClients.map((client) => (
                                                    <TableRow key={client.id} className="group">
                                                        <TableCell className="font-medium text-sm text-zinc-900">
                                                            {client.name}
                                                        </TableCell>
                                                        <TableCell className="text-sm text-zinc-500">
                                                            {client.type.replace('_', ' ')}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Progress value={client.progress} className="h-1.5 w-16" />
                                                                <span className="text-xs text-muted-foreground tabular-nums">{client.step}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {getStatusBadge(client.status)}
                                                        </TableCell>
                                                        <TableCell>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <MoreHorizontal className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-36">
                                                                    <DropdownMenuItem asChild>
                                                                        <Link href={`/admin/clients/${client.id}`}>
                                                                            <ExternalLink className="h-3.5 w-3.5 mr-2" />
                                                                            View Details
                                                                        </Link>
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Blocked / Alerts Panel */}
                            <Card className="border-zinc-200">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg font-medium text-zinc-900 flex items-center gap-2">
                                        Alerts
                                        {blockedItems.length > 0 && (
                                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                                                {blockedItems.length}
                                            </Badge>
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <Separator />
                                <CardContent className="pt-4">
                                    {blockedItems.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <Minus className="h-6 w-6 text-zinc-300 mb-2" />
                                            <p className="text-sm text-muted-foreground">No blocked items</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {blockedItems.map((item, i) => (
                                                <Link
                                                    key={i}
                                                    href={`/admin/clients/${item.id}`}
                                                    className="flex items-start gap-3 p-3 rounded-md border border-zinc-200 hover:bg-zinc-50 transition-colors duration-150"
                                                >
                                                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-zinc-900 truncate">{item.client}</p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">{item.step} — {item.task}</p>
                                                    </div>
                                                    <ArrowUpRight className="h-3.5 w-3.5 text-zinc-400 shrink-0 mt-0.5" />
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* ROW 4 — System Info */}
                        <Card className="border-zinc-200">
                            <CardContent className="py-4">
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                                    <span>
                                        No task can move to &quot;In Progress&quot; unless all dependencies are marked &quot;Completed&quot;.
                                        Blocked items require client action. Manual override is disabled.
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </main>
        </div>
    )
}

/* ─── KPI Card Component ─── */
function KPICard({
    label,
    value,
    trend,
    trendLabel,
    isAlert = false,
}: {
    label: string
    value: number
    trend: number | null
    trendLabel?: string
    isAlert?: boolean
}) {
    return (
        <Card className="border-zinc-200">
            <CardContent className="pt-5 pb-4 px-5">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className={`text-3xl font-bold tabular-nums mt-1 ${isAlert ? 'text-red-600' : 'text-zinc-900'}`}>
                    {value}
                </p>
                {trend !== null && (
                    <div className="flex items-center gap-1 mt-2">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal tabular-nums">
                            {trend}%
                        </Badge>
                        {trendLabel && <span className="text-[10px] text-muted-foreground">{trendLabel}</span>}
                    </div>
                )}
                {trend === null && (
                    <div className="mt-2 h-4" />
                )}
            </CardContent>
        </Card>
    )
}

/* ─── Loading Skeleton ─── */
function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <Card key={i} className="border-zinc-200">
                        <CardContent className="pt-5 pb-4 px-5 space-y-3">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-8 w-16" />
                            <Skeleton className="h-4 w-12" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            <Card className="border-zinc-200">
                <CardContent className="pt-6 pb-6 space-y-4">
                    <Skeleton className="h-4 w-40" />
                    <div className="grid grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-8 w-28" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-zinc-200">
                    <CardContent className="pt-6 space-y-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="flex items-center gap-4">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-2 w-16" />
                                <Skeleton className="h-5 w-16" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
                <Card className="border-zinc-200">
                    <CardContent className="pt-6 space-y-4">
                        {[1, 2, 3].map(i => (
                            <Skeleton key={i} className="h-16 w-full" />
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
