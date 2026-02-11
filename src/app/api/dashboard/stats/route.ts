import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
    const session = await auth()

    if (!session?.user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'all' // '30', '60', 'all'

    // Build date filter based on period
    let dateFilter: { gte?: Date } = {}
    if (period === '30') {
        dateFilter = { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    } else if (period === '60') {
        dateFilter = { gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) }
    }

    try {
        // Build client filter with role-based access control
        const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
        const baseClientFilter: Record<string, unknown> = {}
        if (period !== 'all') {
            baseClientFilter.createdAt = dateFilter
        }
        // Non-admin users only see their own clients' data
        if (!isSuperAdmin) {
            baseClientFilter.createdById = session.user.id
        }
        const clientFilter = baseClientFilter

        // Aggregate Account Sale data
        const accountSaleData = await prisma.playConsoleStatus.findMany({
            where: {
                accountSaleComplete: true,
                client: clientFilter,
            },
            select: {
                accountSaleAmount: true,
            },
        })

        const accountSaleTotal = accountSaleData.reduce(
            (sum, item) => sum + (item.accountSaleAmount || 0),
            0
        )
        const accountSaleCount = accountSaleData.length

        // Aggregate Organization Liability data
        const orgCostData = await prisma.organizationCost.findMany({
            where: {
                client: clientFilter,
            },
            select: {
                domainCost: true,
                playConsoleFee: true,
                otherCosts: true,
            },
        })

        const orgLiabilityBreakdown = orgCostData.reduce(
            (acc, item) => ({
                domain: acc.domain + (item.domainCost || 0),
                playConsole: acc.playConsole + (item.playConsoleFee || 0),
                other: acc.other + (item.otherCosts || 0),
            }),
            { domain: 0, playConsole: 0, other: 0 }
        )

        const orgLiabilityTotal =
            orgLiabilityBreakdown.domain +
            orgLiabilityBreakdown.playConsole +
            orgLiabilityBreakdown.other

        const netProfit = accountSaleTotal - orgLiabilityTotal

        return NextResponse.json({
            accountSale: {
                total: accountSaleTotal,
                count: accountSaleCount,
            },
            orgLiability: {
                total: orgLiabilityTotal,
                breakdown: orgLiabilityBreakdown,
            },
            netProfit,
            period,
        })
    } catch (error) {
        console.error('Dashboard stats error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch dashboard stats' },
            { status: 500 }
        )
    }
}
