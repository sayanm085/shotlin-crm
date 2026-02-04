import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// Client type for response
interface ClientResponse {
    id: string
    name: string
    type: string
    email: string | null
    phone: string | null
    currentStep: number
    totalSteps: number
    status: string
    blocked: boolean
    createdById: string | null
    createdByName: string | null
}

// GET all clients (filtered by role, status, and paginated)
export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const statusFilter = searchParams.get('status') || 'ALL' // ALL, COMPLETED, ONGOING, BLOCKED
        const search = searchParams.get('search') || ''

        const user = session.user
        const isSuperAdmin = user.role === 'SUPER_ADMIN'

        // 1. Fetch all accessible clients
        const allClients = await prisma.client.findMany({
            where: {
                AND: [
                    isSuperAdmin ? {} : { createdById: user.id },
                    search ? {
                        OR: [
                            { legalName: { contains: search, mode: 'insensitive' } },
                            { email: { contains: search, mode: 'insensitive' } },
                        ]
                    } : {}
                ]
            },
            include: {
                complianceDocuments: true,
                playConsoleStatus: true,
                createdBy: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        })

        // 2. Calculate derived status for all
        const clientsWithStep: ClientResponse[] = allClients.map((client) => {
            let currentStep = 1
            let status = 'Client Info'
            let blocked = false

            // Step 1: Client Info - always done if client exists
            currentStep = 2
            status = 'MSME Pending'

            // Step 2: MSME
            if (client.complianceDocuments?.msmeStatus === 'APPROVED') {
                currentStep = 3
                status = 'D-U-N-S Pending'
            } else if (client.complianceDocuments?.msmeStatus === 'PENDING') {
                blocked = true
                status = 'MSME Pending'
            }

            // Step 3: DUNS
            if (client.complianceDocuments?.dunsStatus === 'APPROVED' && currentStep >= 3) {
                currentStep = 4
                status = 'Play Console'
            } else if (client.complianceDocuments?.dunsStatus === 'PENDING') {
                blocked = true
                status = 'D-U-N-S Pending'
            }

            // Step 4: Play Console
            if (client.playConsoleStatus?.paymentStatus === 'COMPLETED' &&
                client.playConsoleStatus?.idVerificationStatus === 'VERIFIED' &&
                currentStep >= 4) {
                currentStep = 5
                status = 'Website'
            } else if (currentStep === 4) {
                // Check internal Play Console steps
                if (client.playConsoleStatus?.paymentStatus === 'PENDING') {
                    status = 'Play Console Payment'
                    blocked = true
                } else if (client.playConsoleStatus?.idVerificationStatus === 'PENDING' ||
                    client.playConsoleStatus?.idVerificationStatus === 'FAILED') {
                    status = 'Play Console Verification'
                    blocked = true
                }
            }

            // Check website
            const websiteComplete = client.websiteVerified

            // Step 5: Website
            if (websiteComplete && currentStep >= 5) {
                currentStep = 6
                status = 'App Development'
            }

            // Step 6: App Development
            if (client.appApproved && currentStep >= 6) {
                currentStep = 7
                status = 'App Upload'
            }

            // Step 7: Published
            if (client.published) {
                currentStep = 7
                status = 'Completed'
                blocked = false
            }

            return {
                id: client.id,
                name: client.legalName,
                type: client.companyType,
                email: client.email,
                phone: client.phone,
                currentStep,
                totalSteps: 7,
                status,
                blocked,
                createdById: client.createdById,
                createdByName: client.createdBy?.name || null,
            }
        })

        // 3. Apply Status Filter
        let filteredLists = clientsWithStep
        if (statusFilter !== 'ALL') {
            filteredLists = clientsWithStep.filter(c => {
                if (statusFilter === 'COMPLETED') return c.status === 'Completed'
                if (statusFilter === 'BLOCKED') return c.blocked
                if (statusFilter === 'ONGOING') return !c.blocked && c.status !== 'Completed'
                return true
            })
        }

        // 4. Paginate
        const totalItems = filteredLists.length
        const totalPages = Math.ceil(totalItems / limit)
        const startIndex = (page - 1) * limit
        const paginatedData = filteredLists.slice(startIndex, startIndex + limit)

        return NextResponse.json({
            data: paginatedData,
            meta: {
                total: totalItems,
                page,
                limit,
                totalPages
            }
        })
    } catch (error) {
        console.error('Error fetching clients:', error)
        return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
    }
}

// POST create new client
export async function POST(request: NextRequest) {
    try {
        // Get current user session
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        const body = await request.json()
        const { name, pan, type, email, phone } = body

        // Validate required fields
        if (!name || !pan || !type || !email) {
            return NextResponse.json(
                { error: 'Name, PAN, Type, and Email are required' },
                { status: 400 }
            )
        }

        // Create client with related records
        const client = await prisma.client.create({
            data: {
                legalName: name,
                panNumber: pan,
                companyType: type,
                email,
                phone: phone || null,
                createdById: session.user.id, // Track who created this client
                identityVerified: false,
                websiteVerified: false,
                appApproved: false,
                published: false,
                // Create empty compliance documents
                complianceDocuments: {
                    create: {
                        msmeStatus: 'NOT_CREATED',
                        dunsStatus: 'NOT_CREATED',
                    },
                },
                // Create empty play console status
                playConsoleStatus: {
                    create: {
                        accountCreated: false,
                        identityVerificationStatus: false,
                        companyVerificationStatus: false,
                        paymentProfileStatus: false,
                        consoleReady: false,
                    },
                },
            },
            include: {
                complianceDocuments: true,
                playConsoleStatus: true,
            },
        })

        return NextResponse.json(client, { status: 201 })
    } catch (error) {
        console.error('Error creating client:', error)

        // Handle unique constraint violations
        if (error instanceof Error) {
            if (error.message.includes('panNumber')) {
                return NextResponse.json({ error: 'A client with this PAN number already exists' }, { status: 400 })
            }
            if (error.message.includes('email')) {
                return NextResponse.json({ error: 'A client with this email already exists' }, { status: 400 })
            }
        }

        return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
    }
}
